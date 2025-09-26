import { exec } from "child_process";
import * as path from "path";

export interface FileStatus {
  fileName: string;
  filePath: string;
  status: "added" | "modified" | "deleted" | "renamed" | "untracked";
  statusSymbol: string;
}

export interface GitChanges {
  diff: string;
  changedFiles: string[];
  hasChanges: boolean;
  stagedFiles: FileStatus[];
  modifiedFiles: FileStatus[];
}

export class GitService {
  constructor(private workspaceRoot: string) {}

  async getStagedChanges(): Promise<GitChanges> {
    const diff = await this.executeGitCommand("git diff --cached");
    const stagedFiles = await this.executeGitCommand(
      "git diff --cached --name-only"
    );
    const stagedStatus = await this.executeGitCommand(
      "git diff --cached --name-status"
    );

    const changedFiles = stagedFiles
      .split("\n")
      .filter((file) => file.trim() !== "");
    const stagedFileStatuses = this.parseFileStatus(stagedStatus);

    return {
      diff,
      changedFiles,
      hasChanges: diff.trim() !== "",
      stagedFiles: stagedFileStatuses,
      modifiedFiles: [],
    };
  }

  async getAllChanges(): Promise<GitChanges> {
    const diff = await this.executeGitCommand("git diff");
    const modifiedFiles = await this.executeGitCommand("git diff --name-only");
    const modifiedStatus = await this.executeGitCommand(
      "git diff --name-status"
    );
    const untrackedFiles = await this.executeGitCommand(
      "git ls-files --others --exclude-standard"
    );

    const changedFiles = modifiedFiles
      .split("\n")
      .filter((file) => file.trim() !== "");
    const modifiedFileStatuses = this.parseFileStatus(modifiedStatus);

    // Add untracked files
    const untrackedList = untrackedFiles
      .split("\n")
      .filter((file) => file.trim() !== "");
    const untrackedStatuses = untrackedList.map((file) => ({
      fileName: path.basename(file),
      filePath: file,
      status: "untracked" as const,
      statusSymbol: "??",
    }));

    return {
      diff,
      changedFiles: [...changedFiles, ...untrackedList],
      hasChanges: diff.trim() !== "" || untrackedList.length > 0,
      stagedFiles: [],
      modifiedFiles: [...modifiedFileStatuses, ...untrackedStatuses],
    };
  }

  async getFullGitStatus(): Promise<GitChanges> {
    const stagedChanges = await this.getStagedChanges();
    const allChanges = await this.getAllChanges();

    return {
      diff: stagedChanges.diff || allChanges.diff,
      changedFiles: [...stagedChanges.changedFiles, ...allChanges.changedFiles],
      hasChanges: stagedChanges.hasChanges || allChanges.hasChanges,
      stagedFiles: stagedChanges.stagedFiles,
      modifiedFiles: allChanges.modifiedFiles,
    };
  }

  private parseFileStatus(statusOutput: string): FileStatus[] {
    if (!statusOutput.trim()) {
      return [];
    }

    return statusOutput
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        const parts = line.split("\t");
        const statusSymbol = parts[0];
        const filePath = parts[1] || "";

        let status: FileStatus["status"] = "modified";
        switch (statusSymbol.charAt(0)) {
          case "A":
            status = "added";
            break;
          case "M":
            status = "modified";
            break;
          case "D":
            status = "deleted";
            break;
          case "R":
            status = "renamed";
            break;
          default:
            status = "modified";
        }

        return {
          fileName: path.basename(filePath),
          filePath,
          status,
          statusSymbol,
        };
      });
  }

  private executeGitCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.workspaceRoot }, (err, stdout, stderr) => {
        if (err) {
          if (stderr.includes("not a git repository")) {
            reject("This workspace is not a Git repository.");
          } else {
            // For some git commands, no output is normal (not an error)
            resolve("");
          }
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

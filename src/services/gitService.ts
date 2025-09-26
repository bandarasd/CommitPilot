import { exec } from "child_process";
import * as vscode from "vscode";

export interface GitChanges {
  diff: string;
  changedFiles: string[];
  hasChanges: boolean;
}

export class GitService {
  constructor(private workspaceRoot: string) {}

  async getStagedChanges(): Promise<GitChanges> {
    const diff = await this.executeGitCommand("git diff --cached");
    const stagedFiles = await this.executeGitCommand(
      "git diff --cached --name-only"
    );

    const changedFiles = stagedFiles
      .split("\n")
      .filter((file) => file.trim() !== "");

    return {
      diff,
      changedFiles,
      hasChanges: diff.trim() !== "",
    };
  }

  async getAllChanges(): Promise<GitChanges> {
    const diff = await this.executeGitCommand("git diff");
    const modifiedFiles = await this.executeGitCommand("git diff --name-only");

    const changedFiles = modifiedFiles
      .split("\n")
      .filter((file) => file.trim() !== "");

    return {
      diff,
      changedFiles,
      hasChanges: diff.trim() !== "",
    };
  }

  private executeGitCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.workspaceRoot }, (err, stdout, stderr) => {
        if (err) {
          if (stderr.includes("not a git repository")) {
            reject("This workspace is not a Git repository.");
          } else {
            reject(`Error running ${command}: ${stderr || err.message}`);
          }
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

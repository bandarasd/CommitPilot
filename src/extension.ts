import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from "path";
import { generateCommitMessageCommand } from "./commands/generateCommitMessage";

function getStagedGitDiff(workspaceRoot: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Run Git diff for staged changes in the workspace directory
    exec("git diff --cached", { cwd: workspaceRoot }, (err, stdout, stderr) => {
      if (err) {
        // Check if it's a "not a git repository" error
        if (stderr.includes("not a git repository")) {
          reject("This workspace is not a Git repository.");
        } else {
          reject(`Error running git diff: ${stderr || err.message}`);
        }
      } else {
        resolve(stdout);
      }
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "commitpilot.getDiff",
    async () => {
      try {
        // Get the workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          vscode.window.showErrorMessage("No workspace folder is open.");
          return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const diff = await getStagedGitDiff(workspaceRoot);

        if (!diff.trim()) {
          vscode.window.showInformationMessage("No staged changes found!");
          return;
        }

        // Create and show the diff in a new document
        const doc = await vscode.workspace.openTextDocument({
          content: diff,
          language: "diff",
        });

        await vscode.window.showTextDocument(doc, {
          preview: false,
          viewColumn: vscode.ViewColumn.Beside,
        });

        vscode.window.showInformationMessage(
          "Staged Git diff opened in new tab!"
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to get Git diff: ${error}`);
      }
    }
  );

  // New AI commit message command
  let generateCommitDisposable = vscode.commands.registerCommand(
    "commitpilot.generateCommitMessage",
    () => generateCommitMessageCommand(context)
  );

  context.subscriptions.push(disposable, generateCommitDisposable);
}

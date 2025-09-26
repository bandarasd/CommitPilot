import * as vscode from "vscode";
import { AIService, CommitMessageResult } from "../services/aiService";
import { GitService } from "../services/gitService";

export async function generateCommitMessageCommand(
  context: vscode.ExtensionContext
) {
  try {
    // Get workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("No workspace folder is open.");
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const gitService = new GitService(workspaceRoot);
    const aiService = new AIService(context);

    // Show progress indicator
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating AI commit message...",
        cancellable: false,
      },
      async (progress) => {
        progress.report({
          increment: 25,
          message: "Analyzing staged changes...",
        });

        // Get staged changes first, fallback to all changes if nothing staged
        let gitChanges = await gitService.getStagedChanges();

        if (!gitChanges.hasChanges) {
          const useAllChanges = await vscode.window.showQuickPick(
            ["Yes", "No"],
            {
              placeHolder: "No staged changes found. Use all modified files?",
              ignoreFocusOut: true,
            }
          );

          if (useAllChanges === "Yes") {
            gitChanges = await gitService.getAllChanges();
          } else {
            vscode.window.showInformationMessage(
              "Please stage some changes first."
            );
            return;
          }
        }

        if (!gitChanges.hasChanges) {
          vscode.window.showInformationMessage("No changes found to commit.");
          return;
        }

        progress.report({
          increment: 50,
          message: "Generating commit message with AI...",
        });

        // Generate commit message using AI
        const commitMessage = await aiService.generateCommitMessage(
          gitChanges.diff,
          gitChanges.changedFiles
        );

        progress.report({ increment: 25, message: "Presenting options..." });

        // Show the generated commit message options
        await showCommitMessageOptions(commitMessage, context);
      }
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to generate commit message: ${error}`
    );
  }
}

async function showCommitMessageOptions(
  commitMessage: CommitMessageResult,
  context: vscode.ExtensionContext
) {
  const fullMessage = `${commitMessage.summary}\n\n${commitMessage.description}`;

  const options = [
    {
      label: "📋 Copy to Clipboard",
      description: commitMessage.summary,
      action: "copy",
    },
    {
      label: "📝 Open in New File",
      description: "Edit before using",
      action: "edit",
    },
    {
      label: "🔄 Regenerate",
      description: "Generate a new message",
      action: "regenerate",
    },
  ];

  const selection = await vscode.window.showQuickPick(options, {
    placeHolder: "Choose what to do with the generated commit message:",
    ignoreFocusOut: true,
  });

  if (!selection) {
    return;
  }

  switch (selection.action) {
    case "copy":
      await vscode.env.clipboard.writeText(fullMessage);
      vscode.window.showInformationMessage(
        "Commit message copied to clipboard!"
      );
      break;

    case "edit":
      const doc = await vscode.workspace.openTextDocument({
        content: fullMessage,
        language: "plaintext",
      });
      await vscode.window.showTextDocument(doc);
      break;

    case "regenerate":
      await generateCommitMessageCommand(context); // Recursive call with context
      break;
  }
}

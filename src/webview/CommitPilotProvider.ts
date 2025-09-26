import * as vscode from 'vscode';
import { GitService } from '../services/gitService';
import { AIService } from '../services/aiService';

export class CommitPilotProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'commitpilot.sidebar';

  private _view?: vscode.WebviewView;
  private gitService?: GitService;
  private aiService?: AIService;

  constructor(private readonly _extensionUri: vscode.Uri, private readonly context: vscode.ExtensionContext) {
    // Initialize services
    this.initializeServices();
  }

  private initializeServices() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.gitService = new GitService(workspaceFolders[0].uri.fsPath);
      this.aiService = new AIService(this.context);
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'generateCommitMessage':
          await this.handleGenerateCommitMessage();
          break;
        case 'getGitStatus':
          await this.handleGetGitStatus();
          break;
        case 'refresh':
          await this.refresh();
          break;
        case 'openInEditor':
          await this.handleOpenInEditor(data.content);
          break;
      }
    });

    // Initial load
    this.refresh();
  }

  private async handleGenerateCommitMessage() {
    if (!this.gitService || !this.aiService) {
      this.postMessage({
        type: 'error',
        message: 'Git service not initialized. Please open a workspace.'
      });
      return;
    }

    try {
      this.postMessage({
        type: 'status',
        message: 'Analyzing changes...',
        loading: true
      });

      // Get changes
      let gitChanges = await this.gitService.getStagedChanges();
      
      if (!gitChanges.hasChanges) {
        gitChanges = await this.gitService.getAllChanges();
      }

      if (!gitChanges.hasChanges) {
        this.postMessage({
          type: 'status',
          message: 'No changes found to commit.',
          loading: false
        });
        return;
      }

      this.postMessage({
        type: 'status',
        message: 'Generating AI commit message...',
        loading: true
      });

      // Generate commit message
      const commitMessage = await this.aiService.generateCommitMessage(
        gitChanges.diff,
        gitChanges.changedFiles
      );

      this.postMessage({
        type: 'commitMessage',
        data: {
          summary: commitMessage.summary,
          description: commitMessage.description,
          type: commitMessage.type,
          fullMessage: `${commitMessage.summary}\n\n${commitMessage.description}`
        }
      });

    } catch (error) {
      this.postMessage({
        type: 'error',
        message: `Failed to generate commit message: ${error}`
      });
    }
  }

  private async handleGetGitStatus() {
    if (!this.gitService) {
      this.postMessage({
        type: 'gitStatus',
        data: {
          staged: [],
          modified: [],
          hasChanges: false
        }
      });
      return;
    }

    try {
      const stagedChanges = await this.gitService.getStagedChanges();
      const allChanges = await this.gitService.getAllChanges();

      this.postMessage({
        type: 'gitStatus',
        data: {
          staged: stagedChanges.changedFiles,
          modified: allChanges.changedFiles,
          hasChanges: stagedChanges.hasChanges || allChanges.hasChanges,
          stagedCount: stagedChanges.changedFiles.length,
          modifiedCount: allChanges.changedFiles.length
        }
      });
    } catch (error) {
      this.postMessage({
        type: 'error',
        message: `Failed to get git status: ${error}`
      });
    }
  }

  private async handleOpenInEditor(content: string) {
    try {
      const doc = await vscode.workspace.openTextDocument({
        content: content,
        language: "plaintext"
      });
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      this.postMessage({
        type: 'error',
        message: `Failed to open in editor: ${error}`
      });
    }
  }

  private async refresh() {
    // Re-initialize services in case workspace changed
    this.initializeServices();
    await this.handleGetGitStatus();
  }

  private postMessage(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'main.css'));

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet">
				<title>CommitPilot</title>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h2>🚁 CommitPilot</h2>
						<p class="subtitle">AI-Powered Commit Messages</p>
					</div>

					<div class="status-section">
						<div id="git-status">
							<div class="status-item">
								<span class="icon">📋</span>
								<span id="staged-count">0 staged</span>
							</div>
							<div class="status-item">
								<span class="icon">📝</span>
								<span id="modified-count">0 modified</span>
							</div>
						</div>
						<button id="refresh-btn" class="btn btn-secondary">🔄 Refresh</button>
					</div>

					<div class="actions-section">
						<button id="generate-btn" class="btn btn-primary" disabled>
							<span class="btn-text">✨ Generate Commit Message</span>
							<span class="loading-spinner" style="display: none;">⏳</span>
						</button>
					</div>

					<div id="status-message" class="status-message" style="display: none;"></div>

					<div id="commit-result" class="result-section" style="display: none;">
						<div class="result-header">
							<h3>Generated Message</h3>
							<div class="result-actions">
								<button id="copy-btn" class="btn btn-small">📋 Copy</button>
								<button id="edit-btn" class="btn btn-small">📝 Edit</button>
							</div>
						</div>
						<div class="commit-preview">
							<div class="commit-summary" id="commit-summary"></div>
							<div class="commit-description" id="commit-description"></div>
						</div>
					</div>

					<div class="footer">
						<small>Powered by OpenRouter & Grok AI</small>
					</div>
				</div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
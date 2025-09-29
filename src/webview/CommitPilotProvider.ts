import * as vscode from "vscode";
import { GitService } from "../services/gitService";
import { AIService } from "../services/aiService";

export class CommitPilotProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "commitpilot.sidebar";

  private _view?: vscode.WebviewView;
  private gitService?: GitService;
  private aiService?: AIService;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {
    this.initializeServices();
  }

  // Helper functions to reduce code duplication
  private checkGitService(
    errorMessage: string = "Git service not initialized. Please open a workspace."
  ): boolean {
    if (!this.gitService) {
      this.postMessage({ type: "error", message: errorMessage });
      return false;
    }
    return true;
  }

  private showStatus(
    message: string,
    loading: boolean = false,
    hideAfter?: number
  ) {
    this.postMessage({ type: "status", message, loading });
    if (hideAfter) {
      setTimeout(
        () => this.postMessage({ type: "status", message: "", loading: false }),
        hideAfter
      );
    }
  }

  private showError(message: string) {
    this.postMessage({ type: "error", message });
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
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "generateCommitMessage":
          await this.handleGenerateCommitMessage();
          break;
        case "getGitStatus":
          await this.handleGetGitStatus();
          break;
        case "refresh":
          await this.refresh();
          break;
        case "openInEditor":
          await this.handleOpenInEditor(data.content);
          break;
        case "openFile":
          await this.handleOpenFile(data.filePath);
          break;
        case "stageAllChanges":
          await this.handleStageAllChanges();
          break;
        case "commitChanges":
          await this.handleCommitChanges(data.message);
          break;
        case "openSettings":
          await vscode.commands.executeCommand('workbench.action.openSettings', 'commitpilot');
          break;
        case "stageFile":
          await this.handleStageFile(data.filePath);
          break;
      }
    });

    // Initial load
    this.refresh();
  }

  private async handleGenerateCommitMessage() {
    // Check if API key is configured
    const config = vscode.workspace.getConfiguration('commitpilot');
    const apiKey = config.get<string>('openaiApiKey');
    
    if (!apiKey || apiKey.trim() === '') {
      this.showError('OpenAI API key not configured. Please set your API key in settings.');
      this.postMessage({
        type: 'showApiKeySetup',
        message: 'API key required'
      });
      return;
    }

    if (!this.gitService || !this.aiService) {
      if (!this.gitService) {
        this.showError("Git service not initialized. Please open a workspace.");
      }
      if (!this.aiService) {
        this.showError("AI service not initialized. Please open a workspace.");
      }
      return;
    }

    try {
      this.showStatus("Analyzing changes...", true);
      const gitStatus = await this.gitService.getFullGitStatus();

      if (!gitStatus.hasChanges) {
        this.showStatus("No changes found to commit.");
        return;
      }

      this.showStatus("Generating AI commit message...", true);

      // Use staged changes first, fallback to all changes
      const { diff, changedFiles } =
        gitStatus.stagedFiles.length > 0
          ? {
              diff: (await this.gitService.getStagedChanges()).diff,
              changedFiles: gitStatus.stagedFiles.map((f) => f.filePath),
            }
          : {
              diff: (await this.gitService.getAllChanges()).diff,
              changedFiles: gitStatus.modifiedFiles.map((f) => f.filePath),
            };

      const commitMessage = await this.aiService.generateCommitMessage(
        diff,
        changedFiles
      );

      this.postMessage({
        type: "commitMessage",
        data: {
          ...commitMessage,
          fullMessage: `${commitMessage.summary}\n\n${commitMessage.description}`,
        },
      });
    } catch (error) {
      this.showError(`Failed to generate commit message: ${error}`);
    }
  }

  private async handleGetGitStatus() {
    const defaultStatus = {
      staged: [],
      modified: [],
      hasChanges: false,
      stagedFiles: [],
      modifiedFiles: [],
      stagedCount: 0,
      modifiedCount: 0,
    };

    if (!this.gitService) {
      this.postMessage({ type: "gitStatus", data: defaultStatus });
      return;
    }

    try {
      const gitStatus = await this.gitService.getFullGitStatus();
      this.postMessage({
        type: "gitStatus",
        data: {
          ...defaultStatus,
          staged: gitStatus.stagedFiles.map((f) => f.filePath),
          modified: gitStatus.modifiedFiles.map((f) => f.filePath),
          hasChanges: gitStatus.hasChanges,
          stagedCount: gitStatus.stagedFiles.length,
          modifiedCount: gitStatus.modifiedFiles.length,
          stagedFiles: gitStatus.stagedFiles,
          modifiedFiles: gitStatus.modifiedFiles,
        },
      });
    } catch (error) {
      this.showError(`Failed to get git status: ${error}`);
    }
  }

  private async handleOpenFile(filePath: string) {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders?.length) {
        this.showError("No workspace folder is open.");
        return;
      }

      const fullPath = vscode.Uri.joinPath(workspaceFolders[0].uri, filePath);
      const document = await vscode.workspace.openTextDocument(fullPath);
      await vscode.window.showTextDocument(document, {
        preview: false,
        preserveFocus: false,
      });
    } catch (error) {
      this.showError(`Failed to open file: ${error}`);
    }
  }

  private async handleStageAllChanges() {
    if (!this.checkGitService()) {
      return;
    }

    try {
      this.showStatus("Staging all changes...", true);
      await this.gitService!.stageAllChanges();
      this.showStatus("All changes staged successfully!", false, 2000);
      await this.handleGetGitStatus();
    } catch (error) {
      this.showError(`Failed to stage changes: ${error}`);
    }
  }

  private async handleCommitChanges(message: string) {
    if (!this.checkGitService()) {
      return;
    }
    if (!message?.trim()) {
      this.showError("Please provide a commit message.");
      return;
    }

    try {
      this.showStatus("Committing changes...", true);
      await this.gitService!.commitChanges(message.trim());
      this.showStatus("Changes committed successfully!", false, 3000);
      this.postMessage({ type: "commitSuccess" });
      await this.handleGetGitStatus();
    } catch (error) {
      this.showError(`Failed to commit changes: ${error}`);
    }
  }

  private async handleStageFile(filePath: string) {
    if (!this.checkGitService()) {
      return;
    }

    try {
      this.showStatus(`Staging ${filePath.split("/").pop()}...`, true);
      await this.gitService!.stageFile(filePath);
      this.showStatus("File staged successfully!", false, 2000);
      await this.handleGetGitStatus();
    } catch (error) {
      this.showError(`Failed to stage file: ${error}`);
    }
  }

  private async handleOpenInEditor(content: string) {
    try {
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: "plaintext",
      });
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      this.showError(`Failed to open in editor: ${error}`);
    }
  }

  private async refresh() {
    this.initializeServices();
    await this.handleGetGitStatus();
  }

  private postMessage(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "webview", "main.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "webview", "main.css")
    );
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
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
		
		<div id="api-key-setup" class="api-key-setup" style="display: none;">
			<div class="setup-message">
				<h3>⚙️ Setup Required</h3>
				<p>To use CommitPilot, you need to configure your OpenAI API key.</p>
				<div class="setup-steps">
					<p><strong>Steps:</strong></p>
					<ol>
						<li>Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a></li>
						<li>Click the button below to open settings</li>
						<li>Set your API key in "CommitPilot: OpenAI API Key"</li>
						<li>Reload the extension</li>
					</ol>
				</div>
				<button id="open-settings-btn" class="btn btn-primary">⚙️ Open Settings</button>
			</div>
		</div>
		
		<div id="main-content" class="main-content">
		<div class="commit-input-section">
			<div class="commit-input-wrapper">
				<div class="loading-line" id="loading-line" style="display: none;"></div>
				<textarea id="commit-message-input" class="commit-input" placeholder="Type your commit message or click ✨ to generate one..." rows="3"></textarea>
				<button id="generate-commit-btn" class="btn-generate-inline" title="Generate AI commit message">✨</button>
			</div>
			<div class="commit-actions">
				<button id="commit-btn" class="btn btn-commit">▶ Commit</button>
			</div>
		</div>
		<div class="status-section">
			<div id="git-status">
				<div class="status-header">
					<div class="status-item"><span class="icon">📋</span><span id="staged-count">0 staged</span></div>
					<div class="status-item"><span class="icon">📝</span><span id="modified-count">0 modified</span></div>
				</div>
				<div id="staged-files-section" class="files-section" style="display: none;">
					<div class="section-header" data-section="staged">
						<div class="section-header-content"><span class="section-icon">📋</span><span class="section-title">Staged Changes</span></div>
						<span class="section-arrow expanded">▼</span>
					</div>
					<div id="staged-files-list" class="files-list"></div>
				</div>
				<div id="modified-files-section" class="files-section" style="display: none;">
					<div class="section-header" data-section="modified">
						<div class="section-header-content"><span class="section-icon">📝</span><span class="section-title">Modified Files</span></div>
						<span class="section-arrow expanded">▼</span>
					</div>
					<div id="modified-files-list" class="files-list"></div>
					<div class="section-actions">
						<button id="stage-all-btn" class="btn btn-stage" style="display: none;">📤 Stage All Changes</button>
					</div>
				</div>
			</div>
			<button id="refresh-btn" class="btn btn-secondary">🔄 Refresh</button>
		</div>
		<div id="status-message" class="status-message" style="display: none;"></div>
		<div class="footer"><small>Powered by OpenAI</small></div>
		</div>
	</div>
	<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJ KLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

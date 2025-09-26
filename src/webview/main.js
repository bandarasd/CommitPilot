// CommitPilot Sidebar JavaScript

(function () {
    // @ts-ignore
    const vscode = acquireVsCodeApi();

    // DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const copyBtn = document.getElementById('copy-btn');
    const editBtn = document.getElementById('edit-btn');
    const statusMessage = document.getElementById('status-message');
    const commitResult = document.getElementById('commit-result');
    const stagedCount = document.getElementById('staged-count');
    const modifiedCount = document.getElementById('modified-count');
    const commitSummary = document.getElementById('commit-summary');
    const commitDescription = document.getElementById('commit-description');

    let currentCommitMessage = '';

    // Event Listeners
    generateBtn?.addEventListener('click', () => {
        vscode.postMessage({ type: 'generateCommitMessage' });
    });

    refreshBtn?.addEventListener('click', () => {
        vscode.postMessage({ type: 'refresh' });
        showStatus('Refreshing...', false);
    });

    copyBtn?.addEventListener('click', () => {
        if (currentCommitMessage) {
            navigator.clipboard.writeText(currentCommitMessage).then(() => {
                showStatus('Commit message copied to clipboard!', false, 'success');
                setTimeout(() => hideStatus(), 2000);
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = currentCommitMessage;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showStatus('Commit message copied to clipboard!', false, 'success');
                setTimeout(() => hideStatus(), 2000);
            });
        }
    });

    editBtn?.addEventListener('click', () => {
        if (currentCommitMessage) {
            vscode.postMessage({ 
                type: 'openInEditor', 
                content: currentCommitMessage 
            });
        }
    });

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.type) {
            case 'gitStatus':
                updateGitStatus(message.data);
                break;
            case 'commitMessage':
                showCommitMessage(message.data);
                break;
            case 'status':
                showStatus(message.message, message.loading);
                break;
            case 'error':
                showStatus(message.message, false, 'error');
                break;
        }
    });

    function updateGitStatus(data) {
        if (stagedCount) {
            stagedCount.textContent = `${data.stagedCount || 0} staged`;
        }
        if (modifiedCount) {
            modifiedCount.textContent = `${data.modifiedCount || 0} modified`;
        }
        
        // Enable/disable generate button based on changes
        if (generateBtn) {
            generateBtn.disabled = !data.hasChanges;
            if (data.hasChanges) {
                generateBtn.querySelector('.btn-text').textContent = '✨ Generate Commit Message';
            } else {
                generateBtn.querySelector('.btn-text').textContent = 'No changes to commit';
            }
        }
        
        hideStatus();
    }

    function showCommitMessage(data) {
        currentCommitMessage = data.fullMessage;
        
        if (commitSummary) {
            commitSummary.textContent = data.summary;
        }
        if (commitDescription) {
            commitDescription.textContent = data.description;
        }
        
        if (commitResult) {
            commitResult.style.display = 'block';
        }
        
        hideStatus();
        showStatus('Commit message generated successfully!', false, 'success');
        setTimeout(() => hideStatus(), 3000);
    }

    function showStatus(message, loading = false, type = 'info') {
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}`;
            statusMessage.style.display = 'block';
        }
        
        // Update generate button loading state
        if (generateBtn) {
            const btnText = generateBtn.querySelector('.btn-text');
            const spinner = generateBtn.querySelector('.loading-spinner');
            
            if (loading) {
                btnText.style.display = 'none';
                spinner.style.display = 'inline-block';
                generateBtn.disabled = true;
            } else {
                btnText.style.display = 'inline-block';
                spinner.style.display = 'none';
                // Re-enable based on git status
                vscode.postMessage({ type: 'getGitStatus' });
            }
        }
    }

    function hideStatus() {
        if (statusMessage) {
            statusMessage.style.display = 'none';
        }
    }

    // Initialize
    vscode.postMessage({ type: 'getGitStatus' });
})();
// CommitPilot Sidebar JavaScript

(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  // DOM Elements
  const generateCommitBtn = document.getElementById("generate-commit-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const commitBtn = document.getElementById("commit-btn");
  const commitMessageInput = document.getElementById("commit-message-input");
  const commitActions = document.querySelector(".commit-actions");
  const statusMessage = document.getElementById("status-message");
  const stagedCount = document.getElementById("staged-count");
  const modifiedCount = document.getElementById("modified-count");
  const stagedFilesSection = document.getElementById("staged-files-section");
  const modifiedFilesSection = document.getElementById(
    "modified-files-section"
  );
  const stagedFilesList = document.getElementById("staged-files-list");
  const modifiedFilesList = document.getElementById("modified-files-list");
  const stageAllBtn = document.getElementById("stage-all-btn");
  const loadingLine = document.getElementById("loading-line");

  let currentCommitMessage = "";

  // Add event listeners for collapsible sections
  document.addEventListener("click", (e) => {
    const sectionHeader = e.target.closest(".section-header");
    if (sectionHeader && sectionHeader.hasAttribute("data-section")) {
      toggleSection(sectionHeader);
    }
  });

  // Toggle section function
  function toggleSection(sectionHeader) {
    const sectionType = sectionHeader.getAttribute("data-section");
    const arrow = sectionHeader.querySelector(".section-arrow");
    const filesList = sectionType === "staged" 
      ? stagedFilesList 
      : modifiedFilesList;
    const sectionElement = sectionType === "staged"
      ? document.getElementById("staged-files-section")
      : document.getElementById("modified-files-section");
    const sectionActions = sectionElement?.querySelector(".section-actions");
    
    if (!filesList || !arrow) {
      return;
    }
    
    // Mark as user interacted
    filesList.classList.add("user-interacted");
    
    const isCollapsed = filesList.classList.contains("collapsed");
    
    if (isCollapsed) {
      // Expand
      filesList.classList.remove("collapsed");
      arrow.classList.add("expanded");
      arrow.textContent = "▼";
      if (sectionActions) {
        sectionActions.classList.remove("collapsed");
      }
    } else {
      // Collapse
      filesList.classList.add("collapsed");
      arrow.classList.remove("expanded");
      arrow.textContent = "▼";
      if (sectionActions) {
        sectionActions.classList.add("collapsed");
      }
    }
  }

  // Event Listeners
  generateCommitBtn?.addEventListener("click", () => {
    vscode.postMessage({ type: "generateCommitMessage" });
  });

  refreshBtn?.addEventListener("click", () => {
    vscode.postMessage({ type: "refresh" });
    showStatus("Refreshing...", false);
  });

  commitBtn?.addEventListener("click", () => {
    const message = commitMessageInput?.value || currentCommitMessage;
    if (message && message.trim() !== "") {
      vscode.postMessage({
        type: "commitChanges",
        message: message,
      });
    }
  });

  // Update current commit message when user edits the text area
  commitMessageInput?.addEventListener("input", (e) => {
    currentCommitMessage = e.target.value;
    // Auto-expand textarea as user types
    autoExpandTextarea(e.target);
  });

  // Auto-expand textarea function
  function autoExpandTextarea(textarea) {
    if (!textarea) {
      return;
    }
    
    // Reset height to calculate new height
    textarea.style.height = 'auto';
    
    // Calculate the new height based on scroll height
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px
    const minHeight = 60; // Min 60px
    
    // Set the height to the larger of calculated height or minimum height
    textarea.style.height = Math.max(newHeight, minHeight) + 'px';
  }

  stageAllBtn?.addEventListener("click", () => {
    vscode.postMessage({ type: "stageAllChanges" });
    showStatus("Staging all changes...", false);
  });

  // Handle messages from the extension
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "gitStatus":
        updateGitStatus(message.data);
        break;
      case "commitMessage":
        showCommitMessage(message.data);
        break;
      case "status":
        showStatus(message.message, message.loading);
        break;
      case "error":
        showStatus(message.message, false, "error");
        showErrorInCommitInput(message.message);
        break;
      case "commitSuccess":
        clearCommitMessage();
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

    // Update file lists
    updateFilesList(
      stagedFilesList,
      data.stagedFiles || [],
      stagedFilesSection,
      'staged'
    );
    updateFilesList(
      modifiedFilesList,
      data.modifiedFiles || [],
      modifiedFilesSection,
      'modified'
    );

    // Enable/disable generate button based on changes
    if (generateCommitBtn) {
      generateCommitBtn.disabled = !data.hasChanges;
      generateCommitBtn.title = data.hasChanges 
        ? "Generate AI commit message" 
        : "No changes to commit";
    }

    // Show/hide stage button based on modified files
    if (stageAllBtn) {
      if (data.modifiedCount > 0) {
        stageAllBtn.style.display = "block";
        stageAllBtn.textContent = `📤 Stage All Changes (${data.modifiedCount})`;
      } else {
        stageAllBtn.style.display = "none";
      }
    }

    hideStatus();
  }

  function updateFilesList(listElement, files, sectionElement, fileType = 'staged') {
    if (!listElement || !sectionElement) {
      return;
    }

    // Clear existing files
    listElement.innerHTML = "";

    if (files.length === 0) {
      sectionElement.style.display = "none";
      return;
    }

    // Store current collapsed state before showing section
    const wasCollapsed = listElement.classList.contains("collapsed");
    const wasNeverInteracted = !listElement.classList.contains("user-interacted");
    const sectionActions = sectionElement?.querySelector(".section-actions");
    
    sectionElement.style.display = "block";

    files.forEach((file) => {
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";

      // Add deleted class for styling
      if (file.status === "deleted") {
        fileItem.classList.add("deleted");
      }

      const iconSpan = document.createElement("span");
      iconSpan.className = "file-icon";

      // Create codicon element
      const codiconElement = document.createElement("span");
      codiconElement.className = `codicon ${getFileIconClass(file.fileName)}`;
      iconSpan.appendChild(codiconElement);

      const nameSpan = document.createElement("span");
      nameSpan.className = `file-name ${
        file.status === "deleted" ? "deleted" : ""
      }`;
      nameSpan.textContent = file.fileName;
      nameSpan.title = file.filePath; // Show full path on hover

      const statusSpan = document.createElement("span");
      statusSpan.className = `file-status ${file.status}`;
      statusSpan.textContent = getStatusLetter(file.status, file.statusSymbol);

      fileItem.appendChild(iconSpan);
      fileItem.appendChild(nameSpan);
      
      // Add stage button for modified files only
      if (fileType === 'modified' && file.status !== 'deleted') {
        const stageBtn = document.createElement("button");
        stageBtn.className = "btn-stage-file";
        stageBtn.textContent = "+";
        stageBtn.title = "Stage this file";
        stageBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent file opening
          vscode.postMessage({
            type: "stageFile",
            filePath: file.filePath,
          });
        });
        fileItem.appendChild(stageBtn);
      }
      
      fileItem.appendChild(statusSpan);

      // Add click handler to open file (except for deleted files)
      if (file.status !== "deleted") {
        fileItem.addEventListener("click", () => {
          vscode.postMessage({
            type: "openFile",
            filePath: file.filePath,
          });
        });
      }

      listElement.appendChild(fileItem);
    });

    // Set default state: expanded on first load, then preserve user preference
    if (wasNeverInteracted) {
      // First time showing - default to expanded
      listElement.classList.remove("collapsed");
      const arrow = sectionElement.querySelector(".section-arrow");
      if (arrow) {
        arrow.classList.add("expanded");
        arrow.textContent = "▼";
      }
      if (sectionActions) {
        sectionActions.classList.remove("collapsed");
      }
    } else if (wasCollapsed) {
      // User had collapsed it - keep it collapsed
      listElement.classList.add("collapsed");
      const arrow = sectionElement.querySelector(".section-arrow");
      if (arrow) {
        arrow.classList.remove("expanded");
        arrow.textContent = "▼";
      }
      if (sectionActions) {
        sectionActions.classList.add("collapsed");
      }
    } else {
      // User had expanded it - keep it expanded
      listElement.classList.remove("collapsed");
      const arrow = sectionElement.querySelector(".section-arrow");
      if (arrow) {
        arrow.classList.add("expanded");
        arrow.textContent = "▼";
      }
      if (sectionActions) {
        sectionActions.classList.remove("collapsed");
      }
    }
  }

  function getFileIconClass(fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();

    // Return VS Code codicon class names
    switch (ext) {
      // JavaScript/TypeScript
      case "js":
        return "codicon-symbol-method";
      case "ts":
        return "codicon-symbol-interface";
      case "tsx":
      case "jsx":
        return "codicon-symbol-class";

      // Web files
      case "html":
        return "codicon-browser";
      case "css":
        return "codicon-symbol-color";
      case "scss":
      case "sass":
        return "codicon-symbol-color";

      // Config files
      case "json":
        return "codicon-json";
      case "xml":
        return "codicon-code";
      case "yaml":
      case "yml":
        return "codicon-gear";

      // Documentation
      case "md":
        return "codicon-markdown";
      case "txt":
        return "codicon-file-text";

      // Images
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "svg":
        return "codicon-file-media";

      // Other languages
      case "py":
        return "codicon-symbol-method";
      case "java":
        return "codicon-symbol-class";
      case "cpp":
      case "c":
        return "codicon-symbol-structure";
      case "go":
        return "codicon-symbol-method";
      case "rs":
        return "codicon-symbol-structure";
      case "php":
        return "codicon-symbol-method";

      // Default
      default:
        if (fileName.startsWith(".")) {
          return "codicon-gear"; // Config files
        }
        return "codicon-file"; // Generic file
    }
  }

  function getStatusLetter(status, statusSymbol) {
    // Use the actual git status symbol if available, otherwise map from status
    if (statusSymbol && statusSymbol.trim() !== "") {
      return statusSymbol;
    }

    switch (status) {
      case "added":
        return "A";
      case "modified":
        return "M";
      case "deleted":
        return "D";
      case "renamed":
        return "R";
      case "untracked":
        return "U";
      default:
        return "M";
    }
  }

  function showCommitMessage(data) {
    currentCommitMessage = data.fullMessage;

    if (commitMessageInput) {
      commitMessageInput.value = data.fullMessage;
      commitMessageInput.classList.remove("error");
      // Auto-expand textarea based on content
      autoExpandTextarea(commitMessageInput);
    }

    hideStatus();
    showStatus("Commit message generated successfully!", false, "success");
    setTimeout(() => hideStatus(), 3000);
  }

  function clearCommitMessage() {
    currentCommitMessage = "";
    if (commitMessageInput) {
      commitMessageInput.value = "";
      commitMessageInput.classList.remove("error");
      // Reset height to minimum
      commitMessageInput.style.height = '60px';
    }
  }

  function showErrorInCommitInput(errorMessage) {
    if (commitMessageInput) {
      commitMessageInput.value = `❌ Error: ${errorMessage}`;
      commitMessageInput.classList.add("error");
      // Auto-expand for error message
      autoExpandTextarea(commitMessageInput);
    }
    currentCommitMessage = "";
  }

  function showStatus(message, loading = false, type = "info") {
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.className = `status-message ${type}`;
      statusMessage.style.display = "block";
    }

    // Update loading line and generate button state
    if (loadingLine) {
      loadingLine.style.display = loading ? "block" : "none";
    }

    if (generateCommitBtn) {
      if (loading) {
        generateCommitBtn.disabled = true;
        generateCommitBtn.style.opacity = "0.5";
      } else {
        generateCommitBtn.style.opacity = "1";
        // Re-enable based on git status
        vscode.postMessage({ type: "getGitStatus" });
      }
    }
  }

  function hideStatus() {
    if (statusMessage) {
      statusMessage.style.display = "none";
    }
  }

  // Initialize
  vscode.postMessage({ type: "getGitStatus" });
  
  // Initial auto-expand in case there's existing content
  if (commitMessageInput && commitMessageInput.value) {
    autoExpandTextarea(commitMessageInput);
  }
})();

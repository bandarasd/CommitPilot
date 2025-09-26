// CommitPilot Sidebar JavaScript

(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  // DOM Elements
  const generateBtn = document.getElementById("generate-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const copyBtn = document.getElementById("copy-btn");
  const editBtn = document.getElementById("edit-btn");
  const statusMessage = document.getElementById("status-message");
  const commitResult = document.getElementById("commit-result");
  const stagedCount = document.getElementById("staged-count");
  const modifiedCount = document.getElementById("modified-count");
  const commitSummary = document.getElementById("commit-summary");
  const commitDescription = document.getElementById("commit-description");
  const stagedFilesSection = document.getElementById("staged-files-section");
  const modifiedFilesSection = document.getElementById(
    "modified-files-section"
  );
  const stagedFilesList = document.getElementById("staged-files-list");
  const modifiedFilesList = document.getElementById("modified-files-list");

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
    } else {
      // Collapse
      filesList.classList.add("collapsed");
      arrow.classList.remove("expanded");
      arrow.textContent = "▼";
    }
  }

  // Event Listeners
  generateBtn?.addEventListener("click", () => {
    vscode.postMessage({ type: "generateCommitMessage" });
  });

  refreshBtn?.addEventListener("click", () => {
    vscode.postMessage({ type: "refresh" });
    showStatus("Refreshing...", false);
  });

  copyBtn?.addEventListener("click", () => {
    if (currentCommitMessage) {
      navigator.clipboard
        .writeText(currentCommitMessage)
        .then(() => {
          showStatus("Commit message copied to clipboard!", false, "success");
          setTimeout(() => hideStatus(), 2000);
        })
        .catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = currentCommitMessage;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          showStatus("Commit message copied to clipboard!", false, "success");
          setTimeout(() => hideStatus(), 2000);
        });
    }
  });

  editBtn?.addEventListener("click", () => {
    if (currentCommitMessage) {
      vscode.postMessage({
        type: "openInEditor",
        content: currentCommitMessage,
      });
    }
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
      stagedFilesSection
    );
    updateFilesList(
      modifiedFilesList,
      data.modifiedFiles || [],
      modifiedFilesSection
    );

    // Enable/disable generate button based on changes
    if (generateBtn) {
      generateBtn.disabled = !data.hasChanges;
      if (data.hasChanges) {
        generateBtn.querySelector(".btn-text").textContent =
          "✨ Generate Commit Message";
      } else {
        generateBtn.querySelector(".btn-text").textContent =
          "No changes to commit";
      }
    }

    hideStatus();
  }

  function updateFilesList(listElement, files, sectionElement) {
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
    } else if (wasCollapsed) {
      // User had collapsed it - keep it collapsed
      listElement.classList.add("collapsed");
      const arrow = sectionElement.querySelector(".section-arrow");
      if (arrow) {
        arrow.classList.remove("expanded");
        arrow.textContent = "▼";
      }
    } else {
      // User had expanded it - keep it expanded
      listElement.classList.remove("collapsed");
      const arrow = sectionElement.querySelector(".section-arrow");
      if (arrow) {
        arrow.classList.add("expanded");
        arrow.textContent = "▼";
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

    if (commitSummary) {
      commitSummary.textContent = data.summary;
    }
    if (commitDescription) {
      commitDescription.textContent = data.description;
    }

    if (commitResult) {
      commitResult.style.display = "block";
    }

    hideStatus();
    showStatus("Commit message generated successfully!", false, "success");
    setTimeout(() => hideStatus(), 3000);
  }

  function showStatus(message, loading = false, type = "info") {
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.className = `status-message ${type}`;
      statusMessage.style.display = "block";
    }

    // Update generate button loading state
    if (generateBtn) {
      const btnText = generateBtn.querySelector(".btn-text");
      const spinner = generateBtn.querySelector(".loading-spinner");

      if (loading) {
        btnText.style.display = "none";
        spinner.style.display = "inline-block";
        generateBtn.disabled = true;
      } else {
        btnText.style.display = "inline-block";
        spinner.style.display = "none";
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
})();

// CommitPilot Sidebar JavaScript

(function () {
  console.log('CommitPilot: main.js loaded');
  
  try {
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    console.log('CommitPilot: vscode API acquired');

  // Helper functions
  const dom = {
    get: (id) => document.getElementById(id),
    query: (selector) => document.querySelector(selector),
    addClass: (element, className) => element?.classList.add(className),
    removeClass: (element, className) => element?.classList.remove(className),
    hasClass: (element, className) => element?.classList.contains(className),
    toggle: (element, className) => element?.classList.toggle(className),
  };

  const vscodeAPI = {
    send: (type, data = {}) => vscode.postMessage({ type, ...data }),
    sendMessage: (type, message) => vscode.postMessage({ type, message }),
  };

  const status = {
    show: (message, loading = false, type = "info") =>
      showStatus(message, loading, type),
    hide: () => hideStatus(),
    error: (message) => showStatus(message, false, "error"),
    success: (message) => showStatus(message, false, "success"),
  };

  // File icon mapping
  const fileIcons = {
    js: "codicon-symbol-method",
    ts: "codicon-symbol-interface",
    tsx: "codicon-symbol-class",
    jsx: "codicon-symbol-class",
    html: "codicon-browser",
    css: "codicon-symbol-color",
    scss: "codicon-symbol-color",
    sass: "codicon-symbol-color",
    json: "codicon-json",
    xml: "codicon-code",
    yaml: "codicon-gear",
    yml: "codicon-gear",
    md: "codicon-markdown",
    txt: "codicon-file-text",
    png: "codicon-file-media",
    jpg: "codicon-file-media",
    jpeg: "codicon-file-media",
    gif: "codicon-file-media",
    svg: "codicon-file-media",
    py: "codicon-symbol-method",
    java: "codicon-symbol-class",
    cpp: "codicon-symbol-structure",
    c: "codicon-symbol-structure",
    go: "codicon-symbol-method",
    rs: "codicon-symbol-structure",
    php: "codicon-symbol-method",
  };

  const statusMap = {
    added: "A",
    modified: "M",
    deleted: "D",
    renamed: "R",
    untracked: "U",
  };

  // Wait for DOM to be fully loaded
  function initializeExtension() {
    // DOM Elements
    const generateCommitBtn = dom.get("generate-commit-btn");
    const refreshBtn = dom.get("refresh-btn");
    const commitBtn = dom.get("commit-btn");
    const commitMessageInput = dom.get("commit-message-input");
    const stagedCount = dom.get("staged-count");
    const modifiedCount = dom.get("modified-count");
    const stagedFilesSection = dom.get("staged-files-section");
    const modifiedFilesSection = dom.get("modified-files-section");
    const stagedFilesList = dom.get("staged-files-list");
    const modifiedFilesList = dom.get("modified-files-list");
    const stageAllBtn = dom.get("stage-all-btn");
    const openSettingsBtn = dom.get("open-settings-btn");
    const apiKeySetup = dom.get("api-key-setup");
    const mainContent = dom.get("main-content");

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
      const filesList =
        sectionType === "staged" ? stagedFilesList : modifiedFilesList;
      const sectionElement =
        sectionType === "staged"
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
    generateCommitBtn?.addEventListener("click", () =>
      vscodeAPI.send("generateCommitMessage")
    );
    refreshBtn?.addEventListener("click", () => {
      vscodeAPI.send("refresh");
      status.show("Refreshing...");
    });

    commitBtn?.addEventListener("click", () => {
      const message = commitMessageInput?.value || currentCommitMessage;
      if (message?.trim()) {
        vscodeAPI.sendMessage("commitChanges", message);
      } else {
        status.error("Please enter a commit message");
        setTimeout(() => status.hide(), 3000);
      }
    });

    commitMessageInput?.addEventListener("input", (e) => {
      currentCommitMessage = e.target.value;
      autoExpandTextarea(e.target);
    });

    stageAllBtn?.addEventListener("click", () => {
      vscodeAPI.send("stageAllChanges");
      status.show("Staging all changes...");
    });

    openSettingsBtn?.addEventListener("click", () => {
      vscodeAPI.send("openSettings");
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
        case "showApiKeySetup":
          showApiKeySetup();
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
        "staged"
      );
      updateFilesList(
        modifiedFilesList,
        data.modifiedFiles || [],
        modifiedFilesSection,
        "modified"
      );

      // Enable/disable generate button based on changes
      if (generateCommitBtn) {
        generateCommitBtn.disabled = !data.hasChanges;
        generateCommitBtn.title = data.hasChanges
          ? "Generate AI commit message"
          : "No changes to commit";
      }

      // Enable/disable commit button based on changes
      if (commitBtn) {
        commitBtn.disabled = !data.hasChanges;
        commitBtn.title = data.hasChanges
          ? "Commit changes"
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

    function updateFilesList(
      listElement,
      files,
      sectionElement,
      fileType = "staged"
    ) {
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
      const wasNeverInteracted =
        !listElement.classList.contains("user-interacted");
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
        statusSpan.textContent = getStatusLetter(
          file.status,
          file.statusSymbol
        );

        fileItem.appendChild(iconSpan);
        fileItem.appendChild(nameSpan);

        // Add stage button for modified files only
        if (fileType === "modified" && file.status !== "deleted") {
          const stageBtn = document.createElement("button");
          stageBtn.className = "btn-stage-file";
          stageBtn.textContent = "+";
          stageBtn.title = "Stage this file";
          stageBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            vscodeAPI.send("stageFile", { filePath: file.filePath });
          });
          fileItem.appendChild(stageBtn);
        }

        fileItem.appendChild(statusSpan);

        // Add click handler to open file (except for deleted files)
        if (file.status !== "deleted") {
          fileItem.addEventListener("click", () =>
            vscodeAPI.send("openFile", { filePath: file.filePath })
          );
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
      if (fileName.startsWith(".")) {
        return "codicon-gear";
      }
      return fileIcons[ext] || "codicon-file";
    }

    function getStatusLetter(status, statusSymbol) {
      if (statusMap[status]) {
        return statusMap[status];
      }
      if (statusSymbol && statusSymbol.trim() !== "" && statusSymbol !== "??") {
        return statusSymbol.charAt(0);
      }
      return "M";
    }

    function showCommitMessage(data) {
      currentCommitMessage = data.fullMessage;
      if (commitMessageInput) {
        commitMessageInput.value = data.fullMessage;
        dom.removeClass(commitMessageInput, "error");
        autoExpandTextarea(commitMessageInput);
      }
      status.success("Commit message generated successfully!");
      setTimeout(() => status.hide(), 3000);
    }

    function clearCommitMessage() {
      currentCommitMessage = "";
      if (commitMessageInput) {
        commitMessageInput.value = "";
        dom.removeClass(commitMessageInput, "error");
        commitMessageInput.style.height = "60px";
      }
    }

    function showErrorInCommitInput(errorMessage) {
      if (commitMessageInput) {
        commitMessageInput.value = `❌ Error: ${errorMessage}`;
        dom.addClass(commitMessageInput, "error");
        autoExpandTextarea(commitMessageInput);
      }
      currentCommitMessage = "";
    }

    function showStatus(message, loading = false, type = "info") {
      const statusMessage = dom.get("status-message");
      const loadingLine = dom.get("loading-line");

      if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = "block";
      }

      if (loadingLine) {
        loadingLine.style.display = loading ? "block" : "none";
      }

      if (generateCommitBtn) {
        generateCommitBtn.disabled = loading;
        generateCommitBtn.style.opacity = loading ? "0.5" : "1";
        if (!loading) {
          vscodeAPI.send("getGitStatus");
        }
      }
    }

    function hideStatus() {
      const statusMessage = dom.get("status-message");
      if (statusMessage) {
        statusMessage.style.display = "none";
      }
    }

    function showApiKeySetup() {
      if (apiKeySetup && mainContent) {
        apiKeySetup.style.display = "block";
        mainContent.style.display = "none";
      }
    }

    function hideApiKeySetup() {
      if (apiKeySetup && mainContent) {
        apiKeySetup.style.display = "none";
        mainContent.style.display = "block";
      }
    }

    function autoExpandTextarea(textarea) {
      if (!textarea) {
        return;
      }
      
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the new height based on content
      const minHeight = 70; // minimum height in pixels
      const maxHeight = 200; // maximum height in pixels
      const newHeight = Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight));
      
      // Set the new height
      textarea.style.height = newHeight + 'px';
    }

    // Initialize
    vscodeAPI.send("getGitStatus");
    if (commitMessageInput?.value) {
      autoExpandTextarea(commitMessageInput);
    }
  }

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeExtension);
    } else {
      initializeExtension();
    }
  } catch (error) {
    console.error('CommitPilot: Error initializing extension:', error);
    // Show a basic error message in the webview
    if (document.body) {
      document.body.innerHTML = `
        <div style="padding: 20px; color: var(--vscode-errorForeground);">
          <h3>⚠️ CommitPilot Error</h3>
          <p>Failed to initialize the extension. Please try reloading VS Code.</p>
          <details>
            <summary>Error Details</summary>
            <pre>${error.toString()}</pre>
          </details>
        </div>
      `;
    }
  }
})();
# Change Log

All notable changes to the "CommitPilot" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-29

### 🚀 **Major Release - Production Ready**

### Fixed
- **Critical**: Fixed webview assets not loading in published extension
  - Corrected file paths to use `out/webview/` instead of `src/webview/`
  - Added asset copying to build process
  - Extension now works identically in development and production

### Added
- **Modern UI Design**: Complete UI overhaul with professional styling
  - Gradient headers and card-based layouts
  - Smooth animations and hover effects
  - Enhanced visual hierarchy and spacing
  - Professional button styling with micro-interactions
- **Improved User Experience**:
  - Auto-expanding textarea for commit messages
  - Better visual feedback for all interactions
  - Modern section headers and file items
  - Enhanced setup screen with shimmer animations

### Changed
- Updated build process to include webview assets
- Improved compilation workflow for production deployment

---

## [0.0.1] - 2025-09-28

### Added
- 🚁 **Initial release of CommitPilot**
- 🤖 **AI-powered commit message generation** using OpenAI GPT models and OpenRouter
- 🎯 **Multiple access methods**:
  - Dedicated sidebar with intuitive UI
  - Command palette integration
  - Keyboard shortcuts (`Ctrl+Shift+G Ctrl+M`)
  - Source Control panel toolbar button
- ⚙️ **VS Code settings integration**:
  - `commitpilot.openaiApiKey` - Configure your OpenAI API key
  - `commitpilot.openaiModel` - Choose AI model (gpt-3.5-turbo, gpt-4, etc.)
  - `commitpilot.maxTokens` - Control response length (50-500 tokens)
- 🔧 **Smart setup experience**:
  - Automatic setup screen when no API key is configured
  - Direct link to settings configuration
  - Step-by-step setup instructions
- 📁 **Git integration features**:
  - Real-time git status display in sidebar
  - Stage individual files or all changes
  - Commit directly from the sidebar
  - Support for both staged and unstaged changes
- 🎨 **Professional UI**:
  - VS Code theme integration
  - Collapsible file sections
  - File icons and status indicators
  - Loading animations and status messages
- 🔑 **Dual API support**:
  - Standard OpenAI API keys
  - OpenRouter API keys (auto-detection)
- 📝 **Conventional commit format**:
  - Structured commit messages with type classification
  - Detailed descriptions explaining changes
  - Professional commit message formatting

### Features
- `commitpilot.generateCommitMessage` - Generate AI commit message
- `commitpilot.getDiff` - Get staged Git diff
- `commitpilot.openSettings` - Open CommitPilot settings
- `commitpilot.test` - Test extension functionality

### UI Components
- Activity bar integration with helicopter icon
- Webview-based sidebar with full Git workflow
- Error handling and user-friendly messages
- Dynamic content based on Git repository state

### Requirements
- VS Code 1.104.0 or higher
- Git repository
- OpenAI API key or OpenRouter API key
- Active workspace folder

### Technical Details
- TypeScript implementation
- OpenAI SDK integration
- VS Code Extension API
- Webview messaging system
- Configuration change listeners
- Git command execution

[0.0.1]: https://github.com/bandarasd/CommitPilot/releases/tag/v0.0.1

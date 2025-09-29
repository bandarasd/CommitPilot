# Change Log

All notable changes to the "CommitPilot" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-09-28

### Added

- Initial release of CommitPilot
- AI-powered commit message generation using OpenAI GPT models
- Integration with VS Code Source Control panel
- Command palette commands for generating commit messages
- Keyboard shortcuts (`Ctrl+Shift+G Ctrl+M`) for quick access
- CommitPilot sidebar with webview interface
- Source Control panel toolbar integration
- Support for analyzing staged Git changes
- Environment variable configuration for OpenAI API key

### Features

- `commitpilot.generateCommitMessage` - Generate AI commit message
- `commitpilot.getDiff` - Get staged Git diff
- `commitpilot.test` - Test extension functionality
- Activity bar integration with CommitPilot icon
- Webview-based AI Commit Generator panel

### Requirements

- VS Code 1.104.0 or higher
- Git repository
- OpenAI API key
- Node.js dependencies: openai, dotenv

[0.0.1]: https://github.com/bandarasd/CommitPilot/releases/tag/v0.0.1

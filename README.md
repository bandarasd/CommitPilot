# CommitPilot 🚁

AI-powered Git commit message generator for Visual Studio Code. Let AI help you write meaningful, consistent commit messages based on your staged changes.

## Features

- 🤖 **AI-Powered**: Generate commit messages using OpenAI's GPT models
- 🔍 **Smart Analysis**: Analyzes your staged Git changes to understand the context
- ⚡ **Quick Access**: Generate commit messages with a single command or keyboard shortcut
- 🎯 **Integrated**: Works seamlessly with VS Code's Source Control panel
- 🛠️ **Customizable**: Configure AI model and other settings to fit your workflow

## Installation

1. Open Visual Studio Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "CommitPilot"
4. Click Install

## Setup

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Create a `.env` file in your project root or set environment variables:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Usage

### Method 1: Command Palette

1. Stage your changes in Git
2. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Type "CommitPilot: Generate AI Commit Message"
4. AI will analyze your changes and suggest a commit message

### Method 2: Keyboard Shortcut

1. Stage your changes in Git
2. Press `Ctrl+Shift+G Ctrl+M` (Windows/Linux) or `Cmd+Shift+G Cmd+M` (Mac)

### Method 3: Source Control Panel

1. Stage your changes in Git
2. Click the sparkle icon (✨) in the Source Control panel toolbar

### Method 4: CommitPilot Sidebar

1. Open the CommitPilot sidebar from the Activity Bar
2. Use the AI Commit Generator panel

## Commands

| Command                             | Description                | Keyboard Shortcut     |
| ----------------------------------- | -------------------------- | --------------------- |
| `commitpilot.generateCommitMessage` | Generate AI commit message | `Ctrl+Shift+G Ctrl+M` |
| `commitpilot.getDiff`               | Get staged Git diff        | -                     |
| `commitpilot.test`                  | Test extension             | -                     |

## Requirements

- Visual Studio Code 1.104.0 or higher
- Git repository
- OpenAI API key
- Node.js (for development)

## Configuration

The extension uses your OpenAI API key from environment variables. Make sure to set:

- `OPENAI_API_KEY`: Your OpenAI API key

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/bandarasd/CommitPilot/issues) on GitHub.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and updates.

---

**Enjoy coding with AI-powered commit messages!** 🚁✨

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

1. Install the extension from VS Code Marketplace
2. Open the CommitPilot sidebar
3. If no API key is configured, you'll see a setup screen with instructions
4. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
5. Click "Open Settings" or use Command Palette: `CommitPilot: Open Settings`
6. Set your API key in **"CommitPilot: OpenAI API Key"**
7. Optionally configure:
   - **Model**: Choose from gpt-3.5-turbo, gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini
   - **Max Tokens**: Control response length (50-500 tokens)

> **Note**: The extension supports both OpenAI API keys and OpenRouter keys. It will automatically detect and configure the appropriate endpoint.

## Usage

### Method 1: CommitPilot Sidebar (Recommended)

1. Click the extention in the Activity Bar to open CommitPilot sidebar
2. Stage your changes in Git
3. Click the sparkle icon (✨) next to the commit message input
4. AI will analyze your changes and generate a commit message
5. Review and edit if needed, then click "Commit"

### Method 2: Command Palette

1. Stage your changes in Git
2. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Type "CommitPilot: Generate AI Commit Message"
4. AI will analyze your changes and suggest a commit message

### Method 3: Keyboard Shortcut

1. Stage your changes in Git
2. Press `Ctrl+Shift+G Ctrl+M` (Windows/Linux) or `Cmd+Shift+G Cmd+M` (Mac)

### Method 4: Source Control Panel

1. Stage your changes in Git
2. Click the sparkle icon (✨) in the Source Control panel toolbar

## Commands

| Command                             | Description                | Keyboard Shortcut     |
| ----------------------------------- | -------------------------- | --------------------- |
| `commitpilot.generateCommitMessage` | Generate AI commit message | `Ctrl+Shift+G Ctrl+M` |
| `commitpilot.getDiff`               | Get staged Git diff        | -                     |
| `commitpilot.openSettings`          | Open CommitPilot settings  | -                     |
| `commitpilot.test`                  | Test extension             | -                     |

## Configuration

Access settings via: **File > Preferences > Settings** and search for "CommitPilot" or use the command `CommitPilot: Open Settings`.

| Setting                    | Type   | Default           | Description                                                          |
| -------------------------- | ------ | ----------------- | -------------------------------------------------------------------- |
| `commitpilot.openaiApiKey` | string | `""`              | Your OpenAI API key for generating commit messages                   |
| `commitpilot.openaiModel`  | string | `"gpt-3.5-turbo"` | OpenAI model: gpt-3.5-turbo, gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini |
| `commitpilot.maxTokens`    | number | `150`             | Maximum tokens for commit message generation (50-500)                |

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

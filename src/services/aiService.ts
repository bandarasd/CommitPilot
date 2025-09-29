import OpenAI from "openai";
import * as vscode from "vscode";

export interface CommitMessageResult {
  summary: string;
  description: string;
  type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "chore";
}

export class AIService {
  private client: OpenAI | null = null;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.initializeClient();
    
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('commitpilot.openaiApiKey')) {
        this.initializeClient();
      }
    });
  }

  private initializeClient() {
    const config = vscode.workspace.getConfiguration('commitpilot');
    const apiKey = config.get<string>('openaiApiKey');

    if (!apiKey || apiKey.trim() === '') {
      this.client = null;
      return;
    }

    try {
      // Check if it's an OpenRouter API key (starts with sk-or-)
      if (apiKey.startsWith('sk-or-')) {
        this.client = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: apiKey,
        });
      } else {
        // Standard OpenAI API key
        this.client = new OpenAI({
          apiKey: apiKey,
        });
      }
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      this.client = null;
    }
  }

  async generateCommitMessage(
    gitDiff: string,
    changedFiles: string[]
  ): Promise<CommitMessageResult> {
    if (!this.client) {
      throw new Error(
        "OpenAI API key not configured. Please set your API key in VS Code settings (CommitPilot: OpenAI API Key)."
      );
    }

    const config = vscode.workspace.getConfiguration('commitpilot');
    const model = config.get<string>('openaiModel', 'gpt-3.5-turbo');
    const maxTokens = config.get<number>('maxTokens', 150);
    const prompt = this.buildPrompt(gitDiff, changedFiles);

    try {
      // Use different model based on API type
      const isOpenRouter = model === 'x-ai/grok-4-fast:free' || this.client.baseURL?.includes('openrouter');
      const actualModel = isOpenRouter ? 'x-ai/grok-4-fast:free' : model;
      
      const requestOptions: any = {
        model: actualModel,
        messages: [
          {
            role: "system",
            content: `You are an expert at writing concise, meaningful Git commit messages following conventional commit format. 
            Analyze the git diff and generate:
            1. A summary (max 50 chars): type(scope): brief description
            2. A detailed description explaining what changed and why
            3. Commit type: feat, fix, docs, style, refactor, test, or chore
            
            Respond in JSON format:
            {
              "summary": "feat: add user authentication",
              "description": "Implemented JWT-based authentication system with login/logout functionality. Added middleware for protected routes and user session management.",
              "type": "feat"
            }`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      };

      // Add headers for OpenRouter
      const requestHeaders: any = {};
      if (isOpenRouter) {
        requestHeaders.headers = {
          "HTTP-Referer": "https://github.com/bandarasd/CommitPilot",
          "X-Title": "CommitPilot VS Code Extension",
        };
      }

      const completion = await this.client.chat.completions.create(
        requestOptions,
        requestHeaders
      );

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error("No response from AI");
      }

      // Parse JSON response
      const result = JSON.parse(responseContent) as CommitMessageResult;
      return result;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new Error(`Failed to generate commit message: ${error}`);
    }
  }

  private buildPrompt(gitDiff: string, changedFiles: string[]): string {
    return `
Analyze this git diff and generate a commit message:

Changed Files:
${changedFiles.map((file) => `- ${file}`).join("\n")}

Git Diff:
\`\`\`diff
${gitDiff}
\`\`\`

Generate a commit message following conventional commits format.
    `.trim();
  }
}

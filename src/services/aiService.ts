import OpenAI from "openai";
import * as vscode from "vscode";
import * as dotenv from "dotenv";
import * as path from "path";

export interface CommitMessageResult {
  summary: string;
  description: string;
  type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "chore";
}

export class AIService {
  private client: OpenAI;

  constructor(context: vscode.ExtensionContext) {
    // Load environment variables from the extension's directory
    const extensionPath = context.extensionPath;
    dotenv.config({ path: path.join(extensionPath, ".env") });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OpenRouter API key not found. Please set OPENROUTER_API_KEY in your extension's .env file."
      );
    }

    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    });
  }

  async generateCommitMessage(
    gitDiff: string,
    changedFiles: string[]
  ): Promise<CommitMessageResult> {
    const prompt = this.buildPrompt(gitDiff, changedFiles);

    try {
      const completion = await this.client.chat.completions.create(
        {
          model: "x-ai/grok-4-fast:free",
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
          max_tokens: 300,
        },
        {
          headers: {
            "HTTP-Referer": "https://github.com/bandarasd/CommitPilot",
            "X-Title": "CommitPilot VS Code Extension",
          },
        }
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

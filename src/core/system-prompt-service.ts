import type { ConfigRepo } from "../storage/config-repo.js";
import { DEFAULT_SYSTEM_PROMPT, SYSTEM_PROMPT_KEY, RESPONSE_TOKEN_RESERVE } from "../constants.js";

export interface PromptStatus {
  prompt: string;
  tokens: number;
  maxInputTokens: number;
}

export class SystemPromptService {
  constructor(
    private configRepo: ConfigRepo,
    private countTokens: (text: string, hfUri: string) => Promise<number>,
  ) {}

  async getStatus(): Promise<PromptStatus> {
    const prompt = this.configRepo.getSystemPrompt();
    const hfUri = this.configRepo.getModelHfUri();
    const contextSize = this.configRepo.getModelContextSize();
    const tokens = await this.countTokens(prompt, hfUri);
    const maxInputTokens = contextSize - RESPONSE_TOKEN_RESERVE;
    return { prompt, tokens, maxInputTokens };
  }

  getCurrent(): string {
    return this.configRepo.getSystemPrompt();
  }

  update(content: string): void {
    if (!content.trim()) {
      throw new Error("System prompt cannot be empty.");
    }
    this.configRepo.set(SYSTEM_PROMPT_KEY, content);
  }

  reset(): void {
    this.configRepo.set(SYSTEM_PROMPT_KEY, DEFAULT_SYSTEM_PROMPT);
  }
}

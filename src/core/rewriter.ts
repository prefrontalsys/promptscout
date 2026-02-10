import type { ConfigRepo } from "../storage/config-repo.js";
import { LLM_CONTEXT_SIZE, RESPONSE_TOKEN_RESERVE } from "../constants.js";
import { countTokens } from "../llm/tokenizer.js";
import { generate } from "../llm/inference.js";

export class Rewriter {
  constructor(private configRepo: ConfigRepo) {}

  async rewrite(rawPrompt: string): Promise<string> {
    const systemPrompt = this.configRepo.getSystemPrompt();

    const systemTokens = await countTokens(systemPrompt);
    const promptTokens = await countTokens(rawPrompt);
    const totalTokens = systemTokens + promptTokens;
    const maxInputTokens = LLM_CONTEXT_SIZE - RESPONSE_TOKEN_RESERVE;

    if (totalTokens >= maxInputTokens) {
      console.error(
        `Warning: Input (${totalTokens} tokens) exceeds context limit (${maxInputTokens}). Returning raw prompt.`,
      );
      return rawPrompt;
    }

    return generate(systemPrompt, rawPrompt);
  }
}

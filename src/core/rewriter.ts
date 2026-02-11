import type { ConfigRepo } from "../storage/config-repo.js";
import { RESPONSE_TOKEN_RESERVE } from "../constants.js";
import { countTokens } from "../llm/tokenizer.js";
import { generate } from "../llm/inference.js";

export class Rewriter {
  constructor(private configRepo: ConfigRepo) {}

  async rewrite(
    rawPrompt: string,
    onToken?: (text: string) => void,
  ): Promise<string> {
    const systemPrompt = this.configRepo.getSystemPrompt();
    const hfUri = this.configRepo.getModelHfUri();
    const contextSize = this.configRepo.getModelContextSize();

    const systemTokens = await countTokens(systemPrompt, hfUri);
    const promptTokens = await countTokens(rawPrompt, hfUri);
    const totalTokens = systemTokens + promptTokens;
    const maxInputTokens = contextSize - RESPONSE_TOKEN_RESERVE;

    if (totalTokens >= maxInputTokens) {
      console.error(
        `Warning: Input (${totalTokens} tokens) exceeds context limit (${maxInputTokens}). Returning raw prompt.`,
      );
      return rawPrompt;
    }

    return generate(systemPrompt, rawPrompt, hfUri, contextSize, onToken);
  }
}

import type { ConfigRepo } from "../storage/config-repo.js";
import { generate } from "../llm/inference.js";

export class Rewriter {
  constructor(private configRepo: ConfigRepo) {}

  async rewrite(
    rawPrompt: string,
    onToken?: (token: string) => void
  ): Promise<string> {
    const systemPrompt = this.configRepo.getSystemPrompt();
    return generate(systemPrompt, rawPrompt, onToken);
  }
}

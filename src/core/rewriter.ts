import { ConfigRepo } from "../storage/config-repo.js";
import { generate } from "../llm/inference.js";

const configRepo = new ConfigRepo();

export async function rewritePrompt(
  rawPrompt: string,
  onToken?: (token: string) => void
): Promise<string> {
  const systemPrompt = configRepo.getSystemPrompt();
  return generate(systemPrompt, rawPrompt, onToken);
}

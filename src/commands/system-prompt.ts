import type { Command } from "commander";
import type { ConfigRepo } from "../storage/config-repo.js";
import { DEFAULT_SYSTEM_PROMPT, SYSTEM_PROMPT_KEY, RESPONSE_TOKEN_RESERVE } from "../constants.js";
import { formatTokenCount } from "../utils/text.js";
import { openInEditor } from "../utils/editor.js";
import { confirm } from "@inquirer/prompts";

export function registerSystemPromptCommand(
  program: Command,
  repo: ConfigRepo,
  countTokens: (text: string, hfUri: string) => Promise<number>,
): void {
  const sp = program
    .command("system-prompt")
    .description("Manage the LLM system prompt");

  // Show (default action)
  sp.action(async () => {
    const prompt = repo.getSystemPrompt();
    console.log(prompt);

    const hfUri = repo.getModelHfUri();
    const contextSize = repo.getModelContextSize();
    const tokens = await countTokens(prompt, hfUri);
    const maxInput = contextSize - RESPONSE_TOKEN_RESERVE;
    console.log(`\n${formatTokenCount(tokens, maxInput)}`);
  });

  // Edit
  sp.command("edit")
    .description("Edit system prompt in $EDITOR")
    .action(() => {
      const current = repo.getSystemPrompt();
      const updated = openInEditor(current);

      if (!updated.trim()) {
        console.error("Error: System prompt cannot be empty.");
        process.exit(1);
      }

      repo.set(SYSTEM_PROMPT_KEY, updated);
      console.log("System prompt updated.");
    });

  // Reset
  sp.command("reset")
    .description("Reset system prompt to default")
    .action(async () => {
      const confirmed = await confirm({
        message: "Reset system prompt to default?",
        default: false,
      });

      if (!confirmed) {
        console.log("Cancelled.");
        return;
      }

      repo.set(SYSTEM_PROMPT_KEY, DEFAULT_SYSTEM_PROMPT);
      console.log("System prompt reset to default.");
    });
}

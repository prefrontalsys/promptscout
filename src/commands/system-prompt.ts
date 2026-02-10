import type { Command } from "commander";
import { ConfigRepo } from "../storage/config-repo.js";
import { DEFAULT_SYSTEM_PROMPT, SYSTEM_PROMPT_KEY } from "../constants.js";
import { openInEditor } from "../utils/editor.js";
import { confirm } from "@inquirer/prompts";

const repo = new ConfigRepo();

export function registerSystemPromptCommand(program: Command): void {
  const sp = program
    .command("system-prompt")
    .description("Manage the LLM system prompt");

  // Show (default action)
  sp.action(() => {
    console.log(repo.getSystemPrompt());
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

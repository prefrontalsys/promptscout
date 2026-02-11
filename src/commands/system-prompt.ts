import type { Command } from "commander";
import type { SystemPromptService } from "../core/system-prompt-service.js";
import { formatTokenCount } from "../utils/text.js";
import { openInEditor } from "../utils/editor.js";
import { confirm } from "@inquirer/prompts";

export function registerSystemPromptCommand(
  program: Command,
  service: SystemPromptService,
): void {
  const sp = program
    .command("system-prompt")
    .description("Manage the LLM system prompt");

  sp.action(async () => {
    const status = await service.getStatus();
    console.log(status.prompt);
    console.log(`\n${formatTokenCount(status.tokens, status.maxInputTokens)}`);
  });

  sp.command("edit")
    .description("Edit system prompt in $EDITOR")
    .action(() => {
      const current = service.getCurrent();
      const updated = openInEditor(current);

      service.update(updated);
      console.log("System prompt updated.");
    });

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

      service.reset();
      console.log("System prompt reset to default.");
    });
}

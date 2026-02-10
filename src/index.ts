#!/usr/bin/env node

import { Command } from "commander";
import { registerRewriteCommand } from "./commands/rewrite.js";
import { registerTemplatesCommand } from "./commands/templates.js";
import { registerSystemPromptCommand } from "./commands/system-prompt.js";
import { registerHistoryCommand } from "./commands/history.js";

const program = new Command();

program
  .name("better-prompt")
  .description("Rewrite coding agent prompts using a local LLM")
  .version("1.0.0");

registerRewriteCommand(program);
registerTemplatesCommand(program);
registerSystemPromptCommand(program);
registerHistoryCommand(program);

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error("An unexpected error occurred.");
    }
    process.exit(1);
  }
}

main();

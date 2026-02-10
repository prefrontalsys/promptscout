#!/usr/bin/env node

import { Command } from "commander";
import { getDrizzle } from "./storage/database.js";
import { TemplateRepo } from "./storage/template-repo.js";
import { HistoryRepo } from "./storage/history-repo.js";
import { ConfigRepo } from "./storage/config-repo.js";
import { Rewriter } from "./core/rewriter.js";
import { Orchestrator } from "./core/orchestrator.js";
import { registerRewriteCommand } from "./commands/rewrite.js";
import { registerTemplatesCommand } from "./commands/templates.js";
import { registerSystemPromptCommand } from "./commands/system-prompt.js";
import { registerHistoryCommand } from "./commands/history.js";
import { countTokens } from "./llm/tokenizer.js";

const program = new Command();

program
  .name("better-prompt")
  .description("Rewrite coding agent prompts using a local LLM")
  .version("1.0.0");

// 1. Database
const db = getDrizzle();

// 2. Repositories
const templateRepo = new TemplateRepo(db);
const historyRepo = new HistoryRepo(db);
const configRepo = new ConfigRepo(db);

// 3. Core
const rewriter = new Rewriter(configRepo);
const orchestrator = new Orchestrator(templateRepo, historyRepo, rewriter);

// 4. Commands
registerRewriteCommand(program, orchestrator);
registerTemplatesCommand(program, templateRepo);
registerSystemPromptCommand(program, configRepo, countTokens);
registerHistoryCommand(program, historyRepo);

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

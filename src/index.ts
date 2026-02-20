#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Command } from "commander";
import { getDrizzle } from "./storage/database.js";
import { HistoryRepo } from "./storage/history-repo.js";
import { ConfigRepo } from "./storage/config-repo.js";
import { Rewriter } from "./core/rewriter.js";
import { Orchestrator } from "./core/orchestrator.js";
import { HistoryService } from "./core/history-service.js";
import { registerSetupCommand } from "./commands/setup.js";
import { registerRewriteCommand } from "./commands/rewrite.js";
import { registerHistoryCommand } from "./commands/history.js";
import { TemplateRepo } from "./storage/template-repo.js";
import { TemplateService } from "./core/template-service.js";
import { registerTemplateCommand } from "./commands/templates.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

const program = new Command();

program
  .name("promptscout")
  .description("Rewrite coding agent prompts using a local LLM")
  .version(pkg.version);

// 1. Database
const db = getDrizzle();

// 2. Repositories
const historyRepo = new HistoryRepo(db);
const configRepo = new ConfigRepo(db);
const templateRepo = new TemplateRepo(db);

// 3. Services
const rewriter = new Rewriter(configRepo);
const templateService = new TemplateService(templateRepo);
const orchestrator = new Orchestrator(historyRepo, rewriter, templateService);
const historyService = new HistoryService(historyRepo);

// 4. Commands
registerSetupCommand(program);
registerRewriteCommand(program, orchestrator);
registerHistoryCommand(program, historyService);
registerTemplateCommand(program, templateService);

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

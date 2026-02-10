import type { Command } from "commander";
import type { HistoryRepo } from "../storage/history-repo.js";
import { HISTORY_PREVIEW_LENGTH } from "../constants.js";
import { truncate } from "../utils/text.js";
import { confirm } from "@inquirer/prompts";

export function registerHistoryCommand(program: Command, repo: HistoryRepo): void {
  const hist = program
    .command("history")
    .description("View prompt history");

  // List (default action)
  hist
    .option("-a, --all", "Show history across all directories")
    .option("-n, --limit <number>", "Number of entries to show", "20")
    .action((opts: Record<string, unknown>) => {
      const limit = parseInt(opts.limit as string, 10);
      const directory = opts.all ? undefined : process.cwd();
      const entries = repo.list(directory, limit);

      if (entries.length === 0) {
        console.log("No history entries found.");
        if (!opts.all) {
          console.log("Tip: Use -a to show history from all directories.");
        }
        return;
      }

      console.log("History:\n");
      for (const e of entries) {
        const input = truncate(e.raw_input, HISTORY_PREVIEW_LENGTH);
        const tpl = e.template_name ? ` [${e.template_name}]` : "";
        console.log(`  #${e.id}  ${e.created_at}${tpl}`);
        console.log(`    ${input}\n`);
      }
    });

  // Show
  hist
    .command("show <id>")
    .description("Show full detail of a history entry")
    .action((id: string) => {
      const entry = repo.findById(parseInt(id, 10));
      if (!entry) {
        console.error(`Error: History entry #${id} not found.`);
        process.exit(1);
      }

      console.log(`Entry #${entry.id}`);
      console.log(`Date: ${entry.created_at}`);
      console.log(`Directory: ${entry.directory}`);
      console.log(`Template: ${entry.template_name ?? "(none)"}`);
      console.log(`\n--- Raw Input ---\n${entry.raw_input}`);
      console.log(`\n--- Improved Output ---\n${entry.improved_output}`);
      console.log(`\n--- Final Output ---\n${entry.final_output}`);
    });

  // Clear
  hist
    .command("clear")
    .description("Clear all history")
    .action(async () => {
      const confirmed = await confirm({
        message: "Clear all history?",
        default: false,
      });

      if (!confirmed) {
        console.log("Cancelled.");
        return;
      }

      repo.clear();
      console.log("History cleared.");
    });
}

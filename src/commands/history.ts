import type { Command } from "commander";
import type { HistoryService } from "../core/history-service.js";
import { confirm } from "@inquirer/prompts";

export function registerHistoryCommand(
  program: Command,
  service: HistoryService,
): void {
  const hist = program.command("history").description("View prompt history");

  hist
    .option("-a, --all", "Show history across all directories")
    .option("-n, --limit <number>", "Number of entries to show", "20")
    .action((opts: Record<string, unknown>) => {
      const limit = parseInt(opts.limit as string, 10);
      const entries = service.list(!!opts.all, limit);

      if (entries.length === 0) {
        console.log("No history entries found.");
        if (!opts.all) {
          console.log("Tip: Use -a to show history from all directories.");
        }
        return;
      }

      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        console.log(`│ (${e.id}) (${e.model_name}) ${e.preview}`);
      }
    });

  hist
    .command("show <id>")
    .description("Show full detail of a history entry")
    .action((id: string) => {
      const entry = service.findById(parseInt(id, 10));
      if (!entry) {
        console.error(`Error: History entry #${id} not found.`);
        process.exit(1);
      }

      console.log(`(${entry.id})`);
      console.log(`│ Date:      ${entry.created_at}`);
      console.log(`│ Directory: ${entry.directory}`);
      console.log(`│ Model:     ${entry.model_name || "N/A"}`);
      console.log(`│ Raw Input:`);
      console.log(entry.raw_input);
      console.log(`│ Improved Output:`);
      console.log(entry.improved_output);
    });

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

      service.clear();
      console.log("History cleared.");
    });
}

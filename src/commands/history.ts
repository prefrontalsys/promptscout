import type { Command } from "commander";
import type { HistoryService } from "../core/history-service.js";
import { confirm } from "@inquirer/prompts";
import Table from "cli-table3";

export function registerHistoryCommand(
  program: Command,
  service: HistoryService,
): void {
  const hist = program.command("history").description("View prompt history");

  hist
    .option("-a, --all", "Show history across all directories")
    .option("-n, --limit <number>", "Number of entries per page", "10")
    .option("-p, --page <number>", "Page number", "1")
    .action((opts: Record<string, unknown>) => {
      const limit = parseInt(opts.limit as string, 10);
      const page = parseInt(opts.page as string, 10);
      const offset = (page - 1) * limit;

      const entries = service.list(!!opts.all, limit, offset);

      if (entries.length === 0 && page === 1) {
        console.log("No history entries found.");
        if (!opts.all) {
          console.log("Tip: Use -a to show history from all directories.");
        }
        return;
      }

      if (entries.length === 0) {
        console.log(`No entries on page ${page}.`);
        return;
      }

      const table = new Table({
        head: ["#", "Model", "Prompt"],
        colWidths: [6, 22, 60],
        wordWrap: true,
        style: { head: [], border: [] },
      });

      for (const e of entries) {
        table.push([String(e.id), e.model_name, e.preview]);
      }

      console.log(table.toString());
      console.log(`  Page ${page} | ${entries.length} entries | promptscout history -p ${page + 1}`);
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

      const table = new Table({
        style: { head: [], border: [] },
        wordWrap: true,
        colWidths: [14, 74],
      });

      table.push(
        ["ID", String(entry.id)],
        ["Date", entry.created_at],
        ["Directory", entry.directory],
        ["Model", entry.model_name || "N/A"],
      );

      console.log(table.toString());
      console.log("\nRaw Input:");
      console.log(entry.raw_input);
      console.log("\nImproved Output:");
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

import type { Command } from "commander";
import type { Orchestrator } from "../core/orchestrator.js";

export function registerRewriteCommand(program: Command, orchestrator: Orchestrator): void {
  program
    .argument("<prompt>", "Raw prompt to rewrite")
    .option("-o, --output <file>", "Write result to file instead of clipboard")
    .option("--dry-run", "Show result without copying or saving")
    .option("--json-output", "Output JSON instead of plain text")
    .option("--no-clipboard", "Skip clipboard copy")
    .option("--project-dir <dir>", "Project root directory (passed by Claude Code hook)")
    .action(async (prompt: string, opts: Record<string, unknown>) => {
      if (!prompt.trim()) {
        console.error("Error: Prompt cannot be empty.");
        console.error("Usage: better-prompt <prompt>");
        process.exit(1);
      }

      await orchestrator.processPrompt({
        rawPrompt: prompt,
        dryRun: opts.dryRun as boolean | undefined,
        outputFile: opts.output as string | undefined,
        jsonOutput: opts.jsonOutput as boolean | undefined,
        noClipboard: opts.clipboard === false,
        projectDir: opts.projectDir as string | undefined,
      });
    });
}

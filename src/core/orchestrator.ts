import type { ProcessOptions } from "../types.js";
import type { HistoryRepo } from "../storage/history-repo.js";
import type { Rewriter } from "./rewriter.js";
import { copyToClipboard } from "../output/clipboard.js";
import { writeOutputFile } from "../output/file-writer.js";

export class Orchestrator {
  constructor(
    private historyRepo: HistoryRepo,
    private rewriter: Rewriter,
  ) {}

  async processPrompt(options: ProcessOptions): Promise<{
    improved: string;
  }> {
    const {
      rawPrompt,
      dryRun,
      outputFile,
      jsonOutput,
      noClipboard,
      projectDir,
    } = options;

    const improved = await this.rewriter.rewrite(rawPrompt, projectDir);

    console.log("\n");

    if (jsonOutput) {
      console.log(JSON.stringify({ improved }));
    } else {
      console.log(improved);
    }

    if (dryRun) {
      return { improved };
    }

    if (outputFile) {
      writeOutputFile(outputFile, improved);
    }

    if (!noClipboard) {
      const copied = await copyToClipboard(improved);
      if (copied) {
        console.log("\nCopied to clipboard.");
      }
    }

    this.historyRepo.create({
      directory: projectDir ?? process.cwd(),
      raw_input: rawPrompt,
      improved_output: improved,
      final_output: improved,
      model_name: this.rewriter.getModelUri(),
    });

    return { improved };
  }
}

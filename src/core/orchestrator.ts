import type { ProcessOptions } from "../types.js";
import type { HistoryRepo } from "../storage/history-repo.js";
import type { Rewriter } from "./rewriter.js";
import type { TemplateService } from "./template-service.js";
import { copyToClipboard } from "../output/clipboard.js";
import { writeOutputFile } from "../output/file-writer.js";
import ora from "ora";

export class Orchestrator {
  constructor(
    private historyRepo: HistoryRepo,
    private rewriter: Rewriter,
    private templateService: TemplateService,
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

    const searchDir = projectDir ?? process.cwd();
    const template = this.templateService.resolve(searchDir);

    const spinner = jsonOutput ? null : ora().start();
    const onStatus = spinner
      ? (message: string) => { spinner.text = message; }
      : undefined;

    const { text: improved, templateUsed } = await this.rewriter.rewrite(rawPrompt, projectDir, onStatus, template);

    spinner?.stop();
    console.log("");

    if (jsonOutput) {
      console.log(JSON.stringify({ improved, templateUsed }));
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

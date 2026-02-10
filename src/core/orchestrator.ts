import type { ProcessOptions } from "../types.js";
import { DEFAULT_TEMPLATE_NAME } from "../constants.js";
import { TemplateRepo } from "../storage/template-repo.js";
import { HistoryRepo } from "../storage/history-repo.js";
import { rewritePrompt } from "./rewriter.js";
import { mergeTemplateAndPrompt } from "./merger.js";
import { createTokenHandler, endStream } from "./streamer.js";
import { copyToClipboard } from "../output/clipboard.js";
import { writeOutputFile } from "../output/file-writer.js";

const templateRepo = new TemplateRepo();
const historyRepo = new HistoryRepo();

export async function processPrompt(options: ProcessOptions): Promise<{
  improved: string;
  final: string;
}> {
  const {
    rawPrompt,
    templateName,
    skipTemplate,
    dryRun,
    outputFile,
    jsonOutput,
    noClipboard,
  } = options;

  // 1. Rewrite via LLM (stream tokens unless json output)
  const onToken = jsonOutput ? undefined : createTokenHandler();
  const improved = await rewritePrompt(rawPrompt, onToken);
  if (!jsonOutput) endStream();

  // 2. Load template (unless skipped)
  let templateContent: string | null = null;
  let usedTemplateName: string | null = null;

  if (!skipTemplate) {
    const name = templateName ?? DEFAULT_TEMPLATE_NAME;
    const template = templateRepo.findByName(name);
    if (template) {
      templateContent = template.content;
      usedTemplateName = template.name;
    } else if (templateName) {
      // User explicitly requested a template that doesn't exist
      const available = templateRepo.list().map((t) => t.name);
      const hint =
        available.length > 0
          ? `Available: ${available.join(", ")}`
          : "No templates found. Create one with: better-prompt templates add <name>";
      throw new Error(`Template '${templateName}' not found. ${hint}`);
    }
    // If default template doesn't exist, silently skip (not an error)
  }

  // 3. Merge
  const final = mergeTemplateAndPrompt(templateContent, improved);

  // 4. Output
  if (jsonOutput) {
    console.log(JSON.stringify({ improved, final }));
  }

  if (!dryRun) {
    if (outputFile) {
      writeOutputFile(outputFile, final);
    } else if (!noClipboard && !jsonOutput) {
      const copied = await copyToClipboard(final);
      if (copied) {
        console.log("\nCopied to clipboard.");
      }
    }

    // 5. Save history
    historyRepo.create({
      directory: process.cwd(),
      template_name: usedTemplateName,
      raw_input: rawPrompt,
      improved_output: improved,
      final_output: final,
    });
  }

  return { improved, final };
}

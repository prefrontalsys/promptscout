import type { Command } from "commander";
import type { TemplateService } from "../core/template-service.js";

export function registerTemplateCommand(
  program: Command,
  templateService: TemplateService,
): void {
  const tmpl = program
    .command("template")
    .description("Manage per-directory prompt templates");

  // promptscout template edit [-d <dir>]
  tmpl
    .command("edit")
    .option("-d, --dir <dir>", "Target directory", process.cwd())
    .action((opts: Record<string, unknown>) => {
      const dir = opts.dir as string;
      const saved = templateService.edit(dir);
      if (saved) {
        console.log(`Template saved for ${dir}`);
      } else {
        console.log("Template not saved (empty content).");
      }
    });

  // promptscout template show [-d <dir>]
  tmpl
    .command("show")
    .option("-d, --dir <dir>", "Target directory", process.cwd())
    .action((opts: Record<string, unknown>) => {
      const dir = opts.dir as string;
      const content = templateService.get(dir);
      if (content) {
        console.log(content);
      } else {
        console.log(`No template found for ${dir}`);
      }
    });

  // promptscout template delete [-d <dir>]
  tmpl
    .command("delete")
    .option("-d, --dir <dir>", "Target directory", process.cwd())
    .action((opts: Record<string, unknown>) => {
      const dir = opts.dir as string;
      const deleted = templateService.delete(dir);
      if (deleted) {
        console.log(`Template deleted for ${dir}`);
      } else {
        console.log(`No template found for ${dir}`);
      }
    });

  // promptscout template list
  tmpl
    .command("list")
    .action(() => {
      const entries = templateService.list();
      if (entries.length === 0) {
        console.log("No templates defined.");
        return;
      }
      for (const entry of entries) {
        const preview = entry.content.split("\n")[0]?.slice(0, 60) ?? "";
        console.log(`  ${entry.directory}  ${preview}...`);
      }
    });
}

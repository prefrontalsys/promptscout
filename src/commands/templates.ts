import type { Command } from "commander";
import type { TemplateService } from "../core/template-service.js";
import { openInEditor } from "../utils/editor.js";
import { confirm } from "@inquirer/prompts";

export function registerTemplatesCommand(program: Command, service: TemplateService): void {
  const tpl = program
    .command("templates")
    .description("Manage prompt templates");

  tpl.action(() => {
    const templates = service.list();
    if (templates.length === 0) {
      console.log("No templates found.");
      console.log('Create one with: better-prompt templates add <name>');
      return;
    }

    console.log("Templates:\n");
    for (const t of templates) {
      console.log(`  ${t.name}`);
      console.log(`    ${t.preview}`);
      console.log(`    Created: ${t.createdAt}\n`);
    }
  });

  tpl
    .command("add <name>")
    .description("Create a new template")
    .action((name: string) => {
      const content = openInEditor("");
      service.create(name, content);
      console.log(`Template '${name}' created.`);
    });

  tpl
    .command("edit <name>")
    .description("Edit an existing template")
    .action((name: string) => {
      const existing = service.findByName(name);
      if (!existing) {
        console.error(`Error: Template '${name}' not found.`);
        process.exit(1);
      }

      const content = openInEditor(existing.content);
      service.update(name, content);
      console.log(`Template '${name}' updated.`);
    });

  tpl
    .command("remove <name>")
    .description("Delete a template")
    .action(async (name: string) => {
      const existing = service.findByName(name);
      if (!existing) {
        console.error(`Error: Template '${name}' not found.`);
        process.exit(1);
      }

      const confirmed = await confirm({
        message: `Delete template '${name}'?`,
        default: false,
      });

      if (!confirmed) {
        console.log("Cancelled.");
        return;
      }

      service.delete(name);
      console.log(`Template '${name}' deleted.`);
    });

  tpl
    .command("show <name>")
    .description("Print full template content")
    .action((name: string) => {
      const content = service.show(name);
      console.log(content);
    });
}

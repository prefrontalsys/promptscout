import type { Command } from "commander";
import { TemplateRepo } from "../storage/template-repo.js";
import { openInEditor } from "../utils/editor.js";
import { confirm } from "@inquirer/prompts";

const repo = new TemplateRepo();

export function registerTemplatesCommand(program: Command): void {
  const tpl = program
    .command("templates")
    .description("Manage prompt templates");

  // List templates (default action)
  tpl.action(() => {
    const templates = repo.list();
    if (templates.length === 0) {
      console.log("No templates found.");
      console.log('Create one with: better-prompt templates add <name>');
      return;
    }

    console.log("Templates:\n");
    for (const t of templates) {
      const preview =
        t.content.length > 80
          ? t.content.slice(0, 80).replace(/\n/g, " ") + "..."
          : t.content.replace(/\n/g, " ");
      console.log(`  ${t.name}`);
      console.log(`    ${preview}`);
      console.log(`    Created: ${t.created_at}\n`);
    }
  });

  // Add
  tpl
    .command("add <name>")
    .description("Create a new template")
    .action((name: string) => {
      const existing = repo.findByName(name);
      if (existing) {
        console.error(`Error: Template '${name}' already exists. Use 'edit' to modify it.`);
        process.exit(1);
      }

      const content = openInEditor("");
      if (!content.trim()) {
        console.error("Error: Template content cannot be empty.");
        process.exit(1);
      }

      repo.create(name, content);
      console.log(`Template '${name}' created.`);
    });

  // Edit
  tpl
    .command("edit <name>")
    .description("Edit an existing template")
    .action((name: string) => {
      const template = repo.findByName(name);
      if (!template) {
        console.error(`Error: Template '${name}' not found.`);
        listAvailable();
        process.exit(1);
      }

      const content = openInEditor(template.content);
      if (!content.trim()) {
        console.error("Error: Template content cannot be empty.");
        process.exit(1);
      }

      repo.update(name, content);
      console.log(`Template '${name}' updated.`);
    });

  // Remove
  tpl
    .command("remove <name>")
    .description("Delete a template")
    .action(async (name: string) => {
      const template = repo.findByName(name);
      if (!template) {
        console.error(`Error: Template '${name}' not found.`);
        listAvailable();
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

      repo.delete(name);
      console.log(`Template '${name}' deleted.`);
    });

  // Show
  tpl
    .command("show <name>")
    .description("Print full template content")
    .action((name: string) => {
      const template = repo.findByName(name);
      if (!template) {
        console.error(`Error: Template '${name}' not found.`);
        listAvailable();
        process.exit(1);
      }

      console.log(template.content);
    });
}

function listAvailable(): void {
  const templates = repo.list();
  if (templates.length > 0) {
    console.error(`Available: ${templates.map((t) => t.name).join(", ")}`);
  }
}

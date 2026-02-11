import type { TemplateRepo } from "../storage/template-repo.js";
import type { Template } from "../types.js";
import { TEMPLATE_PREVIEW_LENGTH } from "../constants.js";
import { truncate } from "../utils/text.js";

export interface TemplateListItem {
  name: string;
  preview: string;
  createdAt: string;
}

export class TemplateService {
  constructor(private templateRepo: TemplateRepo) {}

  list(): TemplateListItem[] {
    return this.templateRepo.list().map((t) => ({
      name: t.name,
      preview: truncate(t.content, TEMPLATE_PREVIEW_LENGTH),
      createdAt: t.created_at,
    }));
  }

  findByName(name: string): Template | undefined {
    return this.templateRepo.findByName(name);
  }

  create(name: string, content: string): void {
    if (this.templateRepo.findByName(name)) {
      throw new Error(`Template '${name}' already exists. Use 'edit' to modify it.`);
    }
    if (!content.trim()) {
      throw new Error("Template content cannot be empty.");
    }
    this.templateRepo.create(name, content);
  }

  update(name: string, content: string): void {
    if (!this.templateRepo.findByName(name)) {
      throw new Error(`Template '${name}' not found.${this.availableHint()}`);
    }
    if (!content.trim()) {
      throw new Error("Template content cannot be empty.");
    }
    this.templateRepo.update(name, content);
  }

  delete(name: string): void {
    if (!this.templateRepo.findByName(name)) {
      throw new Error(`Template '${name}' not found.${this.availableHint()}`);
    }
    this.templateRepo.delete(name);
  }

  show(name: string): string {
    const template = this.templateRepo.findByName(name);
    if (!template) {
      throw new Error(`Template '${name}' not found.${this.availableHint()}`);
    }
    return template.content;
  }

  private availableHint(): string {
    const templates = this.templateRepo.list();
    if (templates.length > 0) {
      return ` Available: ${templates.map((t) => t.name).join(", ")}`;
    }
    return "";
  }
}

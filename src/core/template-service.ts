import { resolve, dirname, join } from "node:path";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import type { TemplateRepo } from "../storage/template-repo.js";

const PLACEHOLDER = "<@prompt>";

export class TemplateService {
  constructor(private templateRepo: TemplateRepo) {}

  edit(directory: string): boolean {
    const absDir = resolve(directory);
    const existing = this.templateRepo.get(absDir);
    const editor = process.env.EDITOR || process.env.VISUAL || "vi";
    const tmpFile = join(tmpdir(), `promptscout-template-${Date.now()}.txt`);

    writeFileSync(tmpFile, existing?.content ?? `\n${PLACEHOLDER}\n\n`, "utf-8");

    try {
      execFileSync(editor, [tmpFile], { stdio: "inherit" });
    } catch {
      unlinkSync(tmpFile);
      return false;
    }

    const content = readFileSync(tmpFile, "utf-8");
    unlinkSync(tmpFile);

    if (!content.trim()) return false;

    this.templateRepo.upsert(absDir, content);
    return true;
  }

  delete(directory: string): boolean {
    return this.templateRepo.delete(resolve(directory));
  }

  get(directory: string): string | undefined {
    return this.templateRepo.get(resolve(directory))?.content;
  }

  list(): { directory: string; content: string }[] {
    return this.templateRepo.list();
  }

  resolve(directory: string): string | undefined {
    let current = resolve(directory);
    const root = resolve("/");
    while (true) {
      const entry = this.templateRepo.get(current);
      if (entry) return entry.content;
      if (current === root) break;
      current = dirname(current);
    }
    return undefined;
  }

  apply(template: string, content: string): string {
    return template.replace(PLACEHOLDER, content);
  }
}

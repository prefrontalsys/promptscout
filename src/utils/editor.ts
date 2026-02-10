import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function openInEditor(initialContent: string = ""): string {
  const editor = process.env.VISUAL || process.env.EDITOR || "vi";
  const tmpDir = mkdtempSync(join(tmpdir(), "better-prompt-"));
  const tmpFile = join(tmpDir, "edit.md");

  writeFileSync(tmpFile, initialContent, "utf-8");

  const result = spawnSync(editor, [tmpFile], { stdio: "inherit" });

  if (result.status !== 0) {
    try { unlinkSync(tmpFile); } catch {}
    throw new Error(`Editor exited with code ${result.status}`);
  }

  const content = readFileSync(tmpFile, "utf-8");

  try { unlinkSync(tmpFile); } catch {}

  return content;
}

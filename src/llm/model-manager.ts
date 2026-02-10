import { existsSync } from "node:fs";
import { readdirSync } from "node:fs";
import { resolveModelDir } from "../utils/paths.js";

export function isModelDownloaded(): boolean {
  const dir = resolveModelDir();
  try {
    const files = readdirSync(dir);
    return files.some((f) => f.endsWith(".gguf"));
  } catch {
    return false;
  }
}

export function getModelDir(): string {
  return resolveModelDir();
}

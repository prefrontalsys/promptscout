import { existsSync } from "node:fs";
import { join } from "node:path";
import { MODEL_FILE_NAME } from "../constants.js";
import { resolveModelDir } from "../utils/paths.js";

export function isModelDownloaded(): boolean {
  const dir = resolveModelDir();
  return existsSync(join(dir, MODEL_FILE_NAME));
}

export function getModelDir(): string {
  return resolveModelDir();
}

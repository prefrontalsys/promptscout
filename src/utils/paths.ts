import { mkdirSync } from "node:fs";
import { DATA_DIR, DB_PATH, MODEL_DIR } from "../constants.js";

export function resolveDataDir(): string {
  mkdirSync(DATA_DIR, { recursive: true });
  return DATA_DIR;
}

export function resolveDbPath(): string {
  resolveDataDir();
  return DB_PATH;
}

export function resolveModelDir(): string {
  mkdirSync(MODEL_DIR, { recursive: true });
  return MODEL_DIR;
}

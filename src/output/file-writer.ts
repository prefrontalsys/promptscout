import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function writeOutputFile(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf-8");
  console.log(`\nOutput written to: ${filePath}`);
}

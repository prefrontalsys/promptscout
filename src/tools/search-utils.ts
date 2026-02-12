import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ignore, { type Ignore } from "ignore";

const GREP_TIMEOUT = 5_000;
const GIT_TIMEOUT = 5_000;

// Hardcoded for grep traversal performance only.
// .git is never in .gitignore (git handles it internally).
// node_modules is virtually always gitignored and huge.
const PERF_EXCLUDE_FLAGS = ["--exclude-dir", ".git", "--exclude-dir", "node_modules"];

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function loadIgnoreFilter(dir: string): Ignore {
  const ig = ignore();
  try {
    const content = readFileSync(join(dir, ".gitignore"), "utf-8");
    ig.add(content);
  } catch {
    // No .gitignore — no extra filtering
  }
  return ig;
}

function extractRelativePath(line: string, dir: string): string {
  const relative = line.startsWith(dir + "/")
    ? line.slice(dir.length + 1)
    : line;
  const match = relative.match(/^(.+?):\d+:/);
  return match ? match[1] : relative;
}

export function filterLines(lines: string[], dir: string, ig: Ignore): string[] {
  return lines.filter((line) => {
    const rel = extractRelativePath(line, dir);
    return !ig.ignores(rel);
  });
}

export function stripDirPrefix(line: string, dir: string): string {
  return line.replace(dir + "/", "");
}

export function grepSync(args: string[], cwd: string): string {
  try {
    return execFileSync("grep", [...PERF_EXCLUDE_FLAGS, ...args], {
      cwd,
      timeout: GREP_TIMEOUT,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
    }).trim();
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && err.status === 1) {
      return "";
    }
    return "";
  }
}

export function gitSync(args: string[], cwd: string): string {
  try {
    return execFileSync("git", args, {
      cwd,
      timeout: GIT_TIMEOUT,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
    }).trim();
  } catch {
    return "";
  }
}

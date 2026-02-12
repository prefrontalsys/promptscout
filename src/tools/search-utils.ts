import { execFileSync } from "node:child_process";

const RG_TIMEOUT = 5_000;
const GIT_TIMEOUT = 5_000;

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripDirPrefix(line: string, dir: string): string {
  return line.replace(dir + "/", "").replace(/^\.\//, "");
}

export function rgSync(args: string[], cwd: string): string {
  try {
    // Explicit "." prevents rg from reading stdin when spawned by Node.js
    return execFileSync("rg", [...args, "."], {
      cwd,
      timeout: RG_TIMEOUT,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
    }).trim();
  } catch {
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

const MAX_TREE_LINES = 80;
const MAX_TREE_DEPTH = 4;

export function buildProjectTree(dir: string): string {
  const output = gitSync(["ls-files"], dir);
  if (!output) return "";

  const files = output.split("\n").filter(Boolean);

  // Build nested map from flat file paths
  const tree = new Map<string, unknown>();
  for (const file of files) {
    const parts = file.split("/");
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current.set(part, null);
      } else {
        if (!current.has(part)) current.set(part, new Map());
        current = current.get(part) as Map<string, unknown>;
      }
    }
  }

  const lines: string[] = [];

  function render(node: Map<string, unknown>, indent: string, depth: number) {
    if (lines.length >= MAX_TREE_LINES || depth > MAX_TREE_DEPTH) return;

    const entries = [...node.entries()].sort(([, av], [, bv]) => {
      const aDir = av instanceof Map;
      const bDir = bv instanceof Map;
      if (aDir && !bDir) return -1;
      if (!aDir && bDir) return 1;
      return 0;
    });

    for (const [name, value] of entries) {
      if (lines.length >= MAX_TREE_LINES) break;
      if (value instanceof Map) {
        lines.push(`${indent}${name}/`);
        render(value, indent + "  ", depth + 1);
      } else {
        lines.push(`${indent}${name}`);
      }
    }
  }

  render(tree, "", 0);

  if (files.length > lines.length) {
    lines.push(`... (${files.length} files total)`);
  }

  return lines.join("\n");
}

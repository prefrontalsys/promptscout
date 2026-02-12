import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ignore, { type Ignore } from "ignore";
import { convert } from "html-to-text";
import ky from "ky";

export interface ToolCall {
  name: string;
  arguments: Record<string, string>;
}

const FILE_EXTENSIONS = ["ts", "tsx", "js", "jsx", "mjs"];
const INCLUDE_FLAGS = FILE_EXTENSIONS.flatMap((ext) => [
  "--include",
  `*.${ext}`,
]);

// Hardcoded for grep traversal performance only.
// .git is never in .gitignore (git handles it internally).
// node_modules is virtually always gitignored and huge.
const PERF_EXCLUDE_FLAGS = ["--exclude-dir", ".git", "--exclude-dir", "node_modules"];

const GREP_TIMEOUT = 5_000;
const GIT_TIMEOUT = 5_000;
const HTTP_TIMEOUT = 10_000;

const MAX_FILES = 10;
const MAX_LINES = 15;
const MAX_COMMITS = 10;
const MAX_CHARS = 2000;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function loadIgnoreFilter(dir: string): Ignore {
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
  // For grep -n output (path:linenum:content), extract just the path
  const match = relative.match(/^(.+?):\d+:/);
  return match ? match[1] : relative;
}

function filterLines(
  lines: string[],
  dir: string,
  ig: Ignore,
): string[] {
  return lines.filter((line) => {
    const rel = extractRelativePath(line, dir);
    return !ig.ignores(rel);
  });
}

function grepSync(args: string[], cwd: string): string {
  try {
    return execFileSync("grep", args, {
      cwd,
      timeout: GREP_TIMEOUT,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
    }).trim();
  } catch (err: unknown) {
    // grep exits 1 when no matches — that's fine
    if (err && typeof err === "object" && "status" in err && err.status === 1) {
      return "";
    }
    return "";
  }
}

function fileFinder(query: string, dir: string, ig: Ignore): string {
  const escaped = escapeRegex(query);
  const output = grepSync(
    ["-rli", ...INCLUDE_FLAGS, ...PERF_EXCLUDE_FLAGS, "-E", escaped, dir],
    dir,
  );
  if (!output) return "No matching files found.";
  const lines = filterLines(output.split("\n"), dir, ig).slice(0, MAX_FILES);
  if (lines.length === 0) return "No matching files found.";
  return lines.map((l) => l.replace(dir + "/", "")).join("\n");
}

function sectionFinder(query: string, dir: string, ig: Ignore): string {
  const escaped = escapeRegex(query);
  const output = grepSync(
    ["-rni", ...INCLUDE_FLAGS, ...PERF_EXCLUDE_FLAGS, "-E", escaped, dir],
    dir,
  );
  if (!output) return "No matching code found.";
  const lines = filterLines(output.split("\n"), dir, ig).slice(0, MAX_LINES);
  if (lines.length === 0) return "No matching code found.";
  return lines.map((l) => l.replace(dir + "/", "")).join("\n");
}

function definitionFinder(query: string, dir: string, ig: Ignore): string {
  const output = grepSync(
    [
      "-rnE",
      ...INCLUDE_FLAGS,
      ...PERF_EXCLUDE_FLAGS,
      "export\\s+(default\\s+)?(function|class|interface|type|const|enum)",
      dir,
    ],
    dir,
  );
  if (!output) return "No exported definitions found.";

  const lowerQuery = query.toLowerCase();
  const filtered = filterLines(output.split("\n"), dir, ig)
    .filter((line) => line.toLowerCase().includes(lowerQuery))
    .slice(0, MAX_LINES);

  if (filtered.length === 0) return "No matching definitions found.";
  return filtered.map((l) => l.replace(dir + "/", "")).join("\n");
}

function importTracer(query: string, dir: string, ig: Ignore): string {
  const escaped = escapeRegex(query);
  const output = grepSync(
    ["-rnE", ...INCLUDE_FLAGS, ...PERF_EXCLUDE_FLAGS, `(import|from).*${escaped}`, dir],
    dir,
  );
  if (!output) return "No matching imports found.";
  const lines = filterLines(output.split("\n"), dir, ig).slice(0, MAX_LINES);
  if (lines.length === 0) return "No matching imports found.";
  return lines.map((l) => l.replace(dir + "/", "")).join("\n");
}

function gitHistory(query: string, dir: string): string {
  try {
    const output = execFileSync(
      "git",
      ["log", "--oneline", "-n", String(MAX_COMMITS), "-S", query],
      {
        cwd: dir,
        timeout: GIT_TIMEOUT,
        encoding: "utf-8",
        maxBuffer: 1024 * 1024,
      },
    ).trim();
    if (!output) return "No commits found matching this keyword.";
    return output;
  } catch {
    return "Failed to read git history.";
  }
}

async function externalLinkSummarizer(url: string): Promise<string> {
  try {
    const response = await ky.get(url, { timeout: HTTP_TIMEOUT });
    const html = await response.text();
    let text = convert(html, { wordwrap: false });
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + "\n<content_clipped>";
    }
    return text || "Empty response from URL.";
  } catch {
    return "Failed to fetch URL.";
  }
}

export async function executeToolCall(
  call: ToolCall,
  dir: string,
  ig: Ignore,
): Promise<string> {
  switch (call.name) {
    case "file_finder":
      return fileFinder(call.arguments.query, dir, ig);
    case "section_finder":
      return sectionFinder(call.arguments.query, dir, ig);
    case "definition_finder":
      return definitionFinder(call.arguments.query, dir, ig);
    case "import_tracer":
      return importTracer(call.arguments.query, dir, ig);
    case "git_history":
      return gitHistory(call.arguments.query, dir);
    case "external_link_summarizer":
      return externalLinkSummarizer(call.arguments.url);
    default:
      return `Unknown tool: ${call.name}`;
  }
}

export { loadIgnoreFilter };

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "file_finder",
      description: "Search for files matching a keyword. Returns file paths.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Single keyword (e.g., 'camera', 'auth')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "section_finder",
      description:
        "Find code lines matching a keyword. Returns file:line:code.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Single keyword (e.g., 'generate', 'CameraView')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "definition_finder",
      description:
        "Find exported function, class, type, and interface definitions matching a keyword.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Single keyword (e.g., 'Camera', 'Router')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "import_tracer",
      description:
        "Find import statements referencing a module or keyword. Shows who depends on what.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Module or keyword (e.g., 'camera', 'utils')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "git_history",
      description:
        "Find recent commits that added or removed code matching a keyword.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Single keyword (e.g., 'camera', 'auth')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "external_link_summarizer",
      description:
        "Fetch a URL and return its text content. Use ONLY for URLs explicitly mentioned in the prompt.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to fetch" },
        },
        required: ["url"],
      },
    },
  },
];

import type { Ignore } from "ignore";
import { convert } from "html-to-text";
import ky from "ky";
import {
  escapeRegex,
  filterLines,
  stripDirPrefix,
  grepSync,
  gitSync,
} from "./search-utils.js";

const MAX_FILES = 10;
const MAX_LINES = 15;
const MAX_COMMITS = 10;
const MAX_CHARS = 2000;
const HTTP_TIMEOUT = 10_000;

// Multi-language definition patterns:
// JS/TS: export, function, class, interface, type, const, enum
// Python: def, class, async def
// Go: func, type, var, const
// Rust: pub fn, pub struct, pub enum, pub type, pub trait, fn, struct, enum, trait
// Swift: func, class, struct, enum, protocol
// Ruby: def, class, module
// Java/Kotlin: public class, public interface, abstract class
const DEFINITION_PATTERN =
  "(export\\s+(default\\s+)?)?(pub\\s+)?(async\\s+)?" +
  "(function|class|interface|type|const|enum|struct|trait|protocol|module|def|func|fn|var|let|val)\\s+";

export function fileFinder(query: string, dir: string, ig: Ignore): string {
  const escaped = escapeRegex(query);
  const output = grepSync(["-rli", "-E", escaped, dir], dir);

  if (!output) return "No matching files found.";

  const lines = filterLines(output.split("\n"), dir, ig).slice(0, MAX_FILES);
  if (lines.length === 0) return "No matching files found.";

  return lines.map((l) => stripDirPrefix(l, dir)).join("\n");
}

export function sectionFinder(query: string, dir: string, ig: Ignore): string {
  const escaped = escapeRegex(query);
  const output = grepSync(["-rni", "-E", escaped, dir], dir);

  if (!output) return "No matching code found.";

  const lines = filterLines(output.split("\n"), dir, ig).slice(0, MAX_LINES);
  if (lines.length === 0) return "No matching code found.";

  return lines.map((l) => stripDirPrefix(l, dir)).join("\n");
}

export function definitionFinder(query: string, dir: string, ig: Ignore): string {
  const output = grepSync(["-rnE", DEFINITION_PATTERN, dir], dir);

  if (!output) return "No definitions found.";

  const lowerQuery = query.toLowerCase();
  const filtered = filterLines(output.split("\n"), dir, ig)
    .filter((line) => line.toLowerCase().includes(lowerQuery))
    .slice(0, MAX_LINES);

  if (filtered.length === 0) return "No matching definitions found.";

  return filtered.map((l) => stripDirPrefix(l, dir)).join("\n");
}

export function importTracer(query: string, dir: string, ig: Ignore): string {
  const escaped = escapeRegex(query);
  const output = grepSync(["-rnE", `(import|from|require|include|use).*${escaped}`, dir], dir);

  if (!output) return "No matching imports found.";

  const lines = filterLines(output.split("\n"), dir, ig).slice(0, MAX_LINES);
  if (lines.length === 0) return "No matching imports found.";

  return lines.map((l) => stripDirPrefix(l, dir)).join("\n");
}

export function gitHistory(query: string, dir: string): string {
  const output = gitSync(
    ["log", "--oneline", "-n", String(MAX_COMMITS), "-S", query],
    dir,
  );

  if (!output) return "No commits found matching this keyword.";
  return output;
}

export async function externalLinkSummarizer(url: string): Promise<string> {
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

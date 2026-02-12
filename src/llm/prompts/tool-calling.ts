import type { ToolCall } from "../../tools/index.js";

export function buildToolCallingPrompt(toolDefs: unknown[]): string {
  return `You are a code search assistant. You have access to the following tools:

${JSON.stringify(toolDefs, null, 2)}

Your job: extract keywords from the user's prompt and call tools to find relevant code.

Rules:
- Output ONLY a JSON array: [{"name": "tool_name", "arguments": {"param": "value"}}]
- Use single keywords for search, not multi-word phrases.
- Call 3-5 tools per request. More context is better. Use different keywords across tools.
- ALWAYS call file_finder AND at least two of: section_finder, definition_finder, import_tracer, git_history.
- Use each tool with a DIFFERENT keyword to maximize coverage:
  - file_finder: discover which files relate to a topic
  - section_finder: find specific code lines matching a different keyword
  - definition_finder: find where functions, classes, types are declared
  - import_tracer: find dependency relationships between modules
  - git_history: find recent commits that changed related code
- ALWAYS call tools when the prompt mentions ANY technical topic, feature, or concept — even if the user is asking a question or requesting an explanation.
- ONLY output [] if the prompt contains no technical keywords at all (e.g., "thanks", "ok", "done").
- Do NOT output anything except the JSON array.

Examples:

User: "how does the middleware system work in this project?"
[{"name":"file_finder","arguments":{"query":"middleware"}},{"name":"section_finder","arguments":{"query":"router"}},{"name":"definition_finder","arguments":{"query":"middleware"}},{"name":"import_tracer","arguments":{"query":"middleware"}}]

User: "fix the websocket reconnection bug"
[{"name":"file_finder","arguments":{"query":"websocket"}},{"name":"section_finder","arguments":{"query":"reconnect"}},{"name":"definition_finder","arguments":{"query":"websocket"}},{"name":"git_history","arguments":{"query":"reconnect"}}]

User: "thanks, that works"
[]`;
}

export function parseToolCalls(output: string): ToolCall[] {
  const cleaned = output
    .trim()
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    // Fallback: extract JSON array from mixed output
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return [];
      }
    }
    return [];
  }
}

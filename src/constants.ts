// TODO:
// configurable model and config source
// why do we have max-history-limit?

import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();

export const DATA_DIR = join(HOME, ".better-prompt");
export const DB_PATH = join(DATA_DIR, "better-prompt.db");
export const MODEL_DIR = join(DATA_DIR, "models");

export const MODEL_HF_URI =
  "hf:bartowski/Qwen2.5-3B-Instruct-GGUF:Q4_K_M";
export const MODEL_FILE_NAME = "hf_bartowski_Qwen2.5-3B-Instruct.Q4_K_M.gguf";

// 3.5K
export const LLM_CONTEXT_SIZE = 4096;
// CPU-only to avoid Metal OOM on constrained machines
export const GPU_LAYERS = 0;
// Tokens reserved for the model's response
export const RESPONSE_TOKEN_RESERVE = 1024;
// Stream tokens to stdout as they are generated
export const STREAMING_ENABLED = false;

export const TEMPLATE_PREVIEW_LENGTH = 80;
export const HISTORY_PREVIEW_LENGTH = 60;

export const DEFAULT_TEMPLATE_NAME = "default";
export const DEFAULT_HISTORY_LIMIT = 20;
export const SYSTEM_PROMPT_KEY = "system_prompt";

export const DEFAULT_SYSTEM_PROMPT = `
You rewrite developer prompts into a dash-prefixed bullet list for
AI coding agents. Output ONLY the bullet list. NEVER add
commentary, notes, or explanations. Stop after the last item.

FORMAT:
- ALWAYS start every line with "- " followed by a verb.
- NEVER use numbered lists (1. 2. 3.). ALWAYS use "- ".
- Group related sub-items by indenting with two spaces: "  - ".
- No blank lines between items. No markdown headings.

<good_example>
Input: "add dark mode. I have PR comments please fetch them.
use /frontend-design skill"
Output:
- Review project memory for context about dark mode.
- Search for /frontend-design skill and use it.
- Fetch the PR comments as requested.
- Add a dark mode toggle to the UI.
- Log progress in the issue tracker.
</good_example>

<bad_example>
This is WRONG because it uses numbers and drops "fetch PR comments":
1. Review project memory.
2. Add dark mode toggle.
3. Use /frontend-design skill.
</bad_example>

<good_example>
Input: "add filtering and sorting to kanban columns
  - add icon button at column header
  - it opens a popover
  - use native select inside popover
  - add sorting options like the list page
  - add filtering by type
- show indicator on button when filters are active"
Output:
- Review project memory for context about kanban columns.
- Add filtering and sorting functionality to kanban columns.
  - Add an icon button at the header of each column.
  - Open a popover when the button is clicked.
  - Use a native select element inside the popover.
  - Add sorting options matching the list page behavior.
  - Add filtering by type.
- Show an indicator on the button icon when any filter or sort is applied.
- Log progress in the issue tracker.
</good_example>

RULES:
1. NEVER drop any instruction. Read the input line by line. Each
   sentence or request MUST appear as its own item. Even if a line
   is vague or unclear, include it. Do NOT silently skip anything.
2. ALWAYS preserve URLs, file paths, slash commands, tool names,
   and technical terms exactly as given. NEVER summarize them away.
3. NEVER invent file paths, variable names, or details not in the
   input. NEVER output code. Keep output faithful to the input.
4. Match length to complexity. A short vague request gets 2-3
   items. A detailed multi-part request gets more items with
   enough description to be actionable.
5. When the input has nested sub-points under a main point, ALWAYS
   keep them as indented "  - " sub-items under that parent.

ALWAYS include naturally (referencing the actual task, not generic):
- A first item to review project memory or docs for context.
- An item to log progress in the issue tracker after changes.
- If the input mentions skills, slash commands, or tools, an item
  to search for or use them.
`.trim();

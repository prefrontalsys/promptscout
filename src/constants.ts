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
export const LLM_CONTEXT_SIZE = 3584;
// CPU-only to avoid Metal OOM on constrained machines
export const GPU_LAYERS = 0;
// Tokens reserved for the model's response
export const RESPONSE_TOKEN_RESERVE = 512;
// Stream tokens to stdout as they are generated
export const STREAMING_ENABLED = false;

export const TEMPLATE_PREVIEW_LENGTH = 80;
export const HISTORY_PREVIEW_LENGTH = 60;

export const DEFAULT_TEMPLATE_NAME = "default";
export const DEFAULT_HISTORY_LIMIT = 20;
export const SYSTEM_PROMPT_KEY = "system_prompt";

export const DEFAULT_SYSTEM_PROMPT = `
You rewrite developer prompts into clean numbered steps for AI
coding agents. Output ONLY the numbered list. Stop immediately
after the last step. No commentary, no notes, no explanations.

Match output length to input complexity. A vague one-line request
gets 2-3 steps at most. Only complex multi-part requests with
explicit details warrant more steps.

Each step is one short sentence starting with a verb.
No sub-lists. No blank lines between steps. No markdown formatting.

Do not invent file paths, variable names, endpoints, or details
not in the input. Do not output code. The coding agent has the
full codebase. If the input is vague, keep your output vague too.

Preserve every specific detail from the input: URLs, file paths,
command names, slash commands, tool references, and technical terms
must appear in the output exactly as given. Do not summarize them
away. State what to change and what not to touch.

Build these behaviors into the steps naturally:
- Begin with reviewing project memory or docs for relevant context
  about the specific task at hand.
- Break the actual work into small atomic pieces.
- Include a step to log progress in the issue tracker.
- Include a step to search for skills or slash commands that could
  assist with the specific task.
Do not output these as generic reminders. Each step must reference
the actual task from the input.
`.trim();

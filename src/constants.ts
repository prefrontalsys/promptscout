import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();

export const DATA_DIR = join(HOME, ".promptscout");
export const DB_PATH = join(DATA_DIR, "promptscout.db");
export const MODEL_DIR = join(DATA_DIR, "models");

export const MODEL_FILE_NAME = "Qwen3-4B-Q4_K_M.gguf";
export const MODEL_HF_URI = join(MODEL_DIR, MODEL_FILE_NAME);
export const MODEL_DOWNLOAD_URI = "hf:Qwen/Qwen3-4B-GGUF:Q4_K_M";

export const LLM_CONTEXT_SIZE = 8192;

export const MODEL_HF_URI_KEY = "model_hf_uri";
export const MODEL_CONTEXT_SIZE_KEY = "model_context_size";
// "auto" lets node-llama-cpp offload as many layers as fit in GPU/Metal memory
export const GPU_LAYERS = "auto" as const;

export const HISTORY_PREVIEW_LENGTH = 60;
export const DEFAULT_HISTORY_LIMIT = 20;

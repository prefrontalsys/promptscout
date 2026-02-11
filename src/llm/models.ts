import type { ModelInfo } from "../types.js";

export const CURATED_MODELS: ModelInfo[] = [
  // --- Small (≤ 2.5 GB) ---
  {
    name: "Llama 3.2 3B Instruct (Q4_K_M)",
    hfUri: "hf:bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M",
    contextSize: 4096,
    sizeLabel: "~2.0 GB",
  },
  {
    name: "EXAONE 3.5 2.4B Instruct (Q4_K_M)",
    hfUri: "hf:lmstudio-community/EXAONE-3.5-2.4B-Instruct-GGUF:Q4_K_M",
    contextSize: 4096,
    sizeLabel: "~1.5 GB",
  },
  {
    name: "Qwen 2.5 3B Instruct (Q4_K_M)",
    hfUri: "hf:bartowski/Qwen2.5-3B-Instruct-GGUF:Q4_K_M",
    contextSize: 4096,
    sizeLabel: "~2.0 GB",
  },
  {
    name: "Phi-4 Mini Instruct (Q4_K_M)",
    hfUri: "hf:bartowski/microsoft_Phi-4-mini-instruct-GGUF:Q4_K_M",
    contextSize: 4096,
    sizeLabel: "~2.3 GB",
  },
  {
    name: "Gemma 3 4B Instruct (Q4_K_M)",
    hfUri: "hf:lmstudio-community/gemma-3-4b-it-GGUF:Q4_K_M",
    contextSize: 4096,
    sizeLabel: "~2.3 GB",
  },
  // --- Medium (≤ 4 GB) ---
  {
    name: "Qwen 2.5 7B Instruct (Q3_K_L)",
    hfUri: "hf:bartowski/Qwen2.5-7B-Instruct-GGUF:Q3_K_L",
    contextSize: 4096,
    sizeLabel: "~3.8 GB",
  },
  {
    name: "Llama 3.1 8B Instruct (Q3_K_M)",
    hfUri: "hf:bartowski/Meta-Llama-3.1-8B-Instruct-GGUF:Q3_K_M",
    contextSize: 4096,
    sizeLabel: "~3.7 GB",
  },
  {
    name: "EXAONE 3.5 7.8B Instruct (Q3_K_L)",
    hfUri: "hf:lmstudio-community/EXAONE-3.5-7.8B-Instruct-GGUF:Q3_K_L",
    contextSize: 4096,
    sizeLabel: "~3.9 GB",
  },
  {
    name: "WizardLM-2 7B (Q4_K_S)",
    hfUri: "hf:bartowski/WizardLM-2-7B-GGUF:Q4_K_S",
    contextSize: 4096,
    sizeLabel: "~3.9 GB",
  },
];

import type { ModelInfo } from "../types.js";

export const CURATED_MODELS: ModelInfo[] = [
  // --- Small (≤ 2.5 GB) ---
  {
    name: "Llama 3.2 3B Instruct (Q4_K_M)",
    description: "Requires ~2 GB memory. Good balance of quality and speed. Default model.",
    isDefault: true,
    hfUri: "hf:bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M",
    contextSize: 4096,
    sizeLabel: "~2.0 GB",
  },
  {
    name: "EXAONE 3.5 2.4B Instruct (Q4_K_M)",
    description: "Requires ~1.5 GB memory. Smallest and fastest option.",
    hfUri: "hf:lmstudio-community/EXAONE-3.5-2.4B-Instruct-GGUF:Q4_K_M",
    contextSize: 4096,
    sizeLabel: "~1.5 GB",
  },
  {
    name: "Qwen 2.5 3B Instruct (Q4_K_M)",
    description: "Requires ~2 GB memory. Strong multilingual support.",
    hfUri: "hf:bartowski/Qwen2.5-3B-Instruct-GGUF:Q4_K_M",
    contextSize: 4096,
    sizeLabel: "~2.0 GB",
  },
  {
    name: "Phi-4 Mini Instruct (Q4_K_M)",
    description: "Requires ~2.5 GB memory. Strong reasoning for its size.",
    hfUri: "hf:bartowski/microsoft_Phi-4-mini-instruct-GGUF:Q4_K_M",
    contextSize: 4096,
    sizeLabel: "~2.3 GB",
  },
  {
    name: "Gemma 3 4B Instruct (Q4_K_M)",
    description: "Requires ~2.5 GB memory. Google's compact instruct model.",
    hfUri: "hf:lmstudio-community/gemma-3-4b-it-GGUF:Q4_K_M",
    contextSize: 4096,
    sizeLabel: "~2.3 GB",
  },
  // --- Medium (≤ 4 GB) ---
  {
    name: "Qwen 2.5 7B Instruct (Q3_K_L)",
    description: "Requires ~4 GB memory. Higher quality, slower inference.",
    hfUri: "hf:bartowski/Qwen2.5-7B-Instruct-GGUF:Q3_K_L",
    contextSize: 4096,
    sizeLabel: "~3.8 GB",
  },
  {
    name: "Llama 3.1 8B Instruct (Q3_K_M)",
    description: "Requires ~4 GB memory. Strong general-purpose 8B model.",
    hfUri: "hf:bartowski/Meta-Llama-3.1-8B-Instruct-GGUF:Q3_K_M",
    contextSize: 4096,
    sizeLabel: "~3.7 GB",
  },
  {
    name: "EXAONE 3.5 7.8B Instruct (Q3_K_L)",
    description: "Requires ~4 GB memory. Strong instruction following.",
    hfUri: "hf:lmstudio-community/EXAONE-3.5-7.8B-Instruct-GGUF:Q3_K_L",
    contextSize: 4096,
    sizeLabel: "~3.9 GB",
  },
  {
    name: "WizardLM-2 7B (Q4_K_S)",
    description: "Requires ~4 GB memory. Tuned for complex instructions.",
    hfUri: "hf:bartowski/WizardLM-2-7B-GGUF:Q4_K_S",
    contextSize: 4096,
    sizeLabel: "~3.9 GB",
  },
];

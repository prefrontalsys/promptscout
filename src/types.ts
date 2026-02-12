export interface HistoryEntry {
  id: number;
  directory: string;
  raw_input: string;
  improved_output: string;
  final_output: string;
  model_name: string | null;
  created_at: string;
}

export interface ConfigEntry {
  key: string;
  value: string;
}

export interface InferenceParams {
  temperature: number;
  topP: number;
  topK: number;
  minP: number;
  repeatPenalty: {
    lastTokens: number;
    penalty: number;
    frequencyPenalty: number;
    presencePenalty: number;
    penalizeNewLine: boolean;
  };
}

export interface ProcessOptions {
  rawPrompt: string;
  dryRun?: boolean;
  outputFile?: string;
  jsonOutput?: boolean;
  noClipboard?: boolean;
  projectDir?: string;
}

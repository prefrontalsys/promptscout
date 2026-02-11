export interface Template {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface HistoryEntry {
  id: number;
  directory: string;
  template_name: string | null;
  raw_input: string;
  improved_output: string;
  final_output: string;
  created_at: string;
}

export interface ConfigEntry {
  key: string;
  value: string;
}

export interface ModelInfo {
  name: string;
  hfUri: string;
  contextSize: number;
  sizeLabel: string;
}

export interface ProcessOptions {
  rawPrompt: string;
  templateName?: string;
  skipTemplate?: boolean;
  dryRun?: boolean;
  outputFile?: string;
  jsonOutput?: boolean;
  noClipboard?: boolean;
}

import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { config } from "./schema.js";
import type { InferenceParams } from "../types.js";
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_INFERENCE_PARAMS,
  SYSTEM_PROMPT_KEY,
  MODEL_HF_URI,
  MODEL_HF_URI_KEY,
  MODEL_CONTEXT_SIZE_KEY,
  INFERENCE_PARAMS_KEY,
  LLM_CONTEXT_SIZE,
} from "../constants.js";

export class ConfigRepo {
  constructor(private db: BetterSQLite3Database) {}

  get(key: string): string | undefined {
    const row = this.db
      .select()
      .from(config)
      .where(eq(config.key, key))
      .get();
    return row?.value;
  }

  set(key: string, value: string): void {
    this.db
      .insert(config)
      .values({ key, value })
      .onConflictDoUpdate({ target: config.key, set: { value } })
      .run();
  }

  delete(key: string): boolean {
    const result = this.db
      .delete(config)
      .where(eq(config.key, key))
      .run();
    return result.changes > 0;
  }

  getSystemPrompt(): string {
    return this.get(SYSTEM_PROMPT_KEY) ?? DEFAULT_SYSTEM_PROMPT;
  }

  getModelHfUri(): string {
    return this.get(MODEL_HF_URI_KEY) ?? MODEL_HF_URI;
  }

  getModelContextSize(): number {
    const val = this.get(MODEL_CONTEXT_SIZE_KEY);
    return val ? Number(val) : LLM_CONTEXT_SIZE;
  }

  getInferenceParams(): InferenceParams {
    const val = this.get(INFERENCE_PARAMS_KEY);
    return val ? (JSON.parse(val) as InferenceParams) : DEFAULT_INFERENCE_PARAMS;
  }

  setModel(hfUri: string, contextSize: number, inferenceParams: InferenceParams): void {
    this.set(MODEL_HF_URI_KEY, hfUri);
    this.set(MODEL_CONTEXT_SIZE_KEY, String(contextSize));
    this.set(INFERENCE_PARAMS_KEY, JSON.stringify(inferenceParams));
  }

  deleteModel(): void {
    this.delete(MODEL_HF_URI_KEY);
    this.delete(MODEL_CONTEXT_SIZE_KEY);
    this.delete(INFERENCE_PARAMS_KEY);
  }
}

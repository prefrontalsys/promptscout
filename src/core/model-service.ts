import { existsSync } from "node:fs";
import { resolveModelFile } from "node-llama-cpp";
import type { ConfigRepo } from "../storage/config-repo.js";
import type { InferenceParams, ModelInfo } from "../types.js";
import { CURATED_MODELS } from "../llm/models.js";
import {
  searchModels,
  listModelFiles,
  formatFileSize,
  type HfModelResult,
  type HfFileInfo,
} from "../llm/hf-search.js";
import { LLM_CONTEXT_SIZE, DEFAULT_INFERENCE_PARAMS } from "../constants.js";
import { getModelDir } from "../llm/model-manager.js";

export interface ModelStatus {
  uri: string;
  contextSize: number;
  inferenceParams: InferenceParams;
}

export interface RepoChoice {
  label: string;
  repo: HfModelResult;
}

export interface FileChoice {
  label: string;
  file: HfFileInfo;
}

export class ModelService {
  constructor(private configRepo: ConfigRepo) {}

  getStatus(): ModelStatus {
    return {
      uri: this.configRepo.getModelHfUri(),
      contextSize: this.configRepo.getModelContextSize(),
      inferenceParams: this.configRepo.getInferenceParams(),
    };
  }

  getCuratedModels(): { label: string; description: string; model: ModelInfo; active: boolean }[] {
    const currentUri = this.configRepo.getModelHfUri();
    return CURATED_MODELS.map((m) => {
      const active = m.hfUri === currentUri;
      const prefix = active ? "\u2714 " : "  ";
      const defaultTag = m.isDefault ? " (default)" : "";
      return {
        label: `${prefix}${m.name}  (${m.sizeLabel})${defaultTag}`,
        description: m.description,
        model: m,
        active,
      };
    });
  }

  async selectModel(model: ModelInfo): Promise<void> {
    this.configRepo.setModel(model.hfUri, model.contextSize, model.inferenceParams);
    if (model.hfUri.startsWith("hf:")) {
      console.log("Downloading model (skipped if already cached)...");
      await resolveModelFile(model.hfUri, getModelDir());
    } else if (!existsSync(model.hfUri)) {
      throw new Error(`Model file not found: ${model.hfUri}`);
    }
  }

  async searchRepos(query: string): Promise<RepoChoice[]> {
    const repos = await searchModels(query);
    return repos.map((r) => ({
      label: `${r.id}  (${r.downloads.toLocaleString()} downloads)`,
      repo: r,
    }));
  }

  async getRepoFiles(repoId: string): Promise<FileChoice[]> {
    const files = await listModelFiles(repoId);
    return files.map((f) => ({
      label: `${f.quantTag}  (${formatFileSize(f.size)})`,
      file: f,
    }));
  }

  async selectSearchedModel(repoId: string, quantTag: string): Promise<{ hfUri: string; contextSize: number }> {
    const hfUri = `hf:${repoId}:${quantTag}`;
    const contextSize = LLM_CONTEXT_SIZE;
    this.configRepo.setModel(hfUri, contextSize, DEFAULT_INFERENCE_PARAMS);
    console.log("Downloading model (skipped if already cached)...");
    await resolveModelFile(hfUri, getModelDir());
    return { hfUri, contextSize };
  }

  reset(): ModelStatus {
    this.configRepo.deleteModel();
    return this.getStatus();
  }
}

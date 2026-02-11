import type { ConfigRepo } from "../storage/config-repo.js";
import type { ModelInfo } from "../types.js";
import { CURATED_MODELS } from "../llm/models.js";
import {
  searchModels,
  listModelFiles,
  formatFileSize,
  type HfModelResult,
  type HfFileInfo,
} from "../llm/hf-search.js";
import { LLM_CONTEXT_SIZE } from "../constants.js";

export interface ModelStatus {
  uri: string;
  contextSize: number;
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
    };
  }

  getCuratedModels(): { label: string; description: string; model: ModelInfo }[] {
    return CURATED_MODELS.map((m) => ({
      label: `${m.name}  (${m.sizeLabel})`,
      description: m.description,
      model: m,
    }));
  }

  selectModel(model: ModelInfo): void {
    this.configRepo.setModel(model.hfUri, model.contextSize);
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

  selectSearchedModel(repoId: string, quantTag: string): { hfUri: string; contextSize: number } {
    const hfUri = `hf:${repoId}:${quantTag}`;
    const contextSize = LLM_CONTEXT_SIZE;
    this.configRepo.setModel(hfUri, contextSize);
    return { hfUri, contextSize };
  }

  reset(): ModelStatus {
    this.configRepo.deleteModel();
    return this.getStatus();
  }
}

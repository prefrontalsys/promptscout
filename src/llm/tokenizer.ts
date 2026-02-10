import { join } from "node:path";
import { getLlama, LlamaLogLevel } from "node-llama-cpp";
import type { LlamaModel } from "node-llama-cpp";
import { MODEL_FILE_NAME, GPU_LAYERS } from "../constants.js";
import { isModelDownloaded, getModelDir } from "./model-manager.js";
import { downloadModel } from "./downloader.js";

let vocabModel: LlamaModel | null = null;

async function getVocabModel(): Promise<LlamaModel> {
  if (vocabModel) return vocabModel;

  if (!isModelDownloaded()) {
    await downloadModel();
  }

  const modelPath = join(getModelDir(), MODEL_FILE_NAME);
  const llama = await getLlama({ logLevel: LlamaLogLevel.error });
  vocabModel = await llama.loadModel({
    modelPath,
    gpuLayers: GPU_LAYERS,
    vocabOnly: true,
  });

  return vocabModel;
}

export async function countTokens(text: string): Promise<number> {
  const model = await getVocabModel();
  return model.tokenize(text).length;
}

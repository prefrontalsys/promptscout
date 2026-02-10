import { join } from "node:path";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { MODEL_FILE_NAME, LLM_CONTEXT_SIZE, GPU_LAYERS } from "../constants.js";
import { isModelDownloaded, getModelDir } from "./model-manager.js";
import { downloadModel } from "./downloader.js";

export async function generate(
  systemPrompt: string,
  userPrompt: string,
  onToken?: (token: string) => void
): Promise<string> {
  if (!isModelDownloaded()) {
    await downloadModel();
  }

  const modelPath = join(getModelDir(), MODEL_FILE_NAME);

  const llama = await getLlama();
  const model = await llama.loadModel({
    modelPath,
    gpuLayers: GPU_LAYERS,
  });
  const context = await model.createContext({
    contextSize: LLM_CONTEXT_SIZE,
  });
  const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
  });

  const response = await session.prompt(userPrompt, {
    onTextChunk: onToken,
  });

  await context.dispose();
  await model.dispose();

  return response;
}

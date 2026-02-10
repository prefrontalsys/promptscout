import { readdirSync } from "node:fs";
import { join } from "node:path";
import { isModelDownloaded, getModelDir } from "./model-manager.js";
import { downloadModel } from "./downloader.js";

function findModelPath(): string {
  const dir = getModelDir();
  const files = readdirSync(dir);
  const gguf = files.find((f) => f.endsWith(".gguf"));
  if (!gguf) throw new Error("No GGUF model file found");
  return join(dir, gguf);
}

export async function generate(
  systemPrompt: string,
  userPrompt: string,
  onToken?: (token: string) => void
): Promise<string> {
  if (!isModelDownloaded()) {
    await downloadModel();
  }

  const modelPath = findModelPath();

  const { getLlama, LlamaChatSession } = await import("node-llama-cpp");
  const llama = await getLlama();
  const model = await llama.loadModel({
    modelPath,
    gpuLayers: 0,
  });
  const context = await model.createContext({
    contextSize: 4096,
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

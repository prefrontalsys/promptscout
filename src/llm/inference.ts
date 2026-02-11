import {
  getLlama,
  resolveModelFile,
  LlamaChatSession,
  LlamaLogLevel,
} from "node-llama-cpp";
import { GPU_LAYERS } from "../constants.js";
import { getModelDir } from "./model-manager.js";

export async function generate(
  systemPrompt: string,
  userPrompt: string,
  hfUri: string,
  contextSize: number,
  onToken?: (text: string) => void,
): Promise<string> {
  const modelPath = await resolveModelFile(hfUri, getModelDir());

  const llama = await getLlama({ logLevel: LlamaLogLevel.error });
  const model = await llama.loadModel({
    modelPath,
    gpuLayers: GPU_LAYERS,
  });
  const context = await model.createContext({
    contextSize,
  });
  const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
  });

  const response = await session.prompt(userPrompt, {
    temperature: 0.2,
    minP: 0.1,
    topP: 0.7,
    topK: 10,
    repeatPenalty: {
      lastTokens: 64,
      penalty: 1.05,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    trimWhitespaceSuffix: true,
    onTextChunk: onToken,
  });

  await context.dispose();
  await model.dispose();

  return response;
}

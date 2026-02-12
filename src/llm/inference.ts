import { existsSync } from "node:fs";
import {
  getLlama,
  resolveModelFile,
  LlamaChatSession,
  LlamaLogLevel,
  QwenChatWrapper,
  resolveChatWrapper,
} from "node-llama-cpp";
import type { InferenceParams } from "../types.js";
import { GPU_LAYERS } from "../constants.js";
import { getModelDir } from "./model-manager.js";

export async function generate(
  systemPrompt: string,
  userPrompt: string,
  hfUri: string,
  contextSize: number,
  inferenceParams: InferenceParams,
  onToken?: (text: string) => void,
): Promise<string> {
  const modelPath = hfUri.startsWith("hf:")
    ? await resolveModelFile(hfUri, getModelDir())
    : hfUri;

  if (!existsSync(modelPath)) {
    throw new Error(
      `Model not found at ${modelPath}. Run "promptscout setup" to download it.`,
    );
  }

  const llama = await getLlama({ logLevel: LlamaLogLevel.error });
  const model = await llama.loadModel({
    modelPath,
    gpuLayers: GPU_LAYERS,
  });
  const context = await model.createContext({
    contextSize,
  });
  const resolved = resolveChatWrapper(model);
  const chatWrapper = resolved instanceof QwenChatWrapper
    ? new QwenChatWrapper({ thoughts: "discourage" })
    : undefined;

  const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
    chatWrapper,
  });

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 100_000);

  let response: string;
  try {
    response = await session.prompt(userPrompt, {
      temperature: inferenceParams.temperature,
      topP: inferenceParams.topP,
      topK: inferenceParams.topK,
      minP: inferenceParams.minP,
      repeatPenalty: inferenceParams.repeatPenalty,
      trimWhitespaceSuffix: true,
      onTextChunk: onToken,
      signal: abort.signal,
    });
  } catch (err: unknown) {
    if (abort.signal.aborted) {
      throw new Error("LLM inference timed out after 100 seconds.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
    await context.dispose();
    await model.dispose();
  }

  return response.trim();
}

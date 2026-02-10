import { resolveModelFile } from "node-llama-cpp";
import { MODEL_HF_URI } from "../constants.js";
import { getModelDir } from "./model-manager.js";

export async function downloadModel(): Promise<string> {
  const modelDir = getModelDir();

  console.log("Model not found. Downloading...");
  console.log(`Source: ${MODEL_HF_URI}`);
  console.log(`Destination: ${modelDir}\n`);

  const modelPath = await resolveModelFile(MODEL_HF_URI, modelDir);
  console.log("\nModel download complete.");
  return modelPath;
}

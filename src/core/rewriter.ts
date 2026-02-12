import type { ConfigRepo } from "../storage/config-repo.js";
import type { InferenceParams } from "../types.js";
import { generate } from "../llm/inference.js";
import {
  buildToolCallingPrompt,
  parseToolCalls,
} from "../llm/prompts/tool-calling.js";
import {
  type ToolCall,
  executeToolCall,
  buildProjectTree,
} from "../tools/index.js";

const TOOL_CALLING_PARAMS: InferenceParams = {
  temperature: 0.3,
  topP: 0.8,
  topK: 20,
  minP: 0.0,
  repeatPenalty: {
    lastTokens: 64,
    penalty: 1.1,
    frequencyPenalty: 0.0,
    presencePenalty: 0.5,
    penalizeNewLine: false,
  },
};

const NO_RESULT_PREFIXES = ["No ", "Failed", "Unknown tool"];

function isEmptyResult(result: string): boolean {
  return NO_RESULT_PREFIXES.some((prefix) => result.startsWith(prefix));
}

function formatToolResult(call: ToolCall, result: string): string {
  const param = call.arguments.query;
  return `<${call.name} query="${param}">\n${result}\n</${call.name}>`;
}

export class Rewriter {
  constructor(private configRepo: ConfigRepo) { }

  getModelUri(): string {
    return this.configRepo.getModelHfUri();
  }

  async rewrite(
    rawPrompt: string,
    projectDir?: string,
    onStatus?: (message: string) => void,
  ): Promise<string> {
    const hfUri = this.configRepo.getModelHfUri();
    const contextSize = this.configRepo.getModelContextSize();
    const searchDir = projectDir ?? process.cwd();

    onStatus?.("Evaluating");

    const tree = buildProjectTree(searchDir);
    const systemPrompt = buildToolCallingPrompt(tree);
    const raw = await generate(
      systemPrompt,
      rawPrompt,
      hfUri,
      contextSize,
      TOOL_CALLING_PARAMS,
    );

    const calls = parseToolCalls(raw);
    if (calls.length === 0) return rawPrompt;

    onStatus?.(`Running ${calls.length} tool calls`);
    const settled = await Promise.all(
      calls.map(async (call) => {
        const result = await executeToolCall(call, searchDir);
        if (!result || isEmptyResult(result)) return null;
        return formatToolResult(call, result);
      }),
    );
    const results = settled.filter((r): r is string => r !== null);

    if (results.length === 0) return rawPrompt;

    const outputs = [];
    outputs.push(rawPrompt);
    outputs.push("Context from codebase:");
    outputs.push(results.join("\n\n"));

    return outputs.join("\n\n");
  }
}

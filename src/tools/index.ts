import {
  fileFinder,
  sectionFinder,
  definitionFinder,
  importTracer,
  gitHistory,
} from "./implementations.js";

export { buildProjectTree } from "./search-utils.js";

export interface ToolCall {
  name: string;
  arguments: Record<string, string>;
}

export async function executeToolCall(
  call: ToolCall,
  dir: string,
): Promise<string> {
  switch (call.name) {
    case "file_finder":
      return fileFinder(call.arguments.query, dir);
    case "section_finder":
      return sectionFinder(call.arguments.query, dir);
    case "definition_finder":
      return definitionFinder(call.arguments.query, dir);
    case "import_tracer":
      return importTracer(call.arguments.query, dir);
    case "git_history":
      return gitHistory(call.arguments.query, dir);
    default:
      return `Unknown tool: ${call.name}`;
  }
}

import type { Ignore } from "ignore";
import {
  fileFinder,
  sectionFinder,
  definitionFinder,
  importTracer,
  gitHistory,
  externalLinkSummarizer,
} from "./implementations.js";

export { loadIgnoreFilter } from "./search-utils.js";

export interface ToolCall {
  name: string;
  arguments: Record<string, string>;
}

export async function executeToolCall(
  call: ToolCall,
  dir: string,
  ig: Ignore,
): Promise<string> {
  switch (call.name) {
    case "file_finder":
      return fileFinder(call.arguments.query, dir, ig);
    case "section_finder":
      return sectionFinder(call.arguments.query, dir, ig);
    case "definition_finder":
      return definitionFinder(call.arguments.query, dir, ig);
    case "import_tracer":
      return importTracer(call.arguments.query, dir, ig);
    case "git_history":
      return gitHistory(call.arguments.query, dir);
    case "external_link_summarizer":
      return externalLinkSummarizer(call.arguments.url);
    default:
      return `Unknown tool: ${call.name}`;
  }
}

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "file_finder",
      description:
        "Recursively search the project directory for files whose contents match the given keyword. " +
        "Returns up to 10 relative file paths. Use this as a first step to discover which files are " +
        "relevant to a topic before diving deeper with section_finder or definition_finder.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "A single keyword to search for in file contents. Use concise, specific terms " +
              "(e.g., 'camera', 'auth', 'Router'). Avoid multi-word phrases.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "section_finder",
      description:
        "Search for specific code lines matching a keyword across all source files. " +
        "Returns up to 15 results in 'file:line:code' format showing the exact matching lines. " +
        "Use this when you need to see the actual code, not just file names.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "A single keyword to find in source code. Use specific identifiers " +
              "(e.g., 'handleSubmit', 'CameraView', 'fetchUser'). Case-insensitive.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "definition_finder",
      description:
        "Find function, class, type, interface, struct, enum, and other definition declarations " +
        "matching a keyword. Works across languages (JS/TS, Python, Go, Rust, Swift, Ruby, Java). " +
        "Returns up to 15 results. Use this to find where something is defined, not where it is used.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "A single keyword matching the name of a function, class, type, or other definition " +
              "(e.g., 'Camera', 'UserService', 'parse_config'). Case-insensitive.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "import_tracer",
      description:
        "Find import, require, include, and use statements that reference a module or keyword. " +
        "Shows the dependency graph — which files depend on the given module. " +
        "Returns up to 15 results. Use this to understand how modules are connected.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "A module name or keyword to search for in import statements " +
              "(e.g., 'camera', 'utils', 'express'). Case-sensitive for import paths.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "git_history",
      description:
        "Search git commit history for the 10 most recent commits that added or removed " +
        "code containing the given keyword. Use this when the user references a recent change, " +
        "regression, or wants to understand what changed recently related to a topic.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "A keyword to search in commit diffs (e.g., 'camera', 'auth'). " +
              "Git searches for commits where this string was added or removed.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "external_link_summarizer",
      description:
        "Fetch a URL and return its text content (HTML stripped, up to 2000 characters). " +
        "Use this ONLY when the user's prompt explicitly contains a URL. " +
        "Do NOT fabricate or guess URLs.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description:
              "The exact URL from the user's prompt to fetch. Must be a complete, valid URL " +
              "starting with http:// or https://.",
          },
        },
        required: ["url"],
      },
    },
  },
];

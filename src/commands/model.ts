import type { Command } from "commander";
import type { ConfigRepo } from "../storage/config-repo.js";
import { select, search, confirm } from "@inquirer/prompts";
import { CURATED_MODELS } from "../llm/models.js";
import {
  searchModels,
  listModelFiles,
  formatFileSize,
} from "../llm/hf-search.js";
import { LLM_CONTEXT_SIZE } from "../constants.js";

export function registerModelCommand(
  program: Command,
  configRepo: ConfigRepo,
): void {
  const cmd = program
    .command("model")
    .description("Manage the LLM model");

  // Show current model (default action)
  cmd.action(() => {
    const uri = configRepo.getModelHfUri();
    const ctx = configRepo.getModelContextSize();
    console.log(`Model:        ${uri}`);
    console.log(`Context size: ${ctx}`);
  });

  // Select from curated list
  cmd
    .command("select")
    .description("Select a model from the curated list")
    .action(async () => {
      const choices = CURATED_MODELS.map((m) => ({
        name: `${m.name}  (${m.sizeLabel})`,
        value: m,
      }));

      const chosen = await select({
        message: "Select a model:",
        choices,
      });

      configRepo.setModel(chosen.hfUri, chosen.contextSize);
      console.log(`Model set to: ${chosen.name}`);
      console.log(`URI: ${chosen.hfUri}`);
      console.log(`Context size: ${chosen.contextSize}`);
    });

  // Search HuggingFace
  cmd
    .command("search <query>")
    .description("Search HuggingFace for GGUF models")
    .action(async (query: string) => {
      console.log(`Searching HuggingFace for "${query}"...\n`);

      const repos = await searchModels(query);
      if (repos.length === 0) {
        console.log("No GGUF models found.");
        return;
      }

      const repo = await search({
        message: "Select a repository:",
        source: (input) => {
          const term = (input ?? "").toLowerCase();
          return repos
            .filter((r) => !term || r.id.toLowerCase().includes(term))
            .map((r) => ({
              name: `${r.id}  (${r.downloads.toLocaleString()} downloads)`,
              value: r,
            }));
        },
      });

      console.log(`\nFetching files from ${repo.id}...\n`);
      const files = await listModelFiles(repo.id);

      if (files.length === 0) {
        console.log("No .gguf files found in this repository.");
        return;
      }

      const file = await select({
        message: "Select a GGUF file:",
        choices: files.map((f) => ({
          name: `${f.quantTag}  (${formatFileSize(f.size)})`,
          value: f,
        })),
      });

      const hfUri = `hf:${repo.id}:${file.quantTag}`;

      const contextSize = LLM_CONTEXT_SIZE;

      configRepo.setModel(hfUri, contextSize);
      console.log(`\nModel set to: ${hfUri}`);
      console.log(`Context size: ${contextSize}`);
    });

  // Reset to default
  cmd
    .command("reset")
    .description("Reset to the default model")
    .action(async () => {
      const confirmed = await confirm({
        message: "Reset model to default?",
        default: false,
      });

      if (!confirmed) {
        console.log("Cancelled.");
        return;
      }

      configRepo.deleteModel();
      console.log("Model reset to default.");
      console.log(`URI: ${configRepo.getModelHfUri()}`);
      console.log(`Context size: ${configRepo.getModelContextSize()}`);
    });
}

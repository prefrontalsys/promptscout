import type { Command } from "commander";
import type { ModelService } from "../core/model-service.js";
import { select, search, confirm } from "@inquirer/prompts";

export function registerModelCommand(
  program: Command,
  service: ModelService,
): void {
  const cmd = program
    .command("model")
    .description("Manage the LLM model");

  cmd.action(() => {
    const status = service.getStatus();
    console.log(`Model:        ${status.uri}`);
    console.log(`Context size: ${status.contextSize}`);
  });

  cmd
    .command("select")
    .description("Select a model from the curated list")
    .action(async () => {
      const choices = service.getCuratedModels().map((m) => ({
        name: m.label,
        description: m.description,
        value: m.model,
      }));

      const chosen = await select({ message: "Select a model:", choices });

      service.selectModel(chosen);
      console.log(`Model set to: ${chosen.name}`);
      console.log(`URI: ${chosen.hfUri}`);
      console.log(`Context size: ${chosen.contextSize}`);
    });

  cmd
    .command("search <query>")
    .description("Search HuggingFace for GGUF models")
    .action(async (query: string) => {
      console.log(`Searching HuggingFace for "${query}"...\n`);

      const repoChoices = await service.searchRepos(query);
      if (repoChoices.length === 0) {
        console.log("No GGUF models found.");
        return;
      }

      const chosen = await search({
        message: "Select a repository:",
        source: (input) => {
          const term = (input ?? "").toLowerCase();
          return repoChoices
            .filter((r) => !term || r.repo.id.toLowerCase().includes(term))
            .map((r) => ({ name: r.label, value: r.repo }));
        },
      });

      console.log(`\nFetching files from ${chosen.id}...\n`);
      const fileChoices = await service.getRepoFiles(chosen.id);

      if (fileChoices.length === 0) {
        console.log("No .gguf files found in this repository.");
        return;
      }

      const file = await select({
        message: "Select a GGUF file:",
        choices: fileChoices.map((f) => ({ name: f.label, value: f.file })),
      });

      const result = service.selectSearchedModel(chosen.id, file.quantTag);
      console.log(`\nModel set to: ${result.hfUri}`);
      console.log(`Context size: ${result.contextSize}`);
    });

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

      const status = service.reset();
      console.log("Model reset to default.");
      console.log(`URI: ${status.uri}`);
      console.log(`Context size: ${status.contextSize}`);
    });
}

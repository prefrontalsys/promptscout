# promptscout

A CLI tool that enriches your coding agent prompts with codebase context using a local LLM. No API keys, no cloud. Runs on your machine.

**Designed as a Claude Code plugin.** It hooks into your prompt submission flow and adds codebase context before Claude sees it.

## Motivation

When you ask a coding agent like Claude Code, Cursor, or Copilot to work on your codebase, the agent spends time and tokens discovering which files matter. It greps, reads, explores, all on your dime.

promptscout does that discovery locally, for free. A small local LLM reads your prompt, searches your codebase with `grep` and `git`, and appends the results to your original prompt. The paid agent gets a prompt that already contains the relevant file paths, code snippets, and commit history. It can skip straight to the actual work.

Your original prompt is never modified. promptscout only appends context.

## How It Works

```mermaid
flowchart LR
    A["Raw Prompt"] --> B["Local LLM<br/>(Qwen 3 4B)"]
    B -->|"tool calls"| C["Execute Tools"]
    C --> D["grep / git"]
    D --> E["Original Prompt<br/>+ Discovered Context"]
```

1. You run `promptscout "check the auth module, there might be a token refresh bug"`
2. The local LLM reads your prompt and picks which tools to call (e.g. `file_finder("auth")`, `section_finder("refresh")`, `git_history("token")`)
3. Each tool runs against your codebase using `grep` and `git`
4. The output is your original prompt unchanged, followed by the discovered context
5. The result is copied to your clipboard, ready to paste into your coding agent

## Installation

### Prerequisites

- Node.js >= 20
- C++ compiler (Xcode Command Line Tools on macOS, `build-essential` on Linux)
- ~3GB disk space for the model

### Install

```bash
npm install -g promptscout
```

Or from source:

```bash
git clone https://github.com/obsfx/promptscout.git
cd promptscout
pnpm install
pnpm build
pnpm link --global
```

### Setup

Run `promptscout setup` to create the data directory and download the `Qwen 3 4B` model (~2.5GB). The model is stored in `~/.promptscout/models/`.

## Claude Code Plugin

<img src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/claude-color.png" alt="Claude" width="48" />

promptscout ships with a Claude Code plugin that enriches every prompt you send. Once installed, it runs in the background. No manual copy-pasting needed.

### Install the plugin

```bash
# Add the promptscout marketplace
claude /plugin marketplace add obsfx/promptscout

# Install the plugin
claude /plugin install promptscout
```

Or in Claude Code interactive mode:

```
/plugin marketplace add obsfx/promptscout
/plugin install promptscout
```

Once installed, every prompt you submit in Claude Code gets enriched with codebase context via the `UserPromptSubmit` hook. The plugin passes your prompt through `promptscout` with `--json-output --no-clipboard` and injects the result as additional context.

When context is found, the plugin shows a summary notification:

```
promptscout: enriched context (+5 files) (+3 sections) (+1 definitions)
```

If `promptscout` is not installed or fails for any reason, the plugin falls back silently and your original prompt goes through unchanged.

## Model

promptscout uses `Qwen 3 4B` (`Q4_K_M` quantization) running locally via [node-llama-cpp](https://github.com/withcatai/node-llama-cpp). The model uses GPU acceleration automatically when available (Metal on macOS, CUDA on Linux).

- Size: ~2.5GB (`GGUF Q4_K_M`)
- Context: 4096 tokens
- Latency: ~2s per prompt (Metal, Apple Silicon)
- Purpose: Decides which search tools to call based on your prompt. Does not rewrite your text.

## Tools

promptscout has 5 built-in tools that the LLM can invoke:

| Tool | What it does |
|---|---|
| `file_finder` | Finds files matching a keyword. Results scored by filename relevance. |
| `section_finder` | Finds code lines matching a keyword. Returns `file:line:code` entries. |
| `definition_finder` | Finds function, class, type, and struct definitions across languages. |
| `import_tracer` | Finds import/require/include statements referencing a module. |
| `git_history` | Finds recent commits that added or removed code matching a keyword. |

All `grep`-based tools respect `.gitignore` and skip binary files.

## Usage

```bash
# Basic usage (result copied to clipboard)
promptscout "check the camera module, we need to add timeout handling"

# Dry run (print to stdout, skip clipboard)
promptscout --dry-run --no-clipboard "refactor the search module"

# Specify project directory
promptscout --project-dir /path/to/project "check the auth flow"

# JSON output (for programmatic use)
promptscout --json-output "fix the pagination bug"
```

### Options

```
<prompt>                     Raw prompt to enrich
-o, --output <file>          Write result to file
--dry-run                    Show result without copying or saving
--json-output                Output JSON instead of plain text
--no-clipboard               Skip clipboard copy
--project-dir <dir>          Project root directory
```

## Commands

### `promptscout setup`

Initialize promptscout and download the default model. Creates the data directory at `~/.promptscout/` and downloads `Qwen 3 4B` (~2.5GB).

```bash
promptscout setup
```

### `promptscout history`

View prompt history with paginated table output.

```bash
# Show history for current directory (default: 10 per page)
promptscout history

# Show all history across directories
promptscout history -a

# Paginate results
promptscout history -p 2 -n 5

# Show full detail of a specific entry
promptscout history show 42

# Clear all history
promptscout history clear
```

## Examples

### Swift project (macOS audio capture tool)

```
$ promptscout "I want to add a new audio format export feature. check the current
audio processing pipeline and see how formats are handled"
```

```
I want to add a new audio format export feature. check the current audio processing
pipeline and see how formats are handled

Context from codebase:

<file_finder query="audio">
Sources/Core/AudioCaptureSession.swift
Sources/Core/AudioTapManager.swift
entitlements.plist
README.md
Sources/Core/InputDeviceQuery.swift
Sources/IO/RingBuffer.swift
Sources/IO/WAVWriter.swift
Sources/CLI/ExitCodes.swift
</file_finder>

<git_history query="audio">
d41aece Initial commit: audiograb - macOS system audio capture CLI
  Package.swift
  README.md
  Sources/CLI/ArgumentParser.swift
  Sources/Core/AudioCaptureSession.swift
  Sources/Core/AudioTapManager.swift
  Sources/IO/RingBuffer.swift
  Sources/main.swift
d800ac1 Add microphone recording support via --source mic flag
  Sources/Info.plist
</git_history>
```

### TypeScript project (task management CLI)

```
$ promptscout "I want to add task filtering by status and tags. check how tasks
are stored and queried"
```

```
I want to add task filtering by status and tags. check how tasks are stored and queried

Context from codebase:

<file_finder query="task">
tests/commands/subtask.test.ts
tests/commands/task.test.ts
src/commands/task.ts
src/services/task.ts
tests/integration/workflows.test.ts
tests/commands/comment.test.ts
tests/commands/history.test.ts
</file_finder>

<definition_finder query="Task">
tests/integration/workflows.test.ts:10:interface Task {
src/services/task.ts:72:export function listTasks(options?: {
</definition_finder>

<section_finder query="listTasks">
src/commands/task.ts:5:  listTasks,
src/commands/task.ts:58:      const tasks = listTasks({
src/services/task.ts:72:export function listTasks(options?: {
</section_finder>
```

### React/TypeScript project (terminal ebook downloader)

```
$ promptscout "I need to refactor the search module. check how search and pagination
currently work and find the related components"
```

```
I need to refactor the search module. check how search and pagination currently work
and find the related components

Context from codebase:

<file_finder query="search">
src/tui/layouts/search/search-input/SearchWarning.tsx
src/tui/layouts/search/search-input/SearchInput.tsx
src/tui/layouts/search/index.tsx
src/tui/layouts/search/search-input/index.tsx
README.md
package.json
CLAUDE.md
src/tui/index.tsx
</file_finder>

<section_finder query="search">
src/tui/components/ResultListInfo.tsx:6:  const searchValue = useBoundStore((state) => state.searchValue);
CLAUDE.md:30:- `libgen-downloader -s "query"` - Direct search with TUI
CLAUDE.md:43:  - `Adapter.ts` - Abstract base for different search sources
CLAUDE.md:54:- `app.ts` - UI state, layouts, loading indicators, search state
CLAUDE.md:58:- `cache.ts` - Search result caching mechanism
</section_finder>
```

### Feedback detection

When the prompt is feedback or an observation (not asking to change code), promptscout returns it unchanged with no context appended:

```
$ promptscout "that didn't solve the issue, it is still rotated 90 degrees clockwise"
```

```
that didn't solve the issue, it is still rotated 90 degrees clockwise
```

## License

MIT

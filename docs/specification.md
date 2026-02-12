# better-prompt

CLI tool that improves coding agent prompts using a local LLM. It analyzes raw prompts, restructures them into clear direct instructions, and combines them with user-defined templates.

## Problem

Coding agents (Claude, Copilot, etc.) need specific, repeated instructions to produce consistent output. Even with `CLAUDE.md` / `AGENT.md` files, users re-type the same structural guidance every time. `better-prompt` eliminates this by combining a reusable template with LLM-powered prompt rewriting — fully offline.

## Core Concepts

- **Template**: A reusable prompt skeleton (e.g. "always use TypeScript strict mode, prefer composition over inheritance, write tests"). Users can have multiple named templates.
- **History**: Every generated prompt is stored with metadata (directory, timestamp, template used, original input, final output).

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript
- **LLM**: `node-llama-cpp` with `ministral-3b` (GGUF format)
- **Database**: SQLite via `better-sqlite3` (sync API, no ORM)
- **CLI framework**: `commander`
- **Storage root**: `~/.better-prompt/`

## Directory Structure

```
~/.better-prompt/
├── models/          # Downloaded GGUF model files
├── better-prompt.db # SQLite database (templates, history, config)
```

## Database Schema

```sql
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  directory TEXT NOT NULL,        -- cwd where command was invoked
  template_name TEXT,             -- nullable, template used (if any)
  raw_input TEXT NOT NULL,        -- original user prompt
  improved_output TEXT NOT NULL,  -- LLM-rewritten prompt
  final_output TEXT NOT NULL,     -- template + improved prompt combined
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## CLI Commands

### `better-prompt <prompt>`

Main command. Takes raw prompt string, rewrites it via LLM, merges with active/specified template, copies result to clipboard.

**Flags:**

- `-t, --template <name>` — use a specific template (default: `default`)
- `-o, --output <file>` — write result to file instead of clipboard
- `--no-template` — skip template merging, only rewrite
- `--dry-run` — show result without copying/saving

**Flow:**

1. Ensure model is downloaded (if not, download with progress bar)
2. Send user prompt to local LLM for tool-call evaluation
3. Retrieve template by name
5. Combine: template content + LLM-improved prompt
6. Copy to clipboard, save to history, print result

### `better-prompt templates`

List all templates (name, preview of first 80 chars, created date).

### `better-prompt templates add <name>`

Create a new template. Opens `$EDITOR` (or falls back to inline stdin input) for content.

### `better-prompt templates edit <name>`

Edit existing template in `$EDITOR`.

### `better-prompt templates remove <name>`

Delete a template. Confirm before deletion.

### `better-prompt templates show <name>`

Print full template content.

### `better-prompt history`

List recent history entries for current directory. Shows truncated input/output, timestamp.

**Flags:**

- `-a, --all` — show history across all directories
- `-n, --limit <number>` — number of entries (default: 20)

### `better-prompt history show <id>`

Print full detail of a history entry.

### `better-prompt history clear`

Clear history. Confirm before deletion.

## Model Management

- Model: `ministral-3b` in GGUF Q4_K_M quantization
- Download source: Hugging Face (hardcode URL)
- Download location: `~/.better-prompt/models/`
- On first run of main command, check if model file exists
- If missing, show: file name, total size, download progress bar with percentage/speed/ETA
- Use `node-llama-cpp`'s built-in model download utilities if available, otherwise stream download with progress via `cli-progress` or similar

## Error Handling

- Model not found + no internet → clear error message, exit 1
- Template not found → list available templates, exit 1
- Empty prompt input → show usage hint, exit 1
- LLM inference failure → show error, save nothing to history

## Notes for Implementation

- Initialize DB + tables on first run (run migrations check at startup)
- Clipboard: use `clipboardy` package (cross-platform)
- All commands should work without the model downloaded except the main rewrite command
- Keep LLM context window usage minimal — tool-calling prompt + user input only, no chat history
- Stream LLM output to stdout token-by-token for UX feedback during generation

```mermaid
graph TB
    subgraph CLI["CLI Layer (commander)"]
        ENTRY["better-prompt &lt;prompt&gt;"]
        TPL_CMD["better-prompt templates"]
        HIST_CMD["better-prompt history"]
    end

    subgraph CORE["Core Engine"]
        PARSER["Argument Parser<br/>& Validator"]
        REWRITER["Prompt Rewriter"]
        MERGER["Template Merger"]
        STREAMER["Token Streamer<br/>(stdout)"]
    end

    subgraph LLM["LLM Layer (node-llama-cpp)"]
        MODEL_MGR["Model Manager"]
        DOWNLOADER["Model Downloader<br/>+ Progress Bar"]
        INFERENCE["Inference Engine<br/>(ministral-3b)"]
        MODEL_FILE[("~/.better-prompt/models/<br/>ministral-3b.gguf")]
    end

    subgraph STORAGE["Storage Layer"]
        DB_MGR["DB Manager<br/>(better-sqlite3)"]
        MIGRATOR["Schema Migrator"]
        DB_FILE[("~/.better-prompt/<br/>better-prompt.db")]

        subgraph TABLES["Tables"]
            T_TPL["templates"]
            T_HIST["history"]
            T_CFG["config"]
        end
    end

    subgraph OUTPUT["Output Layer"]
        CLIPBOARD["Clipboard<br/>(clipboardy)"]
        FILE_OUT["File Writer<br/>(--output flag)"]
        STDOUT["stdout<br/>(--dry-run)"]
    end

    %% CLI → Core
    ENTRY --> PARSER
    TPL_CMD --> DB_MGR
    HIST_CMD --> DB_MGR

    %% Core flow
    PARSER --> MODEL_MGR
    MODEL_MGR -->|model exists| INFERENCE
    MODEL_MGR -->|model missing| DOWNLOADER
    DOWNLOADER -->|download complete| MODEL_FILE
    DOWNLOADER -->|progress| STREAMER
    MODEL_FILE --> INFERENCE

    PARSER -->|load template| DB_MGR
    DB_MGR --> DB_FILE
    DB_FILE --- TABLES

    INFERENCE -->|tokens| STREAMER
    INFERENCE -->|full result| REWRITER
    REWRITER -->|improved prompt| MERGER
    DB_MGR -->|template content| MERGER

    %% Output
    MERGER -->|final prompt| CLIPBOARD
    MERGER -->|final prompt| FILE_OUT
    MERGER -->|final prompt| STDOUT
    MERGER -->|save to history| DB_MGR

    %% Startup
    DB_MGR -->|first run| MIGRATOR
    MIGRATOR -->|create tables| DB_FILE

    %% Styling
    classDef cli fill:#1e293b,stroke:#475569,color:#e2e8f0
    classDef core fill:#172554,stroke:#3b82f6,color:#bfdbfe
    classDef llm fill:#3b0764,stroke:#a855f7,color:#e9d5ff
    classDef storage fill:#052e16,stroke:#22c55e,color:#bbf7d0
    classDef output fill:#7c2d12,stroke:#f97316,color:#fed7aa
    classDef datafile fill:#0f172a,stroke:#64748b,color:#94a3b8

    class ENTRY,TPL_CMD,HIST_CMD cli
    class PARSER,REWRITER,MERGER,STREAMER core
    class MODEL_MGR,DOWNLOADER,INFERENCE llm
    class DB_MGR,MIGRATOR db
    class CLIPBOARD,FILE_OUT,STDOUT output
    class MODEL_FILE,DB_FILE datafile

```

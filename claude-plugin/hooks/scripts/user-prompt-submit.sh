#!/bin/bash
set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Extract the user's prompt and project directory
prompt=$(echo "$input" | jq -r '.prompt // empty')
project_dir=$(echo "$input" | jq -r '.cwd // empty')

if [ -z "$prompt" ]; then
  exit 0
fi

# Check if better-prompt CLI is available
if ! command -v better-prompt &>/dev/null; then
  exit 0
fi

# Run better-prompt with JSON output and no clipboard
# Build CLI arguments
cli_args=(--json-output --no-clipboard)
if [ -n "$project_dir" ]; then
  cli_args+=(--project-dir "$project_dir")
fi

result=$(better-prompt "$prompt" "${cli_args[@]}" 2>/dev/null) || {
  # Graceful degradation: if CLI fails, let original prompt through
  exit 0
}

# Extract the final improved prompt
improved=$(echo "$result" | jq -r '.final // empty')

if [ -z "$improved" ]; then
  exit 0
fi

# Inject as additionalContext
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": $(echo "$improved" | jq -Rs .)
  }
}
EOF

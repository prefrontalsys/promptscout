#!/bin/bash
set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Extract the user's prompt
prompt=$(echo "$input" | jq -r '.prompt // empty')

if [ -z "$prompt" ]; then
  exit 0
fi

# Check if better-prompt CLI is available
if ! command -v better-prompt &>/dev/null; then
  exit 0
fi

# Run better-prompt with JSON output and no clipboard
result=$(better-prompt "$prompt" --json-output --no-clipboard 2>/dev/null) || {
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

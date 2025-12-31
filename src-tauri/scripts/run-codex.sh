#!/bin/bash

# Codex CLI execution script for Launchd
# This script is triggered by Launchd at the scheduled time

# Logging setup
LOG_DIR="$HOME/.config/tauri-cli-scheduler/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/codex-$(date +%Y%m%d-%H%M%S).log"
ERROR_FILE="$LOG_DIR/codex-$(date +%Y%m%d-%H%M%S).error.log"

# Log execution start
{
    echo "=== Codex execution started at $(date) ==="
    echo "Target directory: $TARGET_DIRECTORY"
    echo "Command: $CODEX_COMMAND"
    echo "Options: $CODEX_OPTIONS"
} >> "$LOG_FILE"

# Execute AppleScript to launch iTerm and run Codex
osascript <<APPLESCRIPT >> "$LOG_FILE" 2>> "$ERROR_FILE"
tell application "iTerm"
    activate

    -- Create new window
    create window with default profile

    tell current session of current window
        -- Navigate to target directory
        write text "cd \"$TARGET_DIRECTORY\""

        -- Execute Codex command
        write text "codex $CODEX_OPTIONS \"$CODEX_COMMAND\""
    end tell
end tell
APPLESCRIPT

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "=== Codex execution completed successfully at $(date) ===" >> "$LOG_FILE"
else
    echo "=== Codex execution failed with error code $RESULT at $(date) ===" >> "$ERROR_FILE"
fi

exit $RESULT

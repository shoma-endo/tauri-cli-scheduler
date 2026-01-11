#!/bin/bash

# Codex CLI execution script for Launchd
# This script is triggered by Launchd at the scheduled time

# Logging setup
LOG_DIR="$HOME/.config/tauri-cli-scheduler/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/codex-$(date +%Y%m%d-%H%M%S).log"
ERROR_FILE="$LOG_DIR/codex-$(date +%Y%m%d-%H%M%S).error.log"
HISTORY_FILE="$HOME/.config/tauri-cli-scheduler/schedule-history.jsonl"

append_history() {
    local status="$1"
    if [ -z "$SCHEDULE_ID" ]; then
        return
    fi
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    printf '%s\n' "{\"timestamp\":\"$timestamp\",\"schedule_id\":\"$SCHEDULE_ID\",\"tool\":\"$TOOL\",\"status\":\"$status\"}" >> "$HISTORY_FILE"
}

# Log execution start
{
    echo "=== Codex execution started at $(date) ==="
    echo "Target directory: $TARGET_DIRECTORY"
    echo "Command: $CODEX_COMMAND"
    echo "Options: $CODEX_OPTIONS"
} >> "$LOG_FILE"

# Check interval schedule if configured
if [ "$SCHEDULE_TYPE" = "interval" ] && [ -n "$SCHEDULE_INTERVAL_DAYS" ] && [ -n "$SCHEDULE_START_DATE" ]; then
    # Convert dates to seconds since epoch
    # macOS 'date' command uses -j -f for parsing
    START_TS=$(date -j -f "%Y-%m-%d" "$SCHEDULE_START_DATE" "+%s")
    CURRENT_TS=$(date "+%s")
    
    # Calculate days difference
    # 86400 seconds in a day
    DIFF_SECONDS=$((CURRENT_TS - START_TS))
    DIFF_DAYS=$((DIFF_SECONDS / 86400))
    
    # Check if we should run today
    # Using modulo operator
    MOD=$((DIFF_DAYS % SCHEDULE_INTERVAL_DAYS))
    
    if [ $MOD -ne 0 ]; then
        echo "=== Skipping execution: Today is not an interval match (Start: $SCHEDULE_START_DATE, Interval: $SCHEDULE_INTERVAL_DAYS days, Diff: $DIFF_DAYS days) ===" >> "$LOG_FILE"
        append_history "skipped"
        exit 0
    fi
    echo "=== Interval matched: Proceeding with execution (Start: $SCHEDULE_START_DATE, Interval: $SCHEDULE_INTERVAL_DAYS days, Diff: $DIFF_DAYS days) ===" >> "$LOG_FILE"
fi

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
    append_history "success"
else
    echo "=== Codex execution failed with error code $RESULT at $(date) ===" >> "$ERROR_FILE"
    append_history "failure"
fi

exit $RESULT

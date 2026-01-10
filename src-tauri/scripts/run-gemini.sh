#!/bin/bash

# Gemini CLI execution script for Launchd
# This script is triggered by Launchd at the scheduled time

# Logging setup
LOG_DIR="$HOME/.config/tauri-cli-scheduler/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/gemini-$(date +%Y%m%d-%H%M%S).log"
ERROR_FILE="$LOG_DIR/gemini-$(date +%Y%m%d-%H%M%S).error.log"

# Log execution start
{
    echo "=== Gemini execution started at $(date) ==="
    echo "Target directory: $TARGET_DIRECTORY"
    echo "Command: $GEMINI_COMMAND"
    echo "Options: $GEMINI_OPTIONS"
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
        exit 0
    fi
    echo "=== Interval matched: Proceeding with execution (Start: $SCHEDULE_START_DATE, Interval: $SCHEDULE_INTERVAL_DAYS days, Diff: $DIFF_DAYS days) ===" >> "$LOG_FILE"
fi

# Execute AppleScript to launch iTerm and run Gemini
osascript <<APPLESCRIPT >> "$LOG_FILE" 2>> "$ERROR_FILE"
tell application "iTerm"
    activate

    -- Create new window
    create window with default profile

    tell current session of current window
        -- Navigate to target directory
        write text "cd \"$TARGET_DIRECTORY\""

        -- Execute Gemini command
        write text "gemini $GEMINI_OPTIONS --prompt \"$GEMINI_COMMAND\""
    end tell
end tell
APPLESCRIPT

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "=== Gemini execution completed successfully at $(date) ===" >> "$LOG_FILE"
else
    echo "=== Gemini execution failed with error code $RESULT at $(date) ===" >> "$ERROR_FILE"
fi

exit $RESULT

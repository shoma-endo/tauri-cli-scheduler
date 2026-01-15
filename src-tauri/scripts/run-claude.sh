#!/bin/bash

# Claude CLI execution script for Launchd
# This script is triggered by Launchd at the scheduled time

# Logging setup
LOG_DIR="$HOME/.config/tauri-cli-scheduler/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/claude-$(date +%Y%m%d-%H%M%S).log"
ERROR_FILE="$LOG_DIR/claude-$(date +%Y%m%d-%H%M%S).error.log"
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
    echo "=== Claude execution started at $(date) ==="
    echo "Target directory: $TARGET_DIRECTORY"
    echo "Command: $CLAUDE_COMMAND"
    echo "Options: $CLAUDE_OPTIONS"
} >> "$LOG_FILE"
append_history "wake-triggered"

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

# Execute AppleScript to launch iTerm and run Claude
osascript <<APPLESCRIPT >> "$LOG_FILE" 2>> "$ERROR_FILE"
tell application "iTerm"
    activate

    -- Create new window
    create window with default profile

    tell current session of current window
        -- Navigate to target directory
        write text "cd \"$TARGET_DIRECTORY\""

        -- Execute Claude command
        write text "claude $CLAUDE_OPTIONS \"$CLAUDE_COMMAND\""
    end tell
end tell
APPLESCRIPT

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "=== Claude execution completed successfully at $(date) ===" >> "$LOG_FILE"
    append_history "success"
else
    echo "=== Claude execution failed with error code $RESULT at $(date) ===" >> "$ERROR_FILE"
    append_history "failure"
fi

# Auto-delete for 'once' schedule type
if [ "$SCHEDULE_TYPE" = "once" ]; then
    echo "=== Auto-deleting one-time schedule ===" >> "$LOG_FILE"
    CONFIG_DIR="$HOME/.config/tauri-cli-scheduler"
    PLIST_NAME="com.shoma.tauri-cli-scheduler.${TOOL}.${SCHEDULE_ID}.plist"
    LAUNCH_AGENTS_PLIST="$HOME/Library/LaunchAgents/$PLIST_NAME"
    CONFIG_PLIST="$CONFIG_DIR/$PLIST_NAME"

    # Unload from launchd (best effort, ignore errors)
    launchctl bootout "gui/$(id -u)" "$LAUNCH_AGENTS_PLIST" 2>/dev/null || true

    # Remove plist files
    rm -f "$LAUNCH_AGENTS_PLIST" 2>/dev/null || true
    rm -f "$CONFIG_PLIST" 2>/dev/null || true

    echo "=== One-time schedule deleted ===" >> "$LOG_FILE"
fi

exit $RESULT

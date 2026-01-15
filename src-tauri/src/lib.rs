use chrono::{
    DateTime, Datelike, Local, LocalResult, NaiveDate, NaiveTime, TimeZone, Timelike, Utc,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::{
    fs::{File, OpenOptions},
    io::{BufRead, BufReader, Write},
};
use tauri::{Manager, State};

mod plist_manager;
use plist_manager::{LaunchdConfig, RegisteredSchedule};

#[derive(Clone)]
struct ToolState {
    is_running: Arc<Mutex<bool>>,
    cancel_flag: Arc<Mutex<bool>>,
}

#[derive(Clone)]
struct AppState {
    claude: ToolState,
    codex: ToolState,
    gemini: ToolState,
}

fn escape_applescript_string(input: &str) -> String {
    input
        .replace('\\', r"\\")
        .replace('"', r#"\""#)
        .replace('\n', r"\n")
        .replace('\r', r"\r")
}

#[derive(Serialize, Deserialize)]
struct ExecutionResult {
    status: String,
    #[serde(rename = "terminalOutput")]
    terminal_output: Option<String>,
    #[serde(rename = "needsRetry")]
    needs_retry: Option<bool>,
    #[serde(rename = "retryTime")]
    retry_time: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct ITermStatus {
    is_installed: bool,
    is_running: bool,
}

#[derive(Serialize, Deserialize)]
struct ScheduleResult {
    success: bool,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    registered_tool: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    schedule_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct ScheduleHistoryEntry {
    timestamp: String,
    schedule_id: String,
    tool: String,
    status: String,
}

fn parse_schedule_time(execution_time: &str) -> Option<NaiveTime> {
    let parts: Vec<&str> = execution_time.split(':').collect();
    if parts.len() != 2 {
        return None;
    }
    let hour: u32 = parts[0].parse().ok()?;
    let minute: u32 = parts[1].parse().ok()?;
    NaiveTime::from_hms_opt(hour, minute, 0)
}

fn local_datetime_from_date_time(date: NaiveDate, time: NaiveTime) -> Option<DateTime<Local>> {
    let naive = date.and_time(time);
    match Local.from_local_datetime(&naive) {
        LocalResult::Single(dt) => Some(dt),
        LocalResult::Ambiguous(earliest, _) => Some(earliest),
        LocalResult::None => None,
    }
}

fn get_last_scheduled_time(
    schedule: &RegisteredSchedule,
    now: DateTime<Local>,
) -> Option<DateTime<Local>> {
    let time = parse_schedule_time(&schedule.execution_time)?;
    let today = now.date_naive();

    match schedule.schedule_type.as_str() {
        "daily" => {
            let mut candidate = local_datetime_from_date_time(today, time)?;
            if candidate > now {
                let yesterday = today.pred_opt()?;
                candidate = local_datetime_from_date_time(yesterday, time)?;
            }
            Some(candidate)
        }
        "weekly" => {
            let start_date_str = schedule.start_date.as_ref()?;
            let start_date = NaiveDate::parse_from_str(start_date_str, "%Y-%m-%d").ok()?;
            let target_weekday = start_date.weekday();
            let today_weekday = today.weekday();
            let days_back = (7
                + today_weekday.num_days_from_monday() as i64
                - target_weekday.num_days_from_monday() as i64)
                % 7;
            let mut date = today - chrono::Duration::days(days_back);
            let mut candidate = local_datetime_from_date_time(date, time)?;
            if candidate > now {
                date = date - chrono::Duration::days(7);
                candidate = local_datetime_from_date_time(date, time)?;
            }
            Some(candidate)
        }
        "interval" => {
            let start_date_str = schedule.start_date.as_ref()?;
            let interval = schedule.interval_value? as i64;
            let start_date = NaiveDate::parse_from_str(start_date_str, "%Y-%m-%d").ok()?;
            if today < start_date {
                return None;
            }
            let days_since = (today - start_date).num_days();
            let mut last_offset = days_since - (days_since % interval);
            let mut last_date = start_date + chrono::Duration::days(last_offset);
            let mut candidate = local_datetime_from_date_time(last_date, time)?;
            if candidate > now {
                if last_offset < interval {
                    return None;
                }
                last_offset -= interval;
                last_date = start_date + chrono::Duration::days(last_offset);
                candidate = local_datetime_from_date_time(last_date, time)?;
            }
            Some(candidate)
        }
        _ => None,
    }
}

fn load_last_history_map() -> Result<HashMap<String, DateTime<Utc>>, String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not determine config directory".to_string())?
        .join("tauri-cli-scheduler");
    let history_path = config_dir.join("schedule-history.jsonl");

    if !history_path.exists() {
        return Ok(HashMap::new());
    }

    let file =
        File::open(&history_path).map_err(|e| format!("Failed to read history file: {}", e))?;
    let reader = BufReader::new(file);

    let mut latest_map: HashMap<String, DateTime<Utc>> = HashMap::new();
    for line in reader.lines() {
        let line = match line {
            Ok(val) => val,
            Err(_) => continue,
        };
        let entry: ScheduleHistoryEntry = match serde_json::from_str(&line) {
            Ok(val) => val,
            Err(_) => continue,
        };
        let timestamp = match DateTime::parse_from_rfc3339(&entry.timestamp) {
            Ok(val) => val.with_timezone(&Utc),
            Err(_) => continue,
        };
        let update = match latest_map.get(&entry.schedule_id) {
            Some(existing) => timestamp > *existing,
            None => true,
        };
        if update {
            latest_map.insert(entry.schedule_id.clone(), timestamp);
        }
    }

    Ok(latest_map)
}

fn append_schedule_history(schedule_id: &str, tool: &str, status: &str) -> Result<(), String> {
    let config_dir = plist_manager::ensure_config_dir()?;
    let history_path = config_dir.join("schedule-history.jsonl");
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&history_path)
        .map_err(|e| format!("Failed to open history file: {}", e))?;

    let timestamp = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let entry = serde_json::json!({
        "timestamp": timestamp,
        "schedule_id": schedule_id,
        "tool": tool,
        "status": status,
    });

    writeln!(file, "{}", entry.to_string())
        .map_err(|e| format!("Failed to write history file: {}", e))?;
    Ok(())
}

fn build_catchup_applescript(
    tool: &str,
    target_directory: &str,
    options: &str,
    command: &str,
) -> Result<String, String> {
    let escaped_target_directory = escape_applescript_string(target_directory);
    let escaped_options = escape_applescript_string(options);
    let escaped_command = escape_applescript_string(command);

    let script = match tool {
        "claude" => format!(
            r#"
property targetDirectory : "{}"
property toolOptions : "{}"
property toolCommand : "{}"

tell application "iTerm"
    activate
    create window with default profile

    tell current session of current window
        write text "cd " & quoted form of targetDirectory
        write text "claude " & toolOptions & " " & quoted form of toolCommand
    end tell
end tell
            "#,
            escaped_target_directory, escaped_options, escaped_command
        ),
        "codex" => format!(
            r#"
property targetDirectory : "{}"
property toolOptions : "{}"
property toolCommand : "{}"

tell application "iTerm"
    activate
    create window with default profile

    tell current session of current window
        write text "cd " & quoted form of targetDirectory
        write text "codex " & toolOptions & " " & quoted form of toolCommand
    end tell
end tell
            "#,
            escaped_target_directory, escaped_options, escaped_command
        ),
        "gemini" => format!(
            r#"
property targetDirectory : "{}"
property toolOptions : "{}"
property toolCommand : "{}"

tell application "iTerm"
    activate
    create window with default profile

    tell current session of current window
        write text "cd " & quoted form of targetDirectory
        write text "gemini " & toolOptions & " --prompt " & quoted form of toolCommand
    end tell
end tell
            "#,
            escaped_target_directory, escaped_options, escaped_command
        ),
        _ => return Err("無効なツール指定です".to_string()),
    };

    Ok(script)
}

async fn execute_schedule_catchup(
    schedule: &RegisteredSchedule,
    state: &AppState,
) -> Result<(), String> {
    let tool_state = match schedule.tool.as_str() {
        "claude" => &state.claude,
        "codex" => &state.codex,
        "gemini" => &state.gemini,
        _ => return Err("無効なツール指定です".to_string()),
    };

    {
        let mut is_running = tool_state.is_running.lock().unwrap();
        if *is_running {
            append_schedule_history(&schedule.schedule_id, &schedule.tool, "catchup-skipped-running")?;
            return Ok(());
        }
        *is_running = true;

        let mut cancel_flag = tool_state.cancel_flag.lock().unwrap();
        *cancel_flag = false;
    }

    if !std::path::Path::new(&schedule.target_directory).exists() {
        let mut is_running = tool_state.is_running.lock().unwrap();
        *is_running = false;
        append_schedule_history(&schedule.schedule_id, &schedule.tool, "catchup-failure")?;
        return Err(format!(
            "ディレクトリが存在しません: {}",
            schedule.target_directory
        ));
    }

    let options = plist_manager::default_tool_options(&schedule.tool).unwrap_or_default();
    let applescript = build_catchup_applescript(
        &schedule.tool,
        &schedule.target_directory,
        &options,
        &schedule.command_args,
    )?;

    append_schedule_history(&schedule.schedule_id, &schedule.tool, "catchup-started")?;
    let output = Command::new("osascript").arg("-e").arg(&applescript).output();

    let mut is_running = tool_state.is_running.lock().unwrap();
    *is_running = false;

    match output {
        Ok(output) => {
            if output.status.success() {
                append_schedule_history(&schedule.schedule_id, &schedule.tool, "catchup-success")?;
                Ok(())
            } else {
                append_schedule_history(&schedule.schedule_id, &schedule.tool, "catchup-failure")?;
                Err(format!(
                    "AppleScriptエラー: {}",
                    String::from_utf8_lossy(&output.stderr)
                ))
            }
        }
        Err(e) => {
            append_schedule_history(&schedule.schedule_id, &schedule.tool, "catchup-failure")?;
            Err(format!("実行エラー: {}", e))
        }
    }
}

async fn run_missed_schedules(state: AppState) -> Result<(), String> {
    let now = Local::now();
    let schedules = plist_manager::get_registered_schedules()?;
    if schedules.is_empty() {
        return Ok(());
    }

    let last_history_map = load_last_history_map()?;

    for schedule in schedules {
        let last_scheduled_time = match get_last_scheduled_time(&schedule, now) {
            Some(val) => val,
            None => continue,
        };
        let last_scheduled_utc = last_scheduled_time.with_timezone(&Utc);
        let last_run = last_history_map.get(&schedule.schedule_id);
        let missed = match last_run {
            Some(val) => *val < last_scheduled_utc,
            None => true,
        };
        if missed {
            let _ = append_schedule_history(&schedule.schedule_id, &schedule.tool, "wake-missed");
            let _ = execute_schedule_catchup(&schedule, &state).await;
        }
    }

    Ok(())
}

#[tauri::command]
async fn check_iterm_status() -> Result<ITermStatus, String> {
    // First check if iTerm is installed
    let check_installed = Command::new("osascript")
        .arg("-e")
        .arg(r#"tell application "Finder" to return exists application file id "com.googlecode.iterm2""#)
        .output()
        .map_err(|e| format!("iTerm確認エラー: {}", e))?;

    let is_installed = if check_installed.status.success() {
        let result = String::from_utf8_lossy(&check_installed.stdout)
            .trim()
            .to_string();
        result == "true"
    } else {
        false
    };

    // Only check if running when installed
    let is_running = if is_installed {
        let check_running = Command::new("osascript")
            .arg("-e")
            .arg(r#"tell application "System Events" to (name of processes) contains "iTerm2""#)
            .output()
            .map_err(|e| format!("iTerm状態確認エラー: {}", e))?;

        if check_running.status.success() {
            let result = String::from_utf8_lossy(&check_running.stdout)
                .trim()
                .to_string();
            result == "true"
        } else {
            false
        }
    } else {
        false
    };

    Ok(ITermStatus {
        is_installed,
        is_running,
    })
}

#[tauri::command]
async fn execute_claude_command(
    execution_time: String, // HH:MM format
    target_directory: String,
    _claude_model: String,
    _claude_skip_permissions: bool,
    _claude_launch_options: String,
    claude_command: String,
    _auto_retry_on_rate_limit: bool, // Not used in launchd mode
    _use_new_window: bool, // Always true for launchd mode
    _state: State<'_, AppState>,
    _app: tauri::AppHandle,
) -> Result<ExecutionResult, String> {
    // Check if target directory exists
    if !std::path::Path::new(&target_directory).exists() {
        return Err(format!("ディレクトリが存在しません: {}", target_directory));
    }

    // Parse execution time
    let parts: Vec<&str> = execution_time.split(':').collect();
    if parts.len() != 2 {
        return Err("時刻の形式が正しくありません".to_string());
    }

    let hour: u32 = parts[0].parse().map_err(|_| "時間の解析エラー".to_string())?;
    let minute: u32 = parts[1].parse().map_err(|_| "分の解析エラー".to_string())?;

    // Calculate target date (today or tomorrow if time has passed)
    let now = chrono::Local::now();
    let mut target = now
        .with_hour(hour)
        .and_then(|t| t.with_minute(minute))
        .and_then(|t| t.with_second(0))
        .ok_or("時刻の設定エラー".to_string())?;

    if target <= now {
        target = target + chrono::Duration::days(1);
    }

    let target_date = target.format("%Y-%m-%d").to_string();

    // Generate schedule ID
    let schedule_id = format!(
        "{}{:03}",
        now.format("%Y%m%d%H%M%S"),
        now.timestamp_subsec_millis()
    );

    // Build command with options (options are set via plist_manager::default_tool_options)
    // Additional options from UI are not used in launchd mode for simplicity

    // Create launchd config for one-time execution
    let config = plist_manager::LaunchdConfig {
        tool: "claude".to_string(),
        schedule_id: schedule_id.clone(),
        title: "1回のみの予約実行".to_string(),
        hour,
        minute,
        target_directory: target_directory.clone(),
        command_args: claude_command.clone(),
        schedule_type: "once".to_string(),
        interval_value: None,
        start_date: Some(target_date.clone()),
    };

    // Create plist and register with launchd
    plist_manager::create_plist(&config)?;

    Ok(ExecutionResult {
        status: "scheduled".to_string(),
        terminal_output: Some(format!(
            "スケジュール登録完了: {} {}:{:02} に実行予定",
            target_date, hour, minute
        )),
        needs_retry: Some(false),
        retry_time: None,
    })
}

#[tauri::command]
async fn execute_codex_command(
    execution_time: String, // HH:MM format
    target_directory: String,
    _codex_model: String,
    _codex_approval_mode: String,
    _codex_enable_search: bool,
    _codex_launch_options: String,
    codex_command: String,
    _auto_retry_on_rate_limit: bool, // Not used in launchd mode
    _use_new_window: bool, // Always true for launchd mode
    _state: State<'_, AppState>,
    _app: tauri::AppHandle,
) -> Result<ExecutionResult, String> {
    // Check if target directory exists
    if !std::path::Path::new(&target_directory).exists() {
        return Err(format!("ディレクトリが存在しません: {}", target_directory));
    }

    // Parse execution time
    let parts: Vec<&str> = execution_time.split(':').collect();
    if parts.len() != 2 {
        return Err("時刻の形式が正しくありません".to_string());
    }

    let hour: u32 = parts[0].parse().map_err(|_| "時間の解析エラー".to_string())?;
    let minute: u32 = parts[1].parse().map_err(|_| "分の解析エラー".to_string())?;

    // Calculate target date (today or tomorrow if time has passed)
    let now = chrono::Local::now();
    let mut target = now
        .with_hour(hour)
        .and_then(|t| t.with_minute(minute))
        .and_then(|t| t.with_second(0))
        .ok_or("時刻の設定エラー".to_string())?;

    if target <= now {
        target = target + chrono::Duration::days(1);
    }

    let target_date = target.format("%Y-%m-%d").to_string();

    // Generate schedule ID
    let schedule_id = format!(
        "{}{:03}",
        now.format("%Y%m%d%H%M%S"),
        now.timestamp_subsec_millis()
    );

    // Create launchd config for one-time execution
    let config = plist_manager::LaunchdConfig {
        tool: "codex".to_string(),
        schedule_id: schedule_id.clone(),
        title: "1回のみの予約実行".to_string(),
        hour,
        minute,
        target_directory: target_directory.clone(),
        command_args: codex_command.clone(),
        schedule_type: "once".to_string(),
        interval_value: None,
        start_date: Some(target_date.clone()),
    };

    // Create plist and register with launchd
    plist_manager::create_plist(&config)?;

    Ok(ExecutionResult {
        status: "scheduled".to_string(),
        terminal_output: Some(format!(
            "スケジュール登録完了: {} {}:{:02} に実行予定",
            target_date, hour, minute
        )),
        needs_retry: Some(false),
        retry_time: None,
    })
}

#[tauri::command]
async fn execute_gemini_command(
    execution_time: String, // HH:MM format
    target_directory: String,
    _gemini_model: String,
    _gemini_approval_mode: String,
    _gemini_output_format: String,
    _gemini_include_directories: String,
    _gemini_launch_options: String,
    gemini_command: String,
    _auto_retry_on_rate_limit: bool, // Not used in launchd mode
    _use_new_window: bool, // Always true for launchd mode
    _state: State<'_, AppState>,
    _app: tauri::AppHandle,
) -> Result<ExecutionResult, String> {
    // Check if target directory exists
    if !std::path::Path::new(&target_directory).exists() {
        return Err(format!("ディレクトリが存在しません: {}", target_directory));
    }

    // Parse execution time
    let parts: Vec<&str> = execution_time.split(':').collect();
    if parts.len() != 2 {
        return Err("時刻の形式が正しくありません".to_string());
    }

    let hour: u32 = parts[0].parse().map_err(|_| "時間の解析エラー".to_string())?;
    let minute: u32 = parts[1].parse().map_err(|_| "分の解析エラー".to_string())?;

    // Calculate target date (today or tomorrow if time has passed)
    let now = chrono::Local::now();
    let mut target = now
        .with_hour(hour)
        .and_then(|t| t.with_minute(minute))
        .and_then(|t| t.with_second(0))
        .ok_or("時刻の設定エラー".to_string())?;

    if target <= now {
        target = target + chrono::Duration::days(1);
    }

    let target_date = target.format("%Y-%m-%d").to_string();

    // Generate schedule ID
    let schedule_id = format!(
        "{}{:03}",
        now.format("%Y%m%d%H%M%S"),
        now.timestamp_subsec_millis()
    );

    // Create launchd config for one-time execution
    let config = plist_manager::LaunchdConfig {
        tool: "gemini".to_string(),
        schedule_id: schedule_id.clone(),
        title: "1回のみの予約実行".to_string(),
        hour,
        minute,
        target_directory: target_directory.clone(),
        command_args: gemini_command.clone(),
        schedule_type: "once".to_string(),
        interval_value: None,
        start_date: Some(target_date.clone()),
    };

    // Create plist and register with launchd
    plist_manager::create_plist(&config)?;

    Ok(ExecutionResult {
        status: "scheduled".to_string(),
        terminal_output: Some(format!(
            "スケジュール登録完了: {} {}:{:02} に実行予定",
            target_date, hour, minute
        )),
        needs_retry: Some(false),
        retry_time: None,
    })
}

#[tauri::command]
fn stop_execution(tool: String, state: State<'_, AppState>) -> Result<String, String> {
    let tool_state = match tool.as_str() {
        "claude" => &state.claude,
        "codex" => &state.codex,
        "gemini" => &state.gemini,
        _ => return Err("無効なツール指定です".to_string()),
    };

    let mut is_running = tool_state.is_running.lock().unwrap();
    let mut cancel_flag = tool_state.cancel_flag.lock().unwrap();
    *is_running = false;
    *cancel_flag = true;
    Ok(format!("{}の実行を停止しました", tool))
}

#[tauri::command]
fn get_running_status(state: State<'_, AppState>) -> Result<std::collections::HashMap<String, bool>, String> {
    let mut status = std::collections::HashMap::new();
    status.insert("claude".to_string(), *state.claude.is_running.lock().unwrap());
    status.insert("codex".to_string(), *state.codex.is_running.lock().unwrap());
    status.insert("gemini".to_string(), *state.gemini.is_running.lock().unwrap());
    Ok(status)
}

#[tauri::command]
fn register_schedule(
    tool: String,
    execution_time: String,
    target_directory: String,
    command_args: String,
    title: String,
    schedule_type: Option<String>,
    interval_value: Option<u32>,
    start_date: Option<String>,
) -> Result<ScheduleResult, String> {
    // Parse execution time (HH:MM format)
    let parts: Vec<&str> = execution_time.split(':').collect();
    if parts.len() != 2 {
        return Ok(ScheduleResult {
            success: false,
            message: "時刻の形式が正しくありません（HH:MM形式で指定してください）".to_string(),
            registered_tool: None,
            schedule_id: None,
        });
    }

    let hour: u32 = match parts[0].parse() {
        Ok(h) if h <= 23 => h,
        _ => {
            return Ok(ScheduleResult {
                success: false,
                message: "時間は0-23の範囲で指定してください".to_string(),
                registered_tool: None,
                schedule_id: None,
            });
        }
    };

    let minute: u32 = match parts[1].parse() {
        Ok(m) if m <= 59 => m,
        _ => {
            return Ok(ScheduleResult {
                success: false,
                message: "分は0-59の範囲で指定してください".to_string(),
                registered_tool: None,
                schedule_id: None,
            });
        }
    };

    // Validate tool
    if !["claude", "codex", "gemini"].contains(&tool.as_str()) {
        return Ok(ScheduleResult {
            success: false,
            message: "無効なツール指定です".to_string(),
            registered_tool: None,
            schedule_id: None,
        });
    }

    if command_args.trim().is_empty() {
        return Ok(ScheduleResult {
            success: false,
            message: "スケジュール命令を入力してください".to_string(),
            registered_tool: None,
            schedule_id: None,
        });
    }

    let sched_type = schedule_type.unwrap_or_else(|| "daily".to_string());

    // Basic validation for interval/weekly
    if sched_type == "weekly" && start_date.is_none() {
         return Ok(ScheduleResult {
            success: false,
            message: "毎週実行の場合は開始日を指定してください（曜日決定のため）".to_string(),
            registered_tool: None,
            schedule_id: None,
        });
    }

    if sched_type == "interval" {
        if interval_value.is_none() || start_date.is_none() {
            return Ok(ScheduleResult {
                success: false,
                message: "間隔実行の場合は間隔（日）と開始日を指定してください".to_string(),
                registered_tool: None,
                schedule_id: None,
            });
        }
    }

    let now = chrono::Local::now();
    let schedule_id = format!(
        "{}{:03}",
        now.format("%Y%m%d%H%M%S"),
        now.timestamp_subsec_millis()
    );

    // Create LaunchdConfig and generate plist
    let config = LaunchdConfig {
        tool: tool.clone(),
        schedule_id: schedule_id.clone(),
        title,
        hour,
        minute,
        target_directory,
        command_args,
        schedule_type: sched_type.clone(),
        interval_value,
        start_date,
    };

    match plist_manager::create_plist(&config) {
        Ok(_msg) => {
            let msg = match sched_type.as_str() {
                "daily" => format!("スケジュール登録成功: 毎日 {}:{:02}", hour, minute),
                "weekly" => format!("スケジュール登録成功: 毎週 {}:{:02}", hour, minute),
                "interval" => format!("スケジュール登録成功: {}日ごと {}:{:02}", interval_value.unwrap_or(0), hour, minute),
                _ => format!("スケジュール登録成功: {}:{:02}", hour, minute),
            };
            Ok(ScheduleResult {
                success: true,
                message: msg,
                registered_tool: Some(tool),
                schedule_id: Some(schedule_id),
            })
        },
        Err(e) => Ok(ScheduleResult {
            success: false,
            message: format!("スケジュール登録エラー: {}", e),
            registered_tool: None,
            schedule_id: None,
        }),
    }
}

#[tauri::command]
fn unregister_schedule(tool: String, schedule_id: String) -> Result<ScheduleResult, String> {
    // Validate tool
    if !["claude", "codex", "gemini"].contains(&tool.as_str()) {
        return Ok(ScheduleResult {
            success: false,
            message: "無効なツール指定です".to_string(),
            registered_tool: None,
            schedule_id: None,
        });
    }

    match plist_manager::delete_plist(&tool, &schedule_id) {
        Ok(_msg) => Ok(ScheduleResult {
            success: true,
            message: "スケジュール削除成功".to_string(),
            registered_tool: Some(tool),
            schedule_id: Some(schedule_id),
        }),
        Err(e) => Ok(ScheduleResult {
            success: false,
            message: format!("スケジュール削除エラー: {}", e),
            registered_tool: None,
            schedule_id: None,
        }),
    }
}

#[tauri::command]
fn update_schedule(
    tool: String,
    schedule_id: String,
    execution_time: String,
    target_directory: String,
    command_args: String,
    title: String,
    schedule_type: Option<String>,
    interval_value: Option<u32>,
    start_date: Option<String>,
) -> Result<ScheduleResult, String> {
    let parts: Vec<&str> = execution_time.split(':').collect();
    if parts.len() != 2 {
        return Ok(ScheduleResult {
            success: false,
            message: "時刻の形式が正しくありません（HH:MM形式で指定してください）".to_string(),
            registered_tool: None,
            schedule_id: None,
        });
    }

    let hour: u32 = match parts[0].parse() {
        Ok(h) if h <= 23 => h,
        _ => {
            return Ok(ScheduleResult {
                success: false,
                message: "時間は0-23の範囲で指定してください".to_string(),
                registered_tool: None,
                schedule_id: None,
            });
        }
    };

    let minute: u32 = match parts[1].parse() {
        Ok(m) if m <= 59 => m,
        _ => {
            return Ok(ScheduleResult {
                success: false,
                message: "分は0-59の範囲で指定してください".to_string(),
                registered_tool: None,
                schedule_id: None,
            });
        }
    };

    if !["claude", "codex", "gemini"].contains(&tool.as_str()) {
        return Ok(ScheduleResult {
            success: false,
            message: "無効なツール指定です".to_string(),
            registered_tool: None,
            schedule_id: None,
        });
    }

    if command_args.trim().is_empty() {
        return Ok(ScheduleResult {
            success: false,
            message: "スケジュール命令を入力してください".to_string(),
            registered_tool: None,
            schedule_id: None,
        });
    }

    let sched_type = schedule_type.unwrap_or_else(|| "daily".to_string());
    if sched_type == "weekly" && start_date.is_none() {
        return Ok(ScheduleResult {
            success: false,
            message: "毎週実行の場合は開始日を指定してください（曜日決定のため）".to_string(),
            registered_tool: None,
            schedule_id: None,
        });
    }

    if sched_type == "interval" {
        if interval_value.is_none() || start_date.is_none() {
            return Ok(ScheduleResult {
                success: false,
                message: "間隔実行の場合は間隔（日）と開始日を指定してください".to_string(),
                registered_tool: None,
                schedule_id: None,
            });
        }
    }

    let config = LaunchdConfig {
        tool: tool.clone(),
        schedule_id: schedule_id.clone(),
        title,
        hour,
        minute,
        target_directory,
        command_args,
        schedule_type: sched_type.clone(),
        interval_value,
        start_date,
    };

    match plist_manager::create_plist(&config) {
        Ok(_msg) => Ok(ScheduleResult {
            success: true,
            message: "スケジュール更新成功".to_string(),
            registered_tool: Some(tool),
            schedule_id: Some(schedule_id),
        }),
        Err(e) => Ok(ScheduleResult {
            success: false,
            message: format!("スケジュール更新エラー: {}", e),
            registered_tool: None,
            schedule_id: None,
        }),
    }
}

#[tauri::command]
fn get_registered_schedules() -> Result<Vec<RegisteredSchedule>, String> {
    plist_manager::get_registered_schedules()
}

#[tauri::command]
fn get_schedule_history(schedule_id: String) -> Result<Vec<ScheduleHistoryEntry>, String> {
    if schedule_id.trim().is_empty() {
        return Ok(Vec::new());
    }

    let config_dir = dirs::config_dir()
        .ok_or("Could not determine config directory".to_string())?
        .join("tauri-cli-scheduler");
    let history_path = config_dir.join("schedule-history.jsonl");

    if !history_path.exists() {
        return Ok(Vec::new());
    }

    let file =
        File::open(&history_path).map_err(|e| format!("Failed to read history file: {}", e))?;
    let reader = BufReader::new(file);

    let mut entries: Vec<ScheduleHistoryEntry> = Vec::new();
    for line in reader.lines() {
        let line = match line {
            Ok(val) => val,
            Err(_) => continue,
        };
        let entry: ScheduleHistoryEntry = match serde_json::from_str(&line) {
            Ok(val) => val,
            Err(_) => continue,
        };
        if entry.schedule_id == schedule_id {
            entries.push(entry);
        }
    }

    const MAX_ENTRIES: usize = 10;
    if entries.len() > MAX_ENTRIES {
        entries = entries.split_off(entries.len() - MAX_ENTRIES);
    }
    entries.reverse();

    Ok(entries)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            claude: ToolState {
                is_running: Arc::new(Mutex::new(false)),
                cancel_flag: Arc::new(Mutex::new(false)),
            },
            codex: ToolState {
                is_running: Arc::new(Mutex::new(false)),
                cancel_flag: Arc::new(Mutex::new(false)),
            },
            gemini: ToolState {
                is_running: Arc::new(Mutex::new(false)),
                cancel_flag: Arc::new(Mutex::new(false)),
            },
        })
        .setup(|app| {
            let state = app.state::<AppState>().inner().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(err) = run_missed_schedules(state).await {
                    eprintln!("Failed to run missed schedules: {}", err);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            execute_claude_command,
            execute_codex_command,
            execute_gemini_command,
            stop_execution,
            get_running_status,
            check_iterm_status,
            register_schedule,
            unregister_schedule,
            update_schedule,
            get_registered_schedules,
            get_schedule_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

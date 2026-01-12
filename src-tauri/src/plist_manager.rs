use chrono::Datelike;
use plist::{Dictionary, Value};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Cursor;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaunchdConfig {
    pub tool: String,                // "claude", "codex", "gemini"
    pub schedule_id: String,
    pub title: String,
    pub hour: u32,
    pub minute: u32,
    pub target_directory: String,
    pub command_args: String,
    pub schedule_type: String,       // "daily", "weekly", "interval"
    pub interval_value: Option<u32>,
    pub start_date: Option<String>,  // YYYY-MM-DD
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisteredSchedule {
    pub tool: String,
    pub schedule_id: String,
    pub title: String,
    pub execution_time: String,
    pub target_directory: String,
    pub command_args: String,
    pub created_at: String,
    pub schedule_type: String,
    pub interval_value: Option<u32>,
    pub start_date: Option<String>,
}

/// Get the config directory for the scheduler
fn get_config_dir() -> Result<PathBuf, String> {
    dirs::config_dir()
        .ok_or("Could not determine config directory".to_string())
        .map(|p| p.join("tauri-cli-scheduler"))
}

/// Ensure the config directory exists
pub fn ensure_config_dir() -> Result<PathBuf, String> {
    let config_dir = get_config_dir()?;
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    // Also create logs subdirectory
    let logs_dir = config_dir.join("logs");
    fs::create_dir_all(&logs_dir)
        .map_err(|e| format!("Failed to create logs directory: {}", e))?;

    Ok(config_dir)
}

/// Get the legacy plist file path for a specific tool (single-schedule mode)
fn get_legacy_plist_path(tool: &str) -> Result<PathBuf, String> {
    let config_dir = get_config_dir()?;
    Ok(config_dir.join(format!("com.shoma.tauri-cli-scheduler.{}.plist", tool)))
}

/// Get the plist file path for a specific schedule
fn get_plist_path(tool: &str, schedule_id: &str) -> Result<PathBuf, String> {
    let config_dir = get_config_dir()?;
    Ok(config_dir.join(format!(
        "com.shoma.tauri-cli-scheduler.{}.{}.plist",
        tool, schedule_id
    )))
}

fn parse_plist_filename(file_name: &str) -> Option<(String, String)> {
    let prefix = "com.shoma.tauri-cli-scheduler.";
    let suffix = ".plist";
    if !file_name.starts_with(prefix) || !file_name.ends_with(suffix) {
        return None;
    }
    let trimmed = &file_name[prefix.len()..file_name.len() - suffix.len()];
    let mut parts = trimmed.split('.').collect::<Vec<_>>();
    if parts.is_empty() {
        return None;
    }
    let tool = parts.remove(0).to_string();
    let schedule_id = if parts.is_empty() {
        "legacy".to_string()
    } else {
        parts.join(".")
    };
    Some((tool, schedule_id))
}

/// Create a plist for scheduling a command
pub fn create_plist(config: &LaunchdConfig) -> Result<String, String> {
    ensure_config_dir()?;
    let plist_path = get_plist_path(&config.tool, &config.schedule_id)?;

    // Get the path to the run script
    let script_name = match config.tool.as_str() {
        "claude" => "run-claude.sh",
        "codex" => "run-codex.sh",
        "gemini" => "run-gemini.sh",
        _ => return Err(format!("Unknown tool: {}", config.tool)),
    };

    // Find the script in the app bundle or development directory
    let script_path = if let Ok(exe_path) = std::env::current_exe() {
        let app_root = exe_path.parent()
            .and_then(|p| p.parent())
            .and_then(|p| p.parent())
            .map(|p| p.to_path_buf());

        if let Some(root) = app_root {
            root.join("scripts").join(script_name)
        } else {
            PathBuf::from(format!("./scripts/{}", script_name))
        }
    } else {
        PathBuf::from(format!("./scripts/{}", script_name))
    };

    // Build the plist dictionary
    let mut plist_dict = Dictionary::new();

    // Label
    plist_dict.insert(
        "Label".to_string(),
        Value::String(format!(
            "com.shoma.tauri-cli-scheduler.{}.{}",
            config.tool, config.schedule_id
        )),
    );

    // StartCalendarInterval
    let mut cal_interval = Dictionary::new();
    cal_interval.insert("Hour".to_string(), Value::Integer((config.hour as i64).into()));
    cal_interval.insert("Minute".to_string(), Value::Integer((config.minute as i64).into()));

    if config.schedule_type == "weekly" {
        if let Some(date_str) = &config.start_date {
            if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
                let weekday = date.weekday().num_days_from_sunday(); // 0 = Sun, 1 = Mon, ...
                cal_interval.insert("Weekday".to_string(), Value::Integer((weekday as i64).into()));
            }
        }
    }
    // For 'interval', we set it to run daily, but filter execution in the script.
    
    plist_dict.insert("StartCalendarInterval".to_string(), Value::Dictionary(cal_interval));

    // ProgramArguments
    let args = vec![
        Value::String("/bin/bash".to_string()),
        Value::String(script_path.to_string_lossy().to_string()),
    ];
    plist_dict.insert("ProgramArguments".to_string(), Value::Array(args));

    // EnvironmentVariables
    let mut env_vars = Dictionary::new();

    match config.tool.as_str() {
        "claude" => {
            env_vars.insert("CLAUDE_COMMAND".to_string(), Value::String(config.command_args.clone()));
            env_vars.insert(
                "CLAUDE_OPTIONS".to_string(),
                Value::String("--model opus --dangerously-skip-permissions".to_string()),
            );
        }
        "codex" => {
            env_vars.insert("CODEX_COMMAND".to_string(), Value::String(config.command_args.clone()));
            env_vars.insert(
                "CODEX_OPTIONS".to_string(),
                Value::String("--model gpt-5.2-codex --full-auto".to_string()),
            );
        }
        "gemini" => {
            env_vars.insert("GEMINI_COMMAND".to_string(), Value::String(config.command_args.clone()));
            env_vars.insert("GEMINI_OPTIONS".to_string(), Value::String("--yolo".to_string()));
        }
        _ => {}
    }

    env_vars.insert("TARGET_DIRECTORY".to_string(), Value::String(config.target_directory.clone()));
    env_vars.insert("AUTO_RETRY".to_string(), Value::String("false".to_string()));
    env_vars.insert("TOOL".to_string(), Value::String(config.tool.clone()));
    env_vars.insert("SCHEDULE_ID".to_string(), Value::String(config.schedule_id.clone()));
    env_vars.insert("SCHEDULE_TITLE".to_string(), Value::String(config.title.clone()));
    
    // Store schedule info in env vars for script logic and retrieval
    env_vars.insert("SCHEDULE_TYPE".to_string(), Value::String(config.schedule_type.clone()));
    if let Some(val) = config.interval_value {
        env_vars.insert("SCHEDULE_INTERVAL_DAYS".to_string(), Value::String(val.to_string()));
    }
    if let Some(date) = &config.start_date {
        env_vars.insert("SCHEDULE_START_DATE".to_string(), Value::String(date.clone()));
    }

    plist_dict.insert("EnvironmentVariables".to_string(), Value::Dictionary(env_vars));

    // StandardOutPath and StandardErrorPath
    let log_dir = get_config_dir()?.join("logs");
    let log_file = log_dir.join(format!("{}.log", config.tool));
    let error_file = log_dir.join(format!("{}.error.log", config.tool));

    plist_dict.insert("StandardOutPath".to_string(), Value::String(log_file.to_string_lossy().to_string()));
    plist_dict.insert("StandardErrorPath".to_string(), Value::String(error_file.to_string_lossy().to_string()));

    // Build plist XML manually
    let mut plist_xml = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    plist_xml.push_str("<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n");
    plist_xml.push_str("<plist version=\"1.0\">\n");
    plist_xml.push_str("<dict>\n");

    // Helper function to escape XML strings
    fn escape_xml(s: &str) -> String {
        s.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;")
    }

    // Add each key-value pair to the plist
    for (key, value) in &plist_dict {
        plist_xml.push_str(&format!("\t<key>{}</key>\n", escape_xml(key)));
        match value {
            Value::String(s) => {
                plist_xml.push_str(&format!("\t<string>{}</string>\n", escape_xml(s)));
            }
            Value::Dictionary(dict) => {
                plist_xml.push_str("\t<dict>\n");
                for (k, v) in dict {
                    plist_xml.push_str(&format!("\t\t<key>{}</key>\n", escape_xml(k)));
                    if let Value::Integer(num) = v {
                        plist_xml.push_str(&format!("\t\t<integer>{}</integer>\n", num));
                    } else if let Value::String(s) = v {
                         plist_xml.push_str(&format!("\t\t<string>{}</string>\n", escape_xml(s)));
                    }
                }
                plist_xml.push_str("\t</dict>\n");
            }
            Value::Array(arr) => {
                plist_xml.push_str("\t<array>\n");
                for item in arr {
                    if let Value::String(s) = item {
                        plist_xml.push_str(&format!("\t\t<string>{}</string>\n", escape_xml(s)));
                    }
                }
                plist_xml.push_str("\t</array>\n");
            }
            _ => {}
        }
    }

    plist_xml.push_str("</dict>\n");
    plist_xml.push_str("</plist>\n");

    let plist_bytes = plist_xml.into_bytes();
    fs::write(&plist_path, plist_bytes)
        .map_err(|e| format!("Failed to write plist file: {}", e))?;

    Ok(format!("Plist created at: {}", plist_path.display()))
}

/// Delete the plist for a specific tool
pub fn delete_plist(tool: &str, schedule_id: &str) -> Result<String, String> {
    let plist_path = if schedule_id == "legacy" {
        get_legacy_plist_path(tool)?
    } else {
        get_plist_path(tool, schedule_id)?
    };

    if plist_path.exists() {
        fs::remove_file(&plist_path)
            .map_err(|e| format!("Failed to delete plist file: {}", e))?;
        Ok(format!("Plist deleted: {}", plist_path.display()))
    } else {
        Err(format!("Plist not found for tool: {}", tool))
    }
}

/// Get all registered schedules
pub fn get_registered_schedules() -> Result<Vec<RegisteredSchedule>, String> {
    let config_dir = get_config_dir()?;
    let mut schedules = Vec::new();

    if !config_dir.exists() {
        return Ok(schedules);
    }

    let entries = fs::read_dir(&config_dir)
        .map_err(|e| format!("Failed to read config directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read config entry: {}", e))?;
        let path = entry.path();
        if let Some(file_name) = path.file_name().and_then(|s| s.to_str()) {
            if parse_plist_filename(file_name).is_none() {
                continue;
            }
            if let Ok(Some(schedule)) = load_plist_from_path(&path) {
                schedules.push(schedule);
            }
        }
    }

    Ok(schedules)
}

/// Check if a tool is scheduled
pub fn is_tool_scheduled(tool: &str) -> Result<bool, String> {
    let config_dir = get_config_dir()?;
    if !config_dir.exists() {
        return Ok(false);
    }
    let entries = fs::read_dir(&config_dir)
        .map_err(|e| format!("Failed to read config directory: {}", e))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read config entry: {}", e))?;
        let path = entry.path();
        if let Some(file_name) = path.file_name().and_then(|s| s.to_str()) {
            if let Some((found_tool, _)) = parse_plist_filename(file_name) {
                if found_tool == tool {
                    return Ok(true);
                }
            }
        }
    }
    Ok(false)
}

/// Load plist content for a path
pub fn load_plist_from_path(plist_path: &PathBuf) -> Result<Option<RegisteredSchedule>, String> {
    if !plist_path.exists() {
        return Ok(None);
    }

    let plist_content = fs::read(plist_path)
        .map_err(|e| format!("Failed to read plist file: {}", e))?;

    let plist_value: Value = plist::from_reader(Cursor::new(plist_content.as_slice()))
        .map_err(|e| format!("Failed to parse plist: {}", e))?;

    if let Some(dict) = plist_value.as_dictionary() {
        if let Some(cal_interval) = dict.get("StartCalendarInterval") {
            if let Some(cal_dict) = cal_interval.as_dictionary() {
                if let (Some(hour_val), Some(minute_val)) =
                    (cal_dict.get("Hour"), cal_dict.get("Minute")) {
                    if let (Some(hour), Some(minute)) =
                        (hour_val.as_signed_integer(), minute_val.as_signed_integer()) {
                        
                        let execution_time = format!("{:02}:{:02}", hour, minute);
                        
                        // Parse EnvironmentVariables for extra schedule info
                        let mut schedule_type = "daily".to_string();
                        let mut interval_value = None;
                        let mut start_date = None;
                        let mut schedule_id = None;
                        let mut tool = None;
                        let mut title = None;
                        let mut command_args = None;
                        let mut target_directory = None;

                        if let Some(env_vars) = dict.get("EnvironmentVariables") {
                            if let Some(env_dict) = env_vars.as_dictionary() {
                                if let Some(Value::String(s)) = env_dict.get("SCHEDULE_TYPE") {
                                    schedule_type = s.clone();
                                }
                                if let Some(Value::String(s)) = env_dict.get("SCHEDULE_INTERVAL_DAYS") {
                                    if let Ok(v) = s.parse::<u32>() {
                                        interval_value = Some(v);
                                    }
                                }
                                if let Some(Value::String(s)) = env_dict.get("SCHEDULE_START_DATE") {
                                    start_date = Some(s.clone());
                                }
                                if let Some(Value::String(s)) = env_dict.get("SCHEDULE_ID") {
                                    schedule_id = Some(s.clone());
                                }
                                if let Some(Value::String(s)) = env_dict.get("SCHEDULE_TITLE") {
                                    title = Some(s.clone());
                                }
                                if let Some(Value::String(s)) = env_dict.get("TOOL") {
                                    tool = Some(s.clone());
                                }
                                if let Some(Value::String(s)) = env_dict.get("CLAUDE_COMMAND") {
                                    command_args = Some(s.clone());
                                }
                                if let Some(Value::String(s)) = env_dict.get("CODEX_COMMAND") {
                                    command_args = Some(s.clone());
                                }
                                if let Some(Value::String(s)) = env_dict.get("GEMINI_COMMAND") {
                                    command_args = Some(s.clone());
                                }
                                if let Some(Value::String(s)) = env_dict.get("TARGET_DIRECTORY") {
                                    target_directory = Some(s.clone());
                                }
                            }
                        }

                        let (tool, schedule_id) = if let (Some(t), Some(id)) =
                            (tool.as_ref(), schedule_id.as_ref())
                        {
                            (t.clone(), id.clone())
                        } else {
                            let file_name = plist_path
                                .file_name()
                                .and_then(|s| s.to_str())
                                .unwrap_or_default();
                            if let Some((parsed_tool, parsed_id)) =
                                parse_plist_filename(file_name)
                            {
                                (parsed_tool, parsed_id)
                            } else {
                                (
                                    tool.unwrap_or_else(|| "unknown".to_string()),
                                    schedule_id.unwrap_or_else(|| "legacy".to_string()),
                                )
                            }
                        };

                        let title = title.unwrap_or_else(|| "無題のスケジュール".to_string());
                        let command_args = command_args.unwrap_or_default();
                        let target_directory = target_directory.unwrap_or_default();

                        return Ok(Some(RegisteredSchedule {
                            tool,
                            schedule_id,
                            title,
                            execution_time,
                            target_directory,
                            command_args,
                            created_at: chrono::Local::now().to_rfc3339(),
                            schedule_type,
                            interval_value,
                            start_date,
                        }));
                    }
                }
            }
        }
    }

    Ok(None)
}

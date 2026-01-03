import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Header,
  TabSelector,
  SettingsPanel,
  ExecutionPanel,
} from "./components";
import {
  ToolType,
  ClaudeToolSettings,
  CodexToolSettings,
  GeminiToolSettings,
  AppSettings,
  ExecutionResult,
  ITermStatus,
  ExecutionPhase,
  DEFAULT_CLAUDE_SETTINGS,
  DEFAULT_CODEX_SETTINGS,
  DEFAULT_GEMINI_SETTINGS,
  TOOL_DISPLAY_NAMES,
} from "./types/tools";
import { RegisteredSchedule } from "./types/schedule";

function App() {
  function getDefaultTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  const defaultTime = getDefaultTime();

  // アプリケーション設定を管理
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("cliRunnerSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validTabs: ToolType[] = ["claude", "codex", "gemini"];
        // 新しいプロパティのデフォルト値
        if (!parsed.activeTab || !validTabs.includes(parsed.activeTab)) {
          parsed.activeTab = "claude";
        }
        if (!parsed.claude) {
          parsed.claude = {
            ...DEFAULT_CLAUDE_SETTINGS,
            executionTime: defaultTime,
          };
        }
        if (!parsed.codex) {
          parsed.codex = {
            ...DEFAULT_CODEX_SETTINGS,
            executionTime: defaultTime,
          };
        }
        if (!parsed.gemini) {
          parsed.gemini = {
            ...DEFAULT_GEMINI_SETTINGS,
            executionTime: defaultTime,
          };
        }
        if (
          parsed.claude &&
          typeof parsed.claude.dangerouslySkipPermissions !== "boolean"
        ) {
          parsed.claude.dangerouslySkipPermissions = false;
        }
        if (parsed.gemini) {
          if (
            parsed.gemini.outputFormat !== "text" &&
            parsed.gemini.outputFormat !== "json"
          ) {
            parsed.gemini.outputFormat = "text";
          }
          if (typeof parsed.gemini.includeDirectories !== "string") {
            parsed.gemini.includeDirectories = "";
          }
          if (
            parsed.gemini.approvalMode !== "default" &&
            parsed.gemini.approvalMode !== "auto_edit" &&
            parsed.gemini.approvalMode !== "yolo"
          ) {
            parsed.gemini.approvalMode = "default";
          }
        }
        // 古いCodexモデル名を新しいものにマイグレーション
        if (parsed.codex && parsed.codex.model) {
          const oldModels = ["codex-mini-latest", "gpt-5-codex", "gpt-5", "o3"];
          if (oldModels.includes(parsed.codex.model)) {
            parsed.codex.model = "gpt-5.2-codex";
          }
        }
        // 古いClaude Code設定（options）を新しい設定（model）にマイグレーション
        if (parsed.claude && (parsed.claude as any).options) {
          const optionsStr = (parsed.claude as any).options as string;
          // "--model opus" から "opus" を抽出
          const modelMatch = optionsStr.match(/--model\s+(\w+)/);
          if (modelMatch) {
            const oldModel = modelMatch[1];
            // 古いモデル名を新しい形式に変換
            if (oldModel === "opus") {
              parsed.claude.model = "claude-opus-4-5-20251101";
            } else if (oldModel === "sonnet") {
              parsed.claude.model = "claude-sonnet-4-5-20250929";
            } else if (oldModel === "haiku") {
              parsed.claude.model = "claude-haiku-4-5-20251001";
            } else {
              parsed.claude.model = "claude-opus-4-5-20251101"; // デフォルト
            }
          } else {
            parsed.claude.model = "claude-opus-4-5-20251101"; // デフォルト
          }
          delete (parsed.claude as any).options;
        }
        // 古いClaude Codeモデル名を新しいものにマイグレーション
        if (parsed.claude && parsed.claude.model) {
          const modelMap: { [key: string]: string } = {
            opus: "claude-opus-4-5-20251101",
            sonnet: "claude-sonnet-4-5-20250929",
            haiku: "claude-haiku-4-5-20251001",
            "haiku-3.5": "claude-haiku-4-5-20251001",
            "opus-4.5": "claude-opus-4-5-20251101",
            "sonnet-4.5": "claude-sonnet-4-5-20250929",
            "haiku-4.5": "claude-haiku-4-5-20251001",
          };
          if (modelMap[parsed.claude.model]) {
            parsed.claude.model = modelMap[parsed.claude.model];
          }
        }
        return parsed;
      } catch (error) {
        console.warn("Failed to parse saved settings, using defaults.", error);
      }
    }
    return {
      activeTab: "claude" as ToolType,
      claude: { ...DEFAULT_CLAUDE_SETTINGS, executionTime: defaultTime },
      codex: { ...DEFAULT_CODEX_SETTINGS, executionTime: defaultTime },
      gemini: { ...DEFAULT_GEMINI_SETTINGS, executionTime: defaultTime },
    };
  });

  const [isRunning, setIsRunning] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [toolStatus, setToolStatus] = useState<string>("");
  const [executionPhase, setExecutionPhase] = useState<ExecutionPhase>(null);
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(
    null,
  );
  const [checkingStartTime, setCheckingStartTime] = useState<number | null>(
    null,
  );
  const [iTermStatus, setITermStatus] = useState<ITermStatus | null>(null);
  const [checkingITerm, setCheckingITerm] = useState(false);
  const [rescheduledTime, setRescheduledTime] = useState<string | null>(null);
  const [registeredSchedules, setRegisteredSchedules] = useState<
    Record<ToolType, RegisteredSchedule | null>
  >({
    claude: null,
    codex: null,
    gemini: null,
  });
  const [activeExecution, setActiveExecution] = useState<{
    tool: ToolType;
    settings: ClaudeToolSettings | CodexToolSettings | GeminiToolSettings;
  } | null>(null);

  // 現在のタブの設定を取得
  const currentSettings = (() => {
    switch (appSettings.activeTab) {
      case "claude":
        return appSettings.claude;
      case "codex":
        return appSettings.codex;
      case "gemini":
        return appSettings.gemini;
      default:
        return appSettings.claude;
    }
  })();

  const activeToolName = TOOL_DISPLAY_NAMES[appSettings.activeTab];
  const runningToolName = activeExecution
    ? TOOL_DISPLAY_NAMES[activeExecution.tool]
    : activeToolName;
  const executionTime =
    activeExecution?.settings.executionTime ?? currentSettings.executionTime;
  const autoRetryOnRateLimit =
    activeExecution?.settings.autoRetryOnRateLimit ??
    currentSettings.autoRetryOnRateLimit;

  // 設定をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem("cliRunnerSettings", JSON.stringify(appSettings));
  }, [appSettings]);

  // 実行開始イベントをリッスン
  useEffect(() => {
    const unlisten = listen("execution-started", () => {
      setExecutionPhase("checking");
      setStatus(
        autoRetryOnRateLimit
          ? `${runningToolName} 実行中 - Rate limit監視中...`
          : `${runningToolName} 動作ステータス取得待機中`,
      );
      setCheckingStartTime(new Date().getTime());
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [autoRetryOnRateLimit, runningToolName]);

  // ターミナル出力をリッスン
  useEffect(() => {
    const unlisten = listen<string>("terminal-output", (event) => {
      setToolStatus(event.payload);

      // Rate limitを検出したときにステータスを更新
      if (event.payload.includes("Rate limit detected")) {
        const timeMatch = event.payload.match(/(\d{2}):01/);
        const remainingMatch = event.payload.match(/残り約(\d+)分/);

        if (timeMatch && remainingMatch) {
          const scheduledTime = timeMatch[0];
          const remainingMinutes = parseInt(remainingMatch[1]);
          const hours = Math.floor(remainingMinutes / 60);
          const minutes = remainingMinutes % 60;

          if (hours > 0) {
            setStatus(
              `Rate limit検出 - ${scheduledTime}に再実行予定 (残り約${hours}時間${minutes}分)`,
            );
          } else {
            setStatus(
              `Rate limit検出 - ${scheduledTime}に再実行予定 (残り約${minutes}分)`,
            );
          }
        }
      } else if (
        event.payload.includes("Claude usage limit reached") ||
        /rate limit/i.test(event.payload) ||
        event.payload.includes("RESOURCE_EXHAUSTED") ||
        /quota/i.test(event.payload)
      ) {
        const resetMatch = event.payload.match(/reset at (\d+(?:am|pm))/i);
        const resetTime = resetMatch ? resetMatch[1] : "指定時刻";

        const timeMatch = event.payload.match(/残り約(\d+)分/);
        if (timeMatch) {
          const remainingMinutes = parseInt(timeMatch[1]);
          const hours = Math.floor(remainingMinutes / 60);
          const minutes = remainingMinutes % 60;

          if (hours > 0) {
            setStatus(
              `Rate limit検出 - ${resetTime}まで待機中 (残り約${hours}時間${minutes}分)`,
            );
          } else {
            setStatus(
              `Rate limit検出 - ${resetTime}まで待機中 (残り約${minutes}分)`,
            );
          }
        } else {
          setStatus(`Rate limit検出 - ${resetTime}まで待機中...`);
        }
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Rate limitリトライスケジュールをリッスン
  useEffect(() => {
    const unlisten = listen<string>("rate-limit-retry-scheduled", (event) => {
      setRescheduledTime(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // カウントダウンタイマー
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      const now = new Date();

      if (executionPhase === "checking") {
        if (autoRetryOnRateLimit) {
          if (!checkingStartTime) {
            setCheckingStartTime(now.getTime());
          }

          if (toolStatus.includes("Rate limit detected") && rescheduledTime) {
            const [hours, minutes] = rescheduledTime.split(":").map(Number);
            const target = new Date();
            target.setHours(hours, minutes, 0, 0);

            if (target.getTime() <= now.getTime()) {
              target.setDate(target.getDate() + 1);
            }

            const distance = target.getTime() - now.getTime();
            const countdownHours = Math.floor(
              (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
            );
            const countdownMinutes = Math.floor(
              (distance % (1000 * 60 * 60)) / (1000 * 60),
            );
            const countdownSeconds = Math.floor(
              (distance % (1000 * 60)) / 1000,
            );
            setCountdown(
              `${countdownHours}時間 ${countdownMinutes}分 ${countdownSeconds}秒`,
            );
          } else if (
            toolStatus.includes("Claude usage limit reached") ||
            /rate limit/i.test(toolStatus) ||
            toolStatus.includes("RESOURCE_EXHAUSTED") ||
            /quota/i.test(toolStatus)
          ) {
            const resetMatch = toolStatus.match(/reset at (\d+(?:am|pm))/i);
            const resetTime = resetMatch ? resetMatch[1] : "指定時刻";

            if (toolStatus.includes("Rate limit:")) {
              const timeMatch = toolStatus.match(/残り約(\d+)分/);
              if (timeMatch) {
                const remainingMinutes = parseInt(timeMatch[1]);
                const hours = Math.floor(remainingMinutes / 60);
                const minutes = remainingMinutes % 60;
                const seconds = 0;
                setCountdown(`${hours}時間 ${minutes}分 ${seconds}秒`);
              } else {
                setCountdown(`${resetTime}まで待機中...`);
              }
            } else {
              setCountdown(`${resetTime}まで待機中...`);
            }
          } else {
            const elapsedSeconds = Math.floor(
              (now.getTime() - (checkingStartTime || now.getTime())) / 1000,
            );
            const currentCycleSeconds = elapsedSeconds % 60;
            const remainingSeconds = 60 - currentCycleSeconds;

            setCountdown(`次の確認まで: ${remainingSeconds}秒`);
          }
        } else {
          if (!checkingStartTime) {
            setCheckingStartTime(now.getTime());
            return;
          }

          const elapsedSeconds = Math.floor(
            (now.getTime() - checkingStartTime) / 1000,
          );
          const remainingSeconds = Math.max(0, 120 - elapsedSeconds);

          if (remainingSeconds <= 0) {
            setCountdown("待機完了");
            return;
          }

          const minutes = Math.floor(remainingSeconds / 60);
          const seconds = remainingSeconds % 60;
          setCountdown(`${minutes}分 ${seconds}秒`);
        }
      } else if (executionPhase === "waiting" && isRunning) {
        const [hours, minutes] = executionTime.split(":").map(Number);
        const target = new Date();
        target.setHours(hours, minutes, 0, 0);

        if (!executionStartTime && target.getTime() <= now.getTime()) {
          target.setDate(target.getDate() + 1);
        }

        const distance = target.getTime() - now.getTime();

        if (distance <= 0) {
          setCountdown("実行中...");
          setExecutionStartTime(now.getTime());
        } else {
          const hours = Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor(
            (distance % (1000 * 60 * 60)) / (1000 * 60),
          );
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setCountdown(`${hours}時間 ${minutes}分 ${seconds}秒`);
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [
    isRunning,
    executionPhase,
    executionTime,
    autoRetryOnRateLimit,
    executionStartTime,
    checkingStartTime,
    rescheduledTime,
    toolStatus,
  ]);

  async function startExecution() {
    if (!iTermStatus?.is_installed) {
      setStatus("エラー: iTermがインストールされていません");
      return;
    }

    if (!currentSettings.command.trim()) {
      setStatus(
        `エラー: ${activeToolName}で実行する命令を入力してください`,
      );
      return;
    }

    if (
      currentSettings.useNewITermWindow &&
      !currentSettings.targetDirectory.trim()
    ) {
      setStatus("エラー: 実行対象ディレクトリを選択してください");
      return;
    }

    setIsRunning(true);
    setStatus("待機中...");
    setToolStatus("");
    setExecutionPhase("waiting");
    setExecutionStartTime(null);
    setCheckingStartTime(null);
    setRescheduledTime(null);

    try {
      let result: ExecutionResult;

      const executionTool = appSettings.activeTab;
      let executionSettings:
        | ClaudeToolSettings
        | CodexToolSettings
        | GeminiToolSettings;

      if (executionTool === "claude") {
        const claudeSettings = { ...appSettings.claude };
        executionSettings = claudeSettings;
        setActiveExecution({ tool: "claude", settings: claudeSettings });
        const claudeOptions: string[] = [];
        if (claudeSettings.model) {
          claudeOptions.push(`--model ${claudeSettings.model}`);
        }
        if (claudeSettings.dangerouslySkipPermissions) {
          claudeOptions.push("--dangerously-skip-permissions");
        }
        result = await invoke<ExecutionResult>("execute_claude_command", {
          executionTime: claudeSettings.executionTime,
          targetDirectory: claudeSettings.targetDirectory,
          claudeOptions: claudeOptions.join(" "),
          claudeCommand: claudeSettings.command,
          autoRetryOnRateLimit: claudeSettings.autoRetryOnRateLimit,
          useNewWindow: claudeSettings.useNewITermWindow,
        });
      } else if (executionTool === "codex") {
        const codexSettings = { ...appSettings.codex };
        executionSettings = codexSettings;
        setActiveExecution({ tool: "codex", settings: codexSettings });
        result = await invoke<ExecutionResult>("execute_codex_command", {
          executionTime: codexSettings.executionTime,
          targetDirectory: codexSettings.targetDirectory,
          codexModel: codexSettings.model,
          codexApprovalMode: codexSettings.approvalMode,
          codexEnableSearch: codexSettings.enableSearch,
          codexCommand: codexSettings.command,
          autoRetryOnRateLimit: codexSettings.autoRetryOnRateLimit,
          useNewWindow: codexSettings.useNewITermWindow,
        });
      } else {
        const geminiSettings = { ...appSettings.gemini };
        executionSettings = geminiSettings;
        setActiveExecution({ tool: "gemini", settings: geminiSettings });
        result = await invoke<ExecutionResult>("execute_gemini_command", {
          executionTime: geminiSettings.executionTime,
          targetDirectory: geminiSettings.targetDirectory,
          geminiModel: geminiSettings.model,
          geminiApprovalMode: geminiSettings.approvalMode,
          geminiOutputFormat: geminiSettings.outputFormat,
          geminiIncludeDirectories: geminiSettings.includeDirectories,
          geminiCommand: geminiSettings.command,
          autoRetryOnRateLimit: geminiSettings.autoRetryOnRateLimit,
          useNewWindow: geminiSettings.useNewITermWindow,
        });
      }

      if (result.terminalOutput) {
        setToolStatus(result.terminalOutput);
      }

      if (result.status === "cancelled") {
        setStatus("実行を中止しました");
      } else if (result.status && result.status.startsWith("completed_in_")) {
        const timeMatch = result.status.match(/completed_in_(\d+)m(\d+)s/);
        if (timeMatch) {
          const minutes = timeMatch[1];
          const seconds = timeMatch[2];
          setStatus(`処理完了 (処理時間: ${minutes}分${seconds}秒)`);
        } else {
          setStatus("処理完了");
        }
      } else if (result.status === "rate_limit_detected") {
        setStatus("Rate limitを検出したため終了しました");
      } else if (executionSettings.autoRetryOnRateLimit) {
        setStatus("監視を終了しました");
      } else {
        if (result.needsRetry) {
          setStatus(`実行完了 - ${result.retryTime}に再実行予定`);
        } else {
          setStatus("実行完了");
        }
      }
    } catch (error) {
      setStatus(`エラー: ${error}`);
    } finally {
      setIsRunning(false);
      setActiveExecution(null);
      setExecutionPhase(null);
      setExecutionStartTime(null);
      setCheckingStartTime(null);
      setRescheduledTime(null);
      setCountdown("");
    }
  }

  async function stopExecution() {
    try {
      await invoke("stop_execution");
      setIsRunning(false);
      setActiveExecution(null);
      setExecutionPhase(null);
      setExecutionStartTime(null);
      setCheckingStartTime(null);
      setRescheduledTime(null);
      setStatus("実行を中止しました");
    } catch (error) {
      setStatus(`停止エラー: ${error}`);
    }
  }

  async function checkITermStatus() {
    setCheckingITerm(true);
    try {
      const status = await invoke<ITermStatus>("check_iterm_status");
      setITermStatus(status);
    } catch (error) {
      console.error("Failed to check iTerm status:", error);
      setStatus(`iTerm状態確認エラー: ${error}`);
    } finally {
      setCheckingITerm(false);
    }
  }

  // コンポーネントマウント時にiTermステータスを確認
  useEffect(() => {
    checkITermStatus();
  }, []);

  // 起動時に登録済みスケジュールを読み込み
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const schedules = await invoke<RegisteredSchedule[]>(
          "get_registered_schedules"
        );
        const map: Record<ToolType, RegisteredSchedule | null> = {
          claude: schedules.find((s) => s.tool === "claude") || null,
          codex: schedules.find((s) => s.tool === "codex") || null,
          gemini: schedules.find((s) => s.tool === "gemini") || null,
        };
        setRegisteredSchedules(map);
      } catch (error) {
        console.error("Failed to load registered schedules:", error);
      }
    };
    loadSchedules();
  }, []);

  // タブ変更ハンドラー
  function handleTabChange(tab: ToolType) {
    setAppSettings({ ...appSettings, activeTab: tab });
    if (!isRunning) {
      // ステータスをクリア
      setStatus("");
      setToolStatus("");
    }
  }

  // Claude設定変更ハンドラー
  function handleClaudeSettingsChange(settings: ClaudeToolSettings) {
    setAppSettings({ ...appSettings, claude: settings });
  }

  // Codex設定変更ハンドラー
  function handleCodexSettingsChange(settings: CodexToolSettings) {
    setAppSettings({ ...appSettings, codex: settings });
  }

  // Gemini設定変更ハンドラー
  function handleGeminiSettingsChange(settings: GeminiToolSettings) {
    setAppSettings({ ...appSettings, gemini: settings });
  }

  // 共通設定変更ハンドラー
  function handleExecutionTimeChange(time: string) {
    if (appSettings.activeTab === "claude") {
      setAppSettings({
        ...appSettings,
        claude: { ...appSettings.claude, executionTime: time },
      });
      return;
    }
    if (appSettings.activeTab === "codex") {
      setAppSettings({
        ...appSettings,
        codex: { ...appSettings.codex, executionTime: time },
      });
      return;
    }
    setAppSettings({
      ...appSettings,
      gemini: { ...appSettings.gemini, executionTime: time },
    });
  }

  function handleTargetDirectoryChange(dir: string) {
    if (appSettings.activeTab === "claude") {
      setAppSettings({
        ...appSettings,
        claude: { ...appSettings.claude, targetDirectory: dir },
      });
      return;
    }
    if (appSettings.activeTab === "codex") {
      setAppSettings({
        ...appSettings,
        codex: { ...appSettings.codex, targetDirectory: dir },
      });
      return;
    }
    setAppSettings({
      ...appSettings,
      gemini: { ...appSettings.gemini, targetDirectory: dir },
    });
  }

  function handleUseNewITermWindowChange(value: boolean) {
    if (appSettings.activeTab === "claude") {
      setAppSettings({
        ...appSettings,
        claude: { ...appSettings.claude, useNewITermWindow: value },
      });
      return;
    }
    if (appSettings.activeTab === "codex") {
      setAppSettings({
        ...appSettings,
        codex: { ...appSettings.codex, useNewITermWindow: value },
      });
      return;
    }
    setAppSettings({
      ...appSettings,
      gemini: { ...appSettings.gemini, useNewITermWindow: value },
    });
  }

  function handleAutoRetryOnRateLimitChange(value: boolean) {
    if (appSettings.activeTab === "claude") {
      setAppSettings({
        ...appSettings,
        claude: { ...appSettings.claude, autoRetryOnRateLimit: value },
      });
      return;
    }
    if (appSettings.activeTab === "codex") {
      setAppSettings({
        ...appSettings,
        codex: { ...appSettings.codex, autoRetryOnRateLimit: value },
      });
      return;
    }
    setAppSettings({
      ...appSettings,
      gemini: { ...appSettings.gemini, autoRetryOnRateLimit: value },
    });
  }

  function handleScheduleRegister(success: boolean) {
    if (success) {
      // Update local state
      const updated = { ...registeredSchedules };
      const schedule: RegisteredSchedule = {
        tool: appSettings.activeTab,
        execution_time: currentSettings.executionTime,
        created_at: new Date().toISOString(),
      };
      updated[appSettings.activeTab] = schedule;
      setRegisteredSchedules(updated);
      setStatus("スケジュール登録成功: Launchdに登録しました");
    } else {
      setStatus("スケジュール登録失敗");
    }
  }

  function handleScheduleUnregister(success: boolean) {
    if (success) {
      // Update local state
      const updated = { ...registeredSchedules };
      updated[appSettings.activeTab] = null;
      setRegisteredSchedules(updated);
      setStatus("スケジュール削除成功");
    } else {
      setStatus("スケジュール削除失敗");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-text-primary dark:text-text-dark-primary">
      <Header activeTab={appSettings.activeTab} />
      <div className="p-8">
        <TabSelector
          activeTab={appSettings.activeTab}
          onTabChange={handleTabChange}
          disabled={false}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左列: 設定パネル（約65%） */}
          <div className="md:col-span-2">
            <SettingsPanel
              executionTime={currentSettings.executionTime}
              targetDirectory={currentSettings.targetDirectory}
              useNewITermWindow={currentSettings.useNewITermWindow}
              autoRetryOnRateLimit={currentSettings.autoRetryOnRateLimit}
              iTermStatus={iTermStatus}
              checkingITerm={checkingITerm}
              isRunning={false}
              onExecutionTimeChange={handleExecutionTimeChange}
              onTargetDirectoryChange={handleTargetDirectoryChange}
              onUseNewITermWindowChange={handleUseNewITermWindowChange}
              onAutoRetryOnRateLimitChange={handleAutoRetryOnRateLimitChange}
              onCheckITermStatus={checkITermStatus}
              activeTab={appSettings.activeTab}
              claudeSettings={appSettings.claude}
              codexSettings={appSettings.codex}
              geminiSettings={appSettings.gemini}
              onClaudeSettingsChange={handleClaudeSettingsChange}
              onCodexSettingsChange={handleCodexSettingsChange}
              onGeminiSettingsChange={handleGeminiSettingsChange}
              registeredSchedule={registeredSchedules[appSettings.activeTab]}
              onScheduleRegister={handleScheduleRegister}
              onScheduleUnregister={handleScheduleUnregister}
            />
          </div>

          {/* 右列: 実行パネル（約35%） */}
          <div className="md:col-span-1">
            <ExecutionPanel
              activeTab={activeExecution?.tool ?? appSettings.activeTab}
              isRunning={isRunning}
              countdown={countdown}
              status={status}
              toolStatus={toolStatus}
              iTermStatus={iTermStatus}
              onStart={startExecution}
              onStop={stopExecution}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;

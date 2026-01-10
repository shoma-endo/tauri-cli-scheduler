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
  RunningStatus,
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
        if (parsed.claude && typeof parsed.claude.launchOptions !== "string") {
          parsed.claude.launchOptions = "";
        }
        if (parsed.codex && typeof parsed.codex.launchOptions !== "string") {
          parsed.codex.launchOptions = "";
        }
        if (parsed.gemini && typeof parsed.gemini.launchOptions !== "string") {
          parsed.gemini.launchOptions = "";
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

  // ツールごとの実行状態
  const [runningStatus, setRunningStatus] = useState<RunningStatus>({
    claude: false,
    codex: false,
    gemini: false,
  });
  const [countdown, setCountdown] = useState<Record<ToolType, string>>({
    claude: "",
    codex: "",
    gemini: "",
  });
  const [status, setStatus] = useState<Record<ToolType, string>>({
    claude: "",
    codex: "",
    gemini: "",
  });
  const [toolStatus, setToolStatus] = useState<Record<ToolType, string>>({
    claude: "",
    codex: "",
    gemini: "",
  });
  const [executionPhase, setExecutionPhase] = useState<Record<ToolType, ExecutionPhase>>({
    claude: null,
    codex: null,
    gemini: null,
  });
  const [executionStartTime, setExecutionStartTime] = useState<Record<ToolType, number | null>>({
    claude: null,
    codex: null,
    gemini: null,
  });
  const [checkingStartTime, setCheckingStartTime] = useState<Record<ToolType, number | null>>({
    claude: null,
    codex: null,
    gemini: null,
  });
  const [iTermStatus, setITermStatus] = useState<ITermStatus | null>(null);
  const [checkingITerm, setCheckingITerm] = useState(false);
  const [rescheduledTime, setRescheduledTime] = useState<Record<ToolType, string | null>>({
    claude: null,
    codex: null,
    gemini: null,
  });
  const [registeredSchedules, setRegisteredSchedules] = useState<
    Record<ToolType, RegisteredSchedule | null>
  >({
    claude: null,
    codex: null,
    gemini: null,
  });
  const [launchOptionsErrors, setLaunchOptionsErrors] = useState<Record<ToolType, string>>({
    claude: "",
    codex: "",
    gemini: "",
  });

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

  const activeTab = appSettings.activeTab;
  const activeToolName = TOOL_DISPLAY_NAMES[activeTab];
  const isCurrentTabRunning = runningStatus[activeTab];

  function hasBalancedQuotes(input: string) {
    let inSingle = false;
    let inDouble = false;
    let escaped = false;

    for (const char of input) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === "'" && !inDouble) {
        inSingle = !inSingle;
        continue;
      }
      if (char === '"' && !inSingle) {
        inDouble = !inDouble;
      }
    }

    return !inSingle && !inDouble && !escaped;
  }

  function containsFlag(input: string, flag: string) {
    const source = input;
    let index = 0;
    while (index < source.length) {
      const found = source.indexOf(flag, index);
      if (found === -1) return false;
      const before = found === 0 ? " " : source[found - 1];
      const afterIndex = found + flag.length;
      const after = afterIndex >= source.length ? " " : source[afterIndex];
      const beforeOk = /\s/.test(before);
      const afterOk = /\s|=/.test(after);
      if (beforeOk && afterOk) return true;
      index = found + flag.length;
    }
    return false;
  }

  function validateLaunchOptions(tool: ToolType, options: string) {
    if (!options.trim()) return "";
    if (/[\r\n]/.test(options)) {
      return "改行は使用できません";
    }
    if (!hasBalancedQuotes(options)) {
      return "引用符の数が正しくありません";
    }

    const reservedFlags: Record<ToolType, string[]> = {
      claude: ["--model", "--dangerously-skip-permissions"],
      codex: ["--model", "--sandbox", "--ask-for-approval", "--full-auto", "--search"],
      gemini: [
        "--model",
        "--output-format",
        "--include-directories",
        "--approval-mode",
        "--yolo",
        "--prompt",
      ],
    };

    for (const flag of reservedFlags[tool]) {
      if (containsFlag(options, flag)) {
        return `「${flag}」はUIの設定を使用してください`;
      }
    }

    return "";
  }

  // 設定をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem("cliRunnerSettings", JSON.stringify(appSettings));
  }, [appSettings]);

  // 実行開始イベントをリッスン（ツール情報付き）
  useEffect(() => {
    const unlisten = listen<{ tool: ToolType }>("execution-started", (event) => {
      const tool = event.payload?.tool || activeTab;
      const toolName = TOOL_DISPLAY_NAMES[tool];
      const autoRetry = appSettings[tool].autoRetryOnRateLimit;

      setExecutionPhase((prev) => ({ ...prev, [tool]: "checking" }));
      setStatus((prev) => ({
        ...prev,
        [tool]: autoRetry
          ? `${toolName} 実行中 - Rate limit監視中...`
          : `${toolName} 動作ステータス取得待機中`,
      }));
      setCheckingStartTime((prev) => ({ ...prev, [tool]: new Date().getTime() }));
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [activeTab, appSettings]);

  // ターミナル出力をリッスン（ツール情報付き）
  useEffect(() => {
    const unlisten = listen<{ tool: ToolType; output: string } | string>("terminal-output", (event) => {
      // 後方互換性: 文字列のみの場合は現在のアクティブタブに適用
      const payload = event.payload;
      const tool = typeof payload === "object" ? payload.tool : activeTab;
      const output = typeof payload === "object" ? payload.output : payload;

      setToolStatus((prev) => ({ ...prev, [tool]: output }));

      // Rate limitを検出したときにステータスを更新
      if (output.includes("Rate limit detected")) {
        const timeMatch = output.match(/(\d{2}):01/);
        const remainingMatch = output.match(/残り約(\d+)分/);

        if (timeMatch && remainingMatch) {
          const scheduledTime = timeMatch[0];
          const remainingMinutes = parseInt(remainingMatch[1]);
          const hours = Math.floor(remainingMinutes / 60);
          const minutes = remainingMinutes % 60;

          const statusMsg = hours > 0
            ? `Rate limit検出 - ${scheduledTime}に再実行予定 (残り約${hours}時間${minutes}分)`
            : `Rate limit検出 - ${scheduledTime}に再実行予定 (残り約${minutes}分)`;
          setStatus((prev) => ({ ...prev, [tool]: statusMsg }));
        }
      } else if (
        output.includes("Claude usage limit reached") ||
        /rate limit/i.test(output) ||
        output.includes("RESOURCE_EXHAUSTED") ||
        /quota/i.test(output)
      ) {
        const resetMatch = output.match(/reset at (\d+(?:am|pm))/i);
        const resetTime = resetMatch ? resetMatch[1] : "指定時刻";

        const timeMatch = output.match(/残り約(\d+)分/);
        if (timeMatch) {
          const remainingMinutes = parseInt(timeMatch[1]);
          const hours = Math.floor(remainingMinutes / 60);
          const minutes = remainingMinutes % 60;

          const statusMsg = hours > 0
            ? `Rate limit検出 - ${resetTime}まで待機中 (残り約${hours}時間${minutes}分)`
            : `Rate limit検出 - ${resetTime}まで待機中 (残り約${minutes}分)`;
          setStatus((prev) => ({ ...prev, [tool]: statusMsg }));
        } else {
          setStatus((prev) => ({ ...prev, [tool]: `Rate limit検出 - ${resetTime}まで待機中...` }));
        }
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [activeTab]);

  // Rate limitリトライスケジュールをリッスン（ツール情報付き）
  useEffect(() => {
    const unlisten = listen<{ tool: ToolType; time: string } | string>("rate-limit-retry-scheduled", (event) => {
      const payload = event.payload;
      const tool = typeof payload === "object" ? payload.tool : activeTab;
      const time = typeof payload === "object" ? payload.time : payload;
      setRescheduledTime((prev) => ({ ...prev, [tool]: time }));
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [activeTab]);

  // カウントダウンタイマー（各ツールごと）
  useEffect(() => {
    // 実行中のツールがあるかチェック
    const hasRunningTool = Object.values(runningStatus).some(Boolean);
    if (!hasRunningTool) return;

    const intervalId = setInterval(() => {
      const now = new Date();

      // 各ツールのカウントダウンを更新
      (["claude", "codex", "gemini"] as ToolType[]).forEach((tool) => {
        if (!runningStatus[tool]) return;

        const phase = executionPhase[tool];
        const autoRetry = appSettings[tool].autoRetryOnRateLimit;
        const toolStatusVal = toolStatus[tool];
        const reschedTime = rescheduledTime[tool];
        const checkStart = checkingStartTime[tool];
        const execStart = executionStartTime[tool];
        const execTime = appSettings[tool].executionTime;

        if (phase === "checking") {
          if (autoRetry) {
            if (!checkStart) {
              setCheckingStartTime((prev) => ({ ...prev, [tool]: now.getTime() }));
            }

            if (toolStatusVal.includes("Rate limit detected") && reschedTime) {
              const [hours, minutes] = reschedTime.split(":").map(Number);
              const target = new Date();
              target.setHours(hours, minutes, 0, 0);

              if (target.getTime() <= now.getTime()) {
                target.setDate(target.getDate() + 1);
              }

              const distance = target.getTime() - now.getTime();
              const countdownHours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const countdownMinutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
              const countdownSeconds = Math.floor((distance % (1000 * 60)) / 1000);
              setCountdown((prev) => ({
                ...prev,
                [tool]: `${countdownHours}時間 ${countdownMinutes}分 ${countdownSeconds}秒`,
              }));
            } else if (
              toolStatusVal.includes("Claude usage limit reached") ||
              /rate limit/i.test(toolStatusVal) ||
              toolStatusVal.includes("RESOURCE_EXHAUSTED") ||
              /quota/i.test(toolStatusVal)
            ) {
              const resetMatch = toolStatusVal.match(/reset at (\d+(?:am|pm))/i);
              const resetTime = resetMatch ? resetMatch[1] : "指定時刻";

              if (toolStatusVal.includes("Rate limit:")) {
                const timeMatch = toolStatusVal.match(/残り約(\d+)分/);
                if (timeMatch) {
                  const remainingMinutes = parseInt(timeMatch[1]);
                  const hours = Math.floor(remainingMinutes / 60);
                  const minutes = remainingMinutes % 60;
                  setCountdown((prev) => ({ ...prev, [tool]: `${hours}時間 ${minutes}分 0秒` }));
                } else {
                  setCountdown((prev) => ({ ...prev, [tool]: `${resetTime}まで待機中...` }));
                }
              } else {
                setCountdown((prev) => ({ ...prev, [tool]: `${resetTime}まで待機中...` }));
              }
            } else {
              const elapsedSeconds = Math.floor((now.getTime() - (checkStart || now.getTime())) / 1000);
              const currentCycleSeconds = elapsedSeconds % 60;
              const remainingSeconds = 60 - currentCycleSeconds;
              setCountdown((prev) => ({ ...prev, [tool]: `次の確認まで: ${remainingSeconds}秒` }));
            }
          } else {
            if (!checkStart) {
              setCheckingStartTime((prev) => ({ ...prev, [tool]: now.getTime() }));
              return;
            }

            const elapsedSeconds = Math.floor((now.getTime() - checkStart) / 1000);
            const remainingSeconds = Math.max(0, 120 - elapsedSeconds);

            if (remainingSeconds <= 0) {
              setCountdown((prev) => ({ ...prev, [tool]: "待機完了" }));
              return;
            }

            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            setCountdown((prev) => ({ ...prev, [tool]: `${minutes}分 ${seconds}秒` }));
          }
        } else if (phase === "waiting") {
          const [hours, minutes] = execTime.split(":").map(Number);
          const target = new Date();
          target.setHours(hours, minutes, 0, 0);

          if (!execStart && target.getTime() <= now.getTime()) {
            target.setDate(target.getDate() + 1);
          }

          const distance = target.getTime() - now.getTime();

          if (distance <= 0) {
            setCountdown((prev) => ({ ...prev, [tool]: "実行中..." }));
            setExecutionStartTime((prev) => ({ ...prev, [tool]: now.getTime() }));
          } else {
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setCountdown((prev) => ({ ...prev, [tool]: `${hours}時間 ${minutes}分 ${seconds}秒` }));
          }
        }
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [runningStatus, executionPhase, appSettings, executionStartTime, checkingStartTime, rescheduledTime, toolStatus]);

  async function startExecution() {
    const tool = activeTab;

    if (!iTermStatus?.is_installed) {
      setStatus((prev) => ({ ...prev, [tool]: "エラー: iTermがインストールされていません" }));
      return;
    }

    if (!currentSettings.command.trim()) {
      setStatus((prev) => ({
        ...prev,
        [tool]: `エラー: ${activeToolName}で実行する命令を入力してください`,
      }));
      return;
    }

    if (currentSettings.useNewITermWindow && !currentSettings.targetDirectory.trim()) {
      setStatus((prev) => ({ ...prev, [tool]: "エラー: 実行対象ディレクトリを選択してください" }));
      return;
    }

    if (currentSettings.useNewITermWindow) {
      const optionsError = validateLaunchOptions(tool, currentSettings.launchOptions);
      if (optionsError) {
        setLaunchOptionsErrors((prev) => ({ ...prev, [tool]: optionsError }));
        setStatus((prev) => ({
          ...prev,
          [tool]: `エラー: 起動オプションが不正です（${optionsError}）`,
        }));
        return;
      }
    }

    // ツールの実行状態を更新
    setRunningStatus((prev) => ({ ...prev, [tool]: true }));
    setStatus((prev) => ({ ...prev, [tool]: "待機中..." }));
    setToolStatus((prev) => ({ ...prev, [tool]: "" }));
    setExecutionPhase((prev) => ({ ...prev, [tool]: "waiting" }));
    setExecutionStartTime((prev) => ({ ...prev, [tool]: null }));
    setCheckingStartTime((prev) => ({ ...prev, [tool]: null }));
    setRescheduledTime((prev) => ({ ...prev, [tool]: null }));

    try {
      let result: ExecutionResult;
      let executionSettings: ClaudeToolSettings | CodexToolSettings | GeminiToolSettings;

      if (tool === "claude") {
        const claudeSettings = { ...appSettings.claude };
        executionSettings = claudeSettings;
        result = await invoke<ExecutionResult>("execute_claude_command", {
          executionTime: claudeSettings.executionTime,
          targetDirectory: claudeSettings.targetDirectory,
          claudeModel: claudeSettings.model,
          claudeSkipPermissions: claudeSettings.dangerouslySkipPermissions,
          claudeLaunchOptions: claudeSettings.launchOptions,
          claudeCommand: claudeSettings.command,
          autoRetryOnRateLimit: claudeSettings.autoRetryOnRateLimit,
          useNewWindow: claudeSettings.useNewITermWindow,
        });
      } else if (tool === "codex") {
        const codexSettings = { ...appSettings.codex };
        executionSettings = codexSettings;
        result = await invoke<ExecutionResult>("execute_codex_command", {
          executionTime: codexSettings.executionTime,
          targetDirectory: codexSettings.targetDirectory,
          codexModel: codexSettings.model,
          codexApprovalMode: codexSettings.approvalMode,
          codexEnableSearch: codexSettings.enableSearch,
          codexLaunchOptions: codexSettings.launchOptions,
          codexCommand: codexSettings.command,
          autoRetryOnRateLimit: codexSettings.autoRetryOnRateLimit,
          useNewWindow: codexSettings.useNewITermWindow,
        });
      } else {
        const geminiSettings = { ...appSettings.gemini };
        executionSettings = geminiSettings;
        result = await invoke<ExecutionResult>("execute_gemini_command", {
          executionTime: geminiSettings.executionTime,
          targetDirectory: geminiSettings.targetDirectory,
          geminiModel: geminiSettings.model,
          geminiApprovalMode: geminiSettings.approvalMode,
          geminiOutputFormat: geminiSettings.outputFormat,
          geminiIncludeDirectories: geminiSettings.includeDirectories,
          geminiLaunchOptions: geminiSettings.launchOptions,
          geminiCommand: geminiSettings.command,
          autoRetryOnRateLimit: geminiSettings.autoRetryOnRateLimit,
          useNewWindow: geminiSettings.useNewITermWindow,
        });
      }

      if (result.terminalOutput) {
        setToolStatus((prev) => ({ ...prev, [tool]: result.terminalOutput! }));
      }

      let finalStatus: string;
      if (result.status === "cancelled") {
        finalStatus = "実行を中止しました";
      } else if (result.status && result.status.startsWith("completed_in_")) {
        const timeMatch = result.status.match(/completed_in_(\d+)m(\d+)s/);
        if (timeMatch) {
          finalStatus = `処理完了 (処理時間: ${timeMatch[1]}分${timeMatch[2]}秒)`;
        } else {
          finalStatus = "処理完了";
        }
      } else if (result.status === "rate_limit_detected") {
        finalStatus = "Rate limitを検出したため終了しました";
      } else if (executionSettings.autoRetryOnRateLimit) {
        finalStatus = "監視を終了しました";
      } else {
        finalStatus = result.needsRetry ? `実行完了 - ${result.retryTime}に再実行予定` : "実行完了";
      }
      setStatus((prev) => ({ ...prev, [tool]: finalStatus }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, [tool]: `エラー: ${error}` }));
    } finally {
      setRunningStatus((prev) => ({ ...prev, [tool]: false }));
      setExecutionPhase((prev) => ({ ...prev, [tool]: null }));
      setExecutionStartTime((prev) => ({ ...prev, [tool]: null }));
      setCheckingStartTime((prev) => ({ ...prev, [tool]: null }));
      setRescheduledTime((prev) => ({ ...prev, [tool]: null }));
      setCountdown((prev) => ({ ...prev, [tool]: "" }));
    }
  }

  async function stopExecution() {
    const tool = activeTab;
    try {
      await invoke("stop_execution", { tool });
      setRunningStatus((prev) => ({ ...prev, [tool]: false }));
      setExecutionPhase((prev) => ({ ...prev, [tool]: null }));
      setExecutionStartTime((prev) => ({ ...prev, [tool]: null }));
      setCheckingStartTime((prev) => ({ ...prev, [tool]: null }));
      setRescheduledTime((prev) => ({ ...prev, [tool]: null }));
      setStatus((prev) => ({ ...prev, [tool]: "実行を中止しました" }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, [tool]: `停止エラー: ${error}` }));
    }
  }

  async function checkITermStatus() {
    setCheckingITerm(true);
    try {
      const status = await invoke<ITermStatus>("check_iterm_status");
      setITermStatus(status);
    } catch (error) {
      console.error("Failed to check iTerm status:", error);
      setStatus((prev) => ({ ...prev, [activeTab]: `iTerm状態確認エラー: ${error}` }));
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
    // 実行中でない場合のみステータスをクリア
    if (!runningStatus[tab]) {
      setStatus((prev) => ({ ...prev, [tab]: "" }));
      setToolStatus((prev) => ({ ...prev, [tab]: "" }));
    }
  }

  // Claude設定変更ハンドラー
  function handleClaudeSettingsChange(settings: ClaudeToolSettings) {
    setAppSettings({ ...appSettings, claude: settings });
    if (!settings.useNewITermWindow) {
      setLaunchOptionsErrors((prev) => ({ ...prev, claude: "" }));
      return;
    }
    const optionsError = validateLaunchOptions("claude", settings.launchOptions);
    setLaunchOptionsErrors((prev) => ({ ...prev, claude: optionsError }));
  }

  // Codex設定変更ハンドラー
  function handleCodexSettingsChange(settings: CodexToolSettings) {
    setAppSettings({ ...appSettings, codex: settings });
    if (!settings.useNewITermWindow) {
      setLaunchOptionsErrors((prev) => ({ ...prev, codex: "" }));
      return;
    }
    const optionsError = validateLaunchOptions("codex", settings.launchOptions);
    setLaunchOptionsErrors((prev) => ({ ...prev, codex: optionsError }));
  }

  // Gemini設定変更ハンドラー
  function handleGeminiSettingsChange(settings: GeminiToolSettings) {
    setAppSettings({ ...appSettings, gemini: settings });
    if (!settings.useNewITermWindow) {
      setLaunchOptionsErrors((prev) => ({ ...prev, gemini: "" }));
      return;
    }
    const optionsError = validateLaunchOptions("gemini", settings.launchOptions);
    setLaunchOptionsErrors((prev) => ({ ...prev, gemini: optionsError }));
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
      if (!value) {
        setLaunchOptionsErrors((prev) => ({ ...prev, claude: "" }));
      }
      return;
    }
    if (appSettings.activeTab === "codex") {
      setAppSettings({
        ...appSettings,
        codex: { ...appSettings.codex, useNewITermWindow: value },
      });
      if (!value) {
        setLaunchOptionsErrors((prev) => ({ ...prev, codex: "" }));
      }
      return;
    }
    setAppSettings({
      ...appSettings,
      gemini: { ...appSettings.gemini, useNewITermWindow: value },
    });
    if (!value) {
      setLaunchOptionsErrors((prev) => ({ ...prev, gemini: "" }));
    }
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

  async function handleScheduleRegister(success: boolean) {
    const tool = appSettings.activeTab;
    if (success) {
      // Re-fetch schedules from backend to ensure we have the correct data including new fields
      try {
        const schedules = await invoke<RegisteredSchedule[]>("get_registered_schedules");
        const updated: Record<ToolType, RegisteredSchedule | null> = {
          claude: null,
          codex: null,
          gemini: null,
        };
        schedules.forEach((s) => {
          if (s.tool === "claude" || s.tool === "codex" || s.tool === "gemini") {
            updated[s.tool as ToolType] = s;
          }
        });
        setRegisteredSchedules(updated);
        setStatus((prev) => ({ ...prev, [tool]: "スケジュール登録成功" }));
      } catch (error) {
        console.error("Failed to fetch schedules after registration:", error);
        setStatus((prev) => ({ ...prev, [tool]: "スケジュール登録成功（表示更新失敗）" }));
      }
    } else {
      setStatus((prev) => ({ ...prev, [tool]: "スケジュール登録失敗" }));
    }
  }

  function handleScheduleUnregister(success: boolean) {
    const tool = appSettings.activeTab;
    if (success) {
      // Update local state
      const updated = { ...registeredSchedules };
      updated[tool] = null;
      setRegisteredSchedules(updated);
      setStatus((prev) => ({ ...prev, [tool]: "スケジュール削除成功" }));
    } else {
      setStatus((prev) => ({ ...prev, [tool]: "スケジュール削除失敗" }));
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
          runningStatus={runningStatus}
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
              launchOptionsErrors={launchOptionsErrors}
              registeredSchedule={registeredSchedules[appSettings.activeTab]}
              onScheduleRegister={handleScheduleRegister}
              onScheduleUnregister={handleScheduleUnregister}
            />
          </div>

          {/* 右列: 実行パネル（約35%） */}
          <div className="md:col-span-1">
            <ExecutionPanel
              activeTab={activeTab}
              isRunning={isCurrentTabRunning}
              countdown={countdown[activeTab]}
              status={status[activeTab]}
              toolStatus={toolStatus[activeTab]}
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

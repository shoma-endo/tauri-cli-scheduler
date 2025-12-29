import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Header,
  TabSelector,
  CommonSettings,
  ExecutionPanel,
  ClaudeSettings,
  CodexSettings,
} from "./components";
import {
  ToolType,
  ClaudeToolSettings,
  CodexToolSettings,
  ExecutionResult,
  ITermStatus,
  ExecutionPhase,
  DEFAULT_CLAUDE_SETTINGS,
  DEFAULT_CODEX_SETTINGS,
} from "./types/tools";

interface AppSettings {
  activeTab: ToolType;
  claude: ClaudeToolSettings;
  codex: CodexToolSettings;
}

function App() {
  const now = new Date();
  const defaultTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes() + 1).padStart(2, "0")}`;

  // アプリケーション設定を管理
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("cliRunnerSettings");
    if (saved) {
      const parsed = JSON.parse(saved);
      // 実行時刻は常に現在時刻+1分
      if (parsed.claude) {
        parsed.claude.executionTime = defaultTime;
      }
      if (parsed.codex) {
        parsed.codex.executionTime = defaultTime;
      }
      // 新しいプロパティのデフォルト値
      if (!parsed.activeTab) {
        parsed.activeTab = "claude";
      }
      if (!parsed.claude) {
        parsed.claude = { ...DEFAULT_CLAUDE_SETTINGS, executionTime: defaultTime };
      }
      if (!parsed.codex) {
        parsed.codex = { ...DEFAULT_CODEX_SETTINGS, executionTime: defaultTime };
      }
      return parsed;
    }
    return {
      activeTab: "claude" as ToolType,
      claude: { ...DEFAULT_CLAUDE_SETTINGS, executionTime: defaultTime },
      codex: { ...DEFAULT_CODEX_SETTINGS, executionTime: defaultTime },
    };
  });

  const [isRunning, setIsRunning] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [toolStatus, setToolStatus] = useState<string>("");
  const [executionPhase, setExecutionPhase] = useState<ExecutionPhase>(null);
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(null);
  const [checkingStartTime, setCheckingStartTime] = useState<number | null>(null);
  const [iTermStatus, setITermStatus] = useState<ITermStatus | null>(null);
  const [checkingITerm, setCheckingITerm] = useState(false);
  const [rescheduledTime, setRescheduledTime] = useState<string | null>(null);

  // 現在のタブの設定を取得
  const currentSettings = appSettings.activeTab === "claude"
    ? appSettings.claude
    : appSettings.codex;

  // 設定をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem("cliRunnerSettings", JSON.stringify(appSettings));
  }, [appSettings]);

  // 実行開始イベントをリッスン
  useEffect(() => {
    const unlisten = listen("execution-started", () => {
      setExecutionPhase("checking");
      setStatus(
        currentSettings.autoRetryOnRateLimit
          ? `${appSettings.activeTab === "claude" ? "Claude Code" : "Codex"} 実行中 - Rate limit監視中...`
          : `${appSettings.activeTab === "claude" ? "Claude Code" : "Codex"} 動作ステータス取得待機中`
      );
      setCheckingStartTime(new Date().getTime());
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [appSettings.activeTab, currentSettings.autoRetryOnRateLimit]);

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
              `Rate limit検出 - ${scheduledTime}に再実行予定 (残り約${hours}時間${minutes}分)`
            );
          } else {
            setStatus(
              `Rate limit検出 - ${scheduledTime}に再実行予定 (残り約${minutes}分)`
            );
          }
        }
      } else if (event.payload.includes("Claude usage limit reached") ||
                 event.payload.includes("rate limit") ||
                 event.payload.includes("Rate limit")) {
        const resetMatch = event.payload.match(/reset at (\d+(?:am|pm))/i);
        const resetTime = resetMatch ? resetMatch[1] : "指定時刻";

        const timeMatch = event.payload.match(/残り約(\d+)分/);
        if (timeMatch) {
          const remainingMinutes = parseInt(timeMatch[1]);
          const hours = Math.floor(remainingMinutes / 60);
          const minutes = remainingMinutes % 60;

          if (hours > 0) {
            setStatus(
              `Rate limit検出 - ${resetTime}まで待機中 (残り約${hours}時間${minutes}分)`
            );
          } else {
            setStatus(
              `Rate limit検出 - ${resetTime}まで待機中 (残り約${minutes}分)`
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
        if (currentSettings.autoRetryOnRateLimit) {
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
              (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const countdownMinutes = Math.floor(
              (distance % (1000 * 60 * 60)) / (1000 * 60)
            );
            const countdownSeconds = Math.floor(
              (distance % (1000 * 60)) / 1000
            );
            setCountdown(
              `${countdownHours}時間 ${countdownMinutes}分 ${countdownSeconds}秒`
            );
          } else if (
            toolStatus.includes("Claude usage limit reached") ||
            toolStatus.includes("rate limit")
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
              (now.getTime() - (checkingStartTime || now.getTime())) / 1000
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
            (now.getTime() - checkingStartTime) / 1000
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
        const [hours, minutes] = currentSettings.executionTime.split(":").map(Number);
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
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (distance % (1000 * 60 * 60)) / (1000 * 60)
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
    currentSettings.executionTime,
    currentSettings.autoRetryOnRateLimit,
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
      setStatus(`エラー: ${appSettings.activeTab === "claude" ? "Claude Code" : "Codex"}で実行する命令を入力してください`);
      return;
    }

    if (currentSettings.useNewITermWindow && !currentSettings.targetDirectory.trim()) {
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

      if (appSettings.activeTab === "claude") {
        const claudeSettings = appSettings.claude;
        result = await invoke<ExecutionResult>("execute_claude_command", {
          executionTime: claudeSettings.executionTime,
          targetDirectory: claudeSettings.targetDirectory,
          claudeOptions: claudeSettings.options,
          claudeCommand: claudeSettings.command,
          autoRetryOnRateLimit: claudeSettings.autoRetryOnRateLimit,
          useNewWindow: claudeSettings.useNewITermWindow,
        });
      } else {
        const codexSettings = appSettings.codex;
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
      } else if (currentSettings.autoRetryOnRateLimit) {
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

  // タブ変更ハンドラー
  function handleTabChange(tab: ToolType) {
    setAppSettings({ ...appSettings, activeTab: tab });
    // ステータスをクリア
    setStatus("");
    setToolStatus("");
  }

  // Claude設定変更ハンドラー
  function handleClaudeSettingsChange(settings: ClaudeToolSettings) {
    setAppSettings({ ...appSettings, claude: settings });
  }

  // Codex設定変更ハンドラー
  function handleCodexSettingsChange(settings: CodexToolSettings) {
    setAppSettings({ ...appSettings, codex: settings });
  }

  // 共通設定変更ハンドラー
  function handleExecutionTimeChange(time: string) {
    if (appSettings.activeTab === "claude") {
      setAppSettings({
        ...appSettings,
        claude: { ...appSettings.claude, executionTime: time },
      });
    } else {
      setAppSettings({
        ...appSettings,
        codex: { ...appSettings.codex, executionTime: time },
      });
    }
  }

  function handleTargetDirectoryChange(dir: string) {
    if (appSettings.activeTab === "claude") {
      setAppSettings({
        ...appSettings,
        claude: { ...appSettings.claude, targetDirectory: dir },
      });
    } else {
      setAppSettings({
        ...appSettings,
        codex: { ...appSettings.codex, targetDirectory: dir },
      });
    }
  }

  function handleUseNewITermWindowChange(value: boolean) {
    if (appSettings.activeTab === "claude") {
      setAppSettings({
        ...appSettings,
        claude: { ...appSettings.claude, useNewITermWindow: value },
      });
    } else {
      setAppSettings({
        ...appSettings,
        codex: { ...appSettings.codex, useNewITermWindow: value },
      });
    }
  }

  function handleAutoRetryOnRateLimitChange(value: boolean) {
    if (appSettings.activeTab === "claude") {
      setAppSettings({
        ...appSettings,
        claude: { ...appSettings.claude, autoRetryOnRateLimit: value },
      });
    } else {
      setAppSettings({
        ...appSettings,
        codex: { ...appSettings.codex, autoRetryOnRateLimit: value },
      });
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header activeTab={appSettings.activeTab} />
      <div className="p-8">
        <TabSelector
          activeTab={appSettings.activeTab}
          onTabChange={handleTabChange}
          disabled={isRunning}
        />
        <div className="space-y-6">
          <CommonSettings
            executionTime={currentSettings.executionTime}
            targetDirectory={currentSettings.targetDirectory}
            useNewITermWindow={currentSettings.useNewITermWindow}
            autoRetryOnRateLimit={currentSettings.autoRetryOnRateLimit}
            iTermStatus={iTermStatus}
            checkingITerm={checkingITerm}
            isRunning={isRunning}
            onExecutionTimeChange={handleExecutionTimeChange}
            onTargetDirectoryChange={handleTargetDirectoryChange}
            onUseNewITermWindowChange={handleUseNewITermWindowChange}
            onAutoRetryOnRateLimitChange={handleAutoRetryOnRateLimitChange}
            onCheckITermStatus={checkITermStatus}
          />

          {/* ツール固有の設定 */}
          {appSettings.activeTab === "claude" ? (
            <ClaudeSettings
              settings={appSettings.claude}
              isRunning={isRunning}
              useNewITermWindow={appSettings.claude.useNewITermWindow}
              onSettingsChange={handleClaudeSettingsChange}
            />
          ) : (
            <CodexSettings
              settings={appSettings.codex}
              isRunning={isRunning}
              useNewITermWindow={appSettings.codex.useNewITermWindow}
              onSettingsChange={handleCodexSettingsChange}
            />
          )}

          <ExecutionPanel
            activeTab={appSettings.activeTab}
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
    </main>
  );
}

export default App;

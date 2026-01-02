import { CommonSettingsSection } from "./CommonSettingsSection";
import { SchedulePanel } from "./SchedulePanel";
import { ToolSettingsSection } from "./ToolSettingsSection";
import { ClaudeSettings } from "./ClaudeSettings";
import { CodexSettings } from "./CodexSettings";
import { GeminiSettings } from "./GeminiSettings";
import { ITermStatus, ToolType, ClaudeToolSettings, CodexToolSettings, GeminiToolSettings, TOOL_DISPLAY_NAMES } from "../types/tools";
import { RegisteredSchedule } from "../types/schedule";

interface SettingsPanelProps {
  // Common settings
  executionTime: string;
  targetDirectory: string;
  useNewITermWindow: boolean;
  autoRetryOnRateLimit: boolean;
  iTermStatus: ITermStatus | null;
  checkingITerm: boolean;
  isRunning: boolean;
  onExecutionTimeChange: (time: string) => void;
  onTargetDirectoryChange: (dir: string) => void;
  onUseNewITermWindowChange: (value: boolean) => void;
  onAutoRetryOnRateLimitChange: (value: boolean) => void;
  onCheckITermStatus: () => void;

  // Tool-specific settings
  activeTab: ToolType;
  claudeSettings: ClaudeToolSettings;
  codexSettings: CodexToolSettings;
  geminiSettings: GeminiToolSettings;
  onClaudeSettingsChange: (settings: ClaudeToolSettings) => void;
  onCodexSettingsChange: (settings: CodexToolSettings) => void;
  onGeminiSettingsChange: (settings: GeminiToolSettings) => void;

  // Schedule settings
  registeredSchedule: RegisteredSchedule | null;
  onScheduleRegister: (success: boolean) => void;
  onScheduleUnregister: (success: boolean) => void;
}

export function SettingsPanel({
  // Common settings
  executionTime,
  targetDirectory,
  useNewITermWindow,
  autoRetryOnRateLimit,
  iTermStatus,
  checkingITerm,
  isRunning,
  onExecutionTimeChange,
  onTargetDirectoryChange,
  onUseNewITermWindowChange,
  onAutoRetryOnRateLimitChange,
  onCheckITermStatus,

  // Tool-specific settings
  activeTab,
  claudeSettings,
  codexSettings,
  geminiSettings,
  onClaudeSettingsChange,
  onCodexSettingsChange,
  onGeminiSettingsChange,

  // Schedule settings
  registeredSchedule,
  onScheduleRegister,
  onScheduleUnregister,
}: SettingsPanelProps) {
  return (
    <div className="space-y-4">
      {/* 基本設定セクション */}
      <CommonSettingsSection
        executionTime={executionTime}
        targetDirectory={targetDirectory}
        useNewITermWindow={useNewITermWindow}
        autoRetryOnRateLimit={autoRetryOnRateLimit}
        iTermStatus={iTermStatus}
        checkingITerm={checkingITerm}
        isRunning={isRunning}
        onExecutionTimeChange={onExecutionTimeChange}
        onTargetDirectoryChange={onTargetDirectoryChange}
        onUseNewITermWindowChange={onUseNewITermWindowChange}
        onAutoRetryOnRateLimitChange={onAutoRetryOnRateLimitChange}
        onCheckITermStatus={onCheckITermStatus}
      />

      {/* ツール固有設定セクション */}
      {activeTab === "claude" && (
        <ToolSettingsSection
          toolName={TOOL_DISPLAY_NAMES["claude"]}
          toolIcon={
            <svg
              className="w-4 h-4 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        >
          <ClaudeSettings
            settings={claudeSettings}
            isRunning={isRunning}
            useNewITermWindow={useNewITermWindow}
            onSettingsChange={onClaudeSettingsChange}
          />
        </ToolSettingsSection>
      )}

      {activeTab === "codex" && (
        <ToolSettingsSection
          toolName={TOOL_DISPLAY_NAMES["codex"]}
          toolIcon={
            <svg
              className="w-4 h-4 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          }
        >
          <CodexSettings
            settings={codexSettings}
            isRunning={isRunning}
            useNewITermWindow={useNewITermWindow}
            onSettingsChange={onCodexSettingsChange}
          />
        </ToolSettingsSection>
      )}

      {activeTab === "gemini" && (
        <ToolSettingsSection
          toolName={TOOL_DISPLAY_NAMES["gemini"]}
          toolIcon={
            <svg
              className="w-4 h-4 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5.36 5.36l-.707.707M9 19.414l-.707-.707"
              />
            </svg>
          }
        >
          <GeminiSettings
            settings={geminiSettings}
            isRunning={isRunning}
            useNewITermWindow={useNewITermWindow}
            onSettingsChange={onGeminiSettingsChange}
          />
        </ToolSettingsSection>
      )}

      {/* スケジュール管理セクション */}
      <SchedulePanel
        tool={activeTab}
        executionTime={executionTime}
        targetDirectory={targetDirectory}
        isRunning={isRunning}
        registeredSchedule={registeredSchedule}
        onScheduleRegister={onScheduleRegister}
        onScheduleUnregister={onScheduleUnregister}
      />
    </div>
  );
}

// ツールタイプ定義
export type ToolType = "claude" | "codex";

// 共通設定インターフェース
export interface BaseToolSettings {
  executionTime: string; // HH:MM format
  targetDirectory: string;
  command: string;
  autoRetryOnRateLimit: boolean;
  useNewITermWindow: boolean;
}

// Claude固有設定
export interface ClaudeToolSettings extends BaseToolSettings {
  options: string; // "--model opus" など
}

// Codex固有設定
export interface CodexToolSettings extends BaseToolSettings {
  model: string; // "gpt-5-codex" など
  approvalMode: "suggest" | "auto" | "full-auto";
  enableSearch: boolean;
}

// アプリケーション全体の設定
export interface AppSettings {
  activeTab: ToolType;
  claude: ClaudeToolSettings;
  codex: CodexToolSettings;
}

// 実行結果インターフェース
export interface ExecutionResult {
  status: string;
  terminalOutput?: string;
  needsRetry?: boolean;
  retryTime?: string;
}

// iTermステータスインターフェース
export interface ITermStatus {
  is_installed: boolean;
  is_running: boolean;
}

// 実行フェーズ
export type ExecutionPhase = "waiting" | "checking" | null;

// デフォルト設定
export const DEFAULT_CLAUDE_SETTINGS: ClaudeToolSettings = {
  executionTime: "",
  targetDirectory: "",
  command: "",
  options: "--model opus",
  autoRetryOnRateLimit: false,
  useNewITermWindow: true,
};

export const DEFAULT_CODEX_SETTINGS: CodexToolSettings = {
  executionTime: "",
  targetDirectory: "",
  command: "",
  model: "codex-mini-latest",
  approvalMode: "suggest",
  enableSearch: false,
  autoRetryOnRateLimit: false,
  useNewITermWindow: true,
};

// ツール表示名
export const TOOL_DISPLAY_NAMES: Record<ToolType, string> = {
  claude: "Claude Code",
  codex: "Codex",
};

// ツールコマンド名
export const TOOL_COMMANDS: Record<ToolType, string> = {
  claude: "claude",
  codex: "codex",
};

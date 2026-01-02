// ツールタイプ定義
export type ToolType = "claude" | "codex" | "gemini";

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
  model: string; // "opus", "sonnet", "haiku"
  dangerouslySkipPermissions: boolean;
}

// Codex固有設定
export interface CodexToolSettings extends BaseToolSettings {
  model: string; // "gpt-5-codex" など
  approvalMode: "suggest" | "auto" | "full-auto";
  enableSearch: boolean;
}

// Gemini固有設定
export interface GeminiToolSettings extends BaseToolSettings {
  model: string; // "gemini-2.5-pro" など
  approvalMode: "default" | "auto_edit" | "yolo";
  outputFormat: "text" | "json";
  includeDirectories: string;
}

// アプリケーション全体の設定
export interface AppSettings {
  activeTab: ToolType;
  claude: ClaudeToolSettings;
  codex: CodexToolSettings;
  gemini: GeminiToolSettings;
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
  model: "claude-opus-4-5-20251101",
  dangerouslySkipPermissions: false,
  autoRetryOnRateLimit: false,
  useNewITermWindow: true,
};

export const DEFAULT_CODEX_SETTINGS: CodexToolSettings = {
  executionTime: "",
  targetDirectory: "",
  command: "",
  model: "gpt-5.2-codex",
  approvalMode: "suggest",
  enableSearch: false,
  autoRetryOnRateLimit: false,
  useNewITermWindow: true,
};

export const DEFAULT_GEMINI_SETTINGS: GeminiToolSettings = {
  executionTime: "",
  targetDirectory: "",
  command: "",
  model: "",
  approvalMode: "default",
  outputFormat: "text",
  includeDirectories: "",
  autoRetryOnRateLimit: false,
  useNewITermWindow: true,
};

// ツール表示名
export const TOOL_DISPLAY_NAMES: Record<ToolType, string> = {
  claude: "Claude Code",
  codex: "Codex",
  gemini: "Gemini CLI",
};

// ツールコマンド名
export const TOOL_COMMANDS: Record<ToolType, string> = {
  claude: "claude",
  codex: "codex",
  gemini: "gemini",
};

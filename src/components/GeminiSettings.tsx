import { GeminiToolSettings } from "../types/tools";
import { Select } from "./ui/Select";
import { Input, Textarea } from "./ui/Input";

interface GeminiSettingsProps {
  settings: GeminiToolSettings;
  isRunning: boolean;
  useNewITermWindow: boolean;
  launchOptionsError?: string;
  onSettingsChange: (settings: GeminiToolSettings) => void;
}

export function GeminiSettings({
  settings,
  isRunning,
  useNewITermWindow,
  launchOptionsError,
  onSettingsChange,
}: GeminiSettingsProps) {
  return (
    <div className="space-y-4">
      {/* Gemini固有設定（新規ウィンドウモードのみ） */}
      {useNewITermWindow && (
        <>
          {/* モデル表示 */}
          <div className="p-3 bg-surface-subtle dark:bg-surface-dark-subtle border border-surface-border dark:border-surface-dark-border rounded-lg">
            <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-dark-primary">
              モデル
            </label>
            <div className="text-sm text-text-primary dark:text-text-dark-primary font-medium">
              自動 (Gemini 3)
            </div>
            <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-secondary">
              Gemini CLIが最適なモデルを自動選択します (gemini-3-pro / gemini-3-flash)
            </p>
          </div>

          {/* 承認モード */}
          <div className="p-3 bg-surface-subtle dark:bg-surface-dark-muted rounded-lg border border-surface-border dark:border-surface-dark-border">
            <div className="text-sm font-medium text-text-primary dark:text-text-dark-primary mb-3">
              承認モード
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  type="radio"
                  id="geminiApprovalDefault"
                  name="geminiApprovalMode"
                  value="default"
                  checked={settings.approvalMode === "default"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "default" })
                  }
                  className="mt-1 w-4 h-4 text-primary-DEFAULT bg-surface-base border-surface-border focus:ring-2 focus:ring-primary-DEFAULT dark:bg-surface-dark-subtle dark:border-surface-dark-border"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="geminiApprovalDefault"
                    className="text-sm font-medium text-text-primary dark:text-text-dark-primary cursor-pointer"
                  >
                    デフォルト
                  </label>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    重要な操作時に確認を求めます
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <input
                  type="radio"
                  id="geminiApprovalAutoEdit"
                  name="geminiApprovalMode"
                  value="auto_edit"
                  checked={settings.approvalMode === "auto_edit"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "auto_edit" })
                  }
                  className="mt-1 w-4 h-4 text-primary-DEFAULT bg-surface-base border-surface-border focus:ring-2 focus:ring-primary-DEFAULT dark:bg-surface-dark-subtle dark:border-surface-dark-border"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="geminiApprovalAutoEdit"
                    className="text-sm font-medium text-text-primary dark:text-text-dark-primary cursor-pointer"
                  >
                    自動編集
                  </label>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    ファイル編集を自動的に承認します
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <input
                  type="radio"
                  id="geminiApprovalYolo"
                  name="geminiApprovalMode"
                  value="yolo"
                  checked={settings.approvalMode === "yolo"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "yolo" })
                  }
                  className="mt-1 w-4 h-4 text-primary-DEFAULT bg-surface-base border-surface-border focus:ring-2 focus:ring-primary-DEFAULT dark:bg-surface-dark-subtle dark:border-surface-dark-border"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="geminiApprovalYolo"
                    className="text-sm font-medium text-text-primary dark:text-text-dark-primary cursor-pointer"
                  >
                    YOLO
                  </label>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    すべての操作を自動承認（注意して使用）
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 追加ディレクトリ */}
          <Input
            label="追加ディレクトリ（カンマ区切り）"
            type="text"
            value={settings.includeDirectories}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                includeDirectories: e.target.value,
              })
            }
            disabled={isRunning}
            placeholder="例: ./docs,./specs"
          />

          {/* 出力形式 */}
          <Select
            label="出力形式"
            value={settings.outputFormat}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                outputFormat: e.target.value as "text" | "json",
              })
            }
            options={[
              { value: "text", label: "text" },
              { value: "json", label: "json" },
            ]}
            disabled={isRunning}
          />

          <Input
            label="起動オプション（追加）"
            type="text"
            value={settings.launchOptions}
            onChange={(e) =>
              onSettingsChange({ ...settings, launchOptions: e.target.value })
            }
            disabled={isRunning}
            placeholder="例: --verbose"
            error={launchOptionsError}
            helperText="モデル/承認/出力形式/追加ディレクトリは上の項目で指定してください"
          />
        </>
      )}

      {/* Geminiで実行する命令 */}
      <Textarea
        label="1回のみの予約実行"
        value={settings.command}
        onChange={(e) =>
          onSettingsChange({ ...settings, command: e.target.value })
        }
        disabled={isRunning}
        placeholder="例: コード構造を分析してください"
        rows={4}
      />
    </div>
  );
}

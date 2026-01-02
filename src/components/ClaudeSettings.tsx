import { ClaudeToolSettings } from "../types/tools";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Input";

interface ClaudeSettingsProps {
  settings: ClaudeToolSettings;
  isRunning: boolean;
  useNewITermWindow: boolean;
  onSettingsChange: (settings: ClaudeToolSettings) => void;
}

export function ClaudeSettings({
  settings,
  isRunning,
  useNewITermWindow,
  onSettingsChange,
}: ClaudeSettingsProps) {
  return (
    <div className="space-y-4">
      {/* Claude固有設定（新規ウィンドウモードのみ） */}
      {useNewITermWindow && (
        <>
          <Select
            label="モデル"
            value={settings.model}
            onChange={(e) =>
              onSettingsChange({ ...settings, model: e.target.value })
            }
            options={[
              { value: "claude-opus-4-5-20251101", label: "Opus 4.5" },
              { value: "claude-sonnet-4-5-20250929", label: "Sonnet 4.5" },
              { value: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
            ]}
            disabled={isRunning}
          />

          <div className="flex items-start gap-3 p-3 bg-surface-subtle dark:bg-surface-dark-muted rounded-lg border border-surface-border dark:border-surface-dark-border">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="skipPermissions"
                checked={settings.dangerouslySkipPermissions}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    dangerouslySkipPermissions: e.target.checked,
                  })
                }
                className="w-4 h-4 text-primary-DEFAULT bg-surface-base border-surface-border rounded focus:ring-2 focus:ring-primary-DEFAULT dark:bg-surface-dark-subtle dark:border-surface-dark-border transition-colors duration-200"
                disabled={isRunning}
              />
            </div>
            <div className="flex-1 text-sm">
              <label
                htmlFor="skipPermissions"
                className="font-medium text-text-primary dark:text-text-dark-primary cursor-pointer select-none"
              >
                権限チェックをスキップ（危険）
              </label>
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                Claude Codeの権限確認をバイパスします。注意して使用してください。
              </p>
            </div>
          </div>
        </>
      )}

      {/* Claude Codeで実行する命令 */}
      <Textarea
        label="Claude Code 命令"
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


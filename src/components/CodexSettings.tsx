import { CodexToolSettings } from "../types/tools";
import { Select } from "./ui/Select";
import { Input, Textarea } from "./ui/Input";

interface CodexSettingsProps {
  settings: CodexToolSettings;
  isRunning: boolean;
  useNewITermWindow: boolean;
  launchOptionsError?: string;
  onSettingsChange: (settings: CodexToolSettings) => void;
}

export function CodexSettings({
  settings,
  isRunning,
  useNewITermWindow,
  launchOptionsError,
  onSettingsChange,
}: CodexSettingsProps) {
  return (
    <div className="space-y-4">
      {/* Codex固有設定（新規ウィンドウモードのみ） */}
      {useNewITermWindow && (
        <>
          <Select
            label="モデル"
            value={settings.model}
            onChange={(e) =>
              onSettingsChange({ ...settings, model: e.target.value })
            }
            options={[
              { value: "gpt-5.2-codex", label: "gpt-5.2-codex" },
              { value: "gpt-5.2", label: "gpt-5.2" },
            ]}
            disabled={isRunning}
          />

          {/* 承認モード */}
          <div className="p-3 bg-surface-subtle dark:bg-surface-dark-muted rounded-lg border border-surface-border dark:border-surface-dark-border">
            <div className="text-sm font-medium text-text-primary dark:text-text-dark-primary mb-3">
              承認モード
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  type="radio"
                  id="approvalSuggest"
                  name="approvalMode"
                  value="suggest"
                  checked={settings.approvalMode === "suggest"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "suggest" })
                  }
                  className="mt-1 w-4 h-4 text-primary-DEFAULT bg-surface-base border-surface-border focus:ring-2 focus:ring-primary-DEFAULT dark:bg-surface-dark-subtle dark:border-surface-dark-border"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="approvalSuggest"
                    className="text-sm font-medium text-text-primary dark:text-text-dark-primary cursor-pointer"
                  >
                    提案（推奨）
                  </label>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    ワークスペース内の編集を許可、重要な操作には承認が必要
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <input
                  type="radio"
                  id="approvalAuto"
                  name="approvalMode"
                  value="auto"
                  checked={settings.approvalMode === "auto"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "auto" })
                  }
                  className="mt-1 w-4 h-4 text-primary-DEFAULT bg-surface-base border-surface-border focus:ring-2 focus:ring-primary-DEFAULT dark:bg-surface-dark-subtle dark:border-surface-dark-border"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="approvalAuto"
                    className="text-sm font-medium text-text-primary dark:text-text-dark-primary cursor-pointer"
                  >
                    自動
                  </label>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    信頼されていない操作のみ承認が必要
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <input
                  type="radio"
                  id="approvalFullAuto"
                  name="approvalMode"
                  value="full-auto"
                  checked={settings.approvalMode === "full-auto"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "full-auto" })
                  }
                  className="mt-1 w-4 h-4 text-primary-DEFAULT bg-surface-base border-surface-border focus:ring-2 focus:ring-primary-DEFAULT dark:bg-surface-dark-subtle dark:border-surface-dark-border"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="approvalFullAuto"
                    className="text-sm font-medium text-text-primary dark:text-text-dark-primary cursor-pointer"
                  >
                    完全自動
                  </label>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    失敗時のみ承認が必要（注意して使用）
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Web検索 */}
          <div className="flex items-start gap-3 p-3 bg-surface-subtle dark:bg-surface-dark-muted rounded-lg border border-surface-border dark:border-surface-dark-border">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="enableSearch"
                checked={settings.enableSearch}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    enableSearch: e.target.checked,
                  })
                }
                className="w-4 h-4 text-primary-DEFAULT bg-surface-base border-surface-border rounded focus:ring-2 focus:ring-primary-DEFAULT dark:bg-surface-dark-subtle dark:border-surface-dark-border transition-colors duration-200"
                disabled={isRunning}
              />
            </div>
            <div className="flex-1 text-sm">
              <label
                htmlFor="enableSearch"
                className="font-medium text-text-primary dark:text-text-dark-primary cursor-pointer select-none"
              >
                Web検索を有効化
              </label>
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                Codexがコンテキスト収集にインターネット検索を使用できるようにします
              </p>
            </div>
          </div>

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
            helperText="モデル/承認/検索は上の項目で指定してください"
          />
        </>
      )}

      {/* Codexで実行する命令 */}
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

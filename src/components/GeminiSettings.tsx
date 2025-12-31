import { GeminiToolSettings } from "../types/tools";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";

interface GeminiSettingsProps {
  settings: GeminiToolSettings;
  isRunning: boolean;
  useNewITermWindow: boolean;
  onSettingsChange: (settings: GeminiToolSettings) => void;
}

export function GeminiSettings({
  settings,
  isRunning,
  useNewITermWindow,
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
              Model
            </label>
            <div className="text-sm text-text-primary dark:text-text-dark-primary font-medium">
              Auto (Gemini 3)
            </div>
            <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-secondary">
              Gemini CLI automatically selects the optimal model (gemini-3-pro / gemini-3-flash)
            </p>
          </div>

          {/* 承認モード */}
          <div className="p-3 bg-surface-subtle dark:bg-surface-dark-muted rounded-lg border border-surface-border dark:border-surface-dark-border">
            <div className="text-sm font-medium text-text-primary dark:text-text-dark-primary mb-3">
              Approval Mode
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
                    Default
                  </label>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    Ask for confirmation on critical actions
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
                    Auto Edit
                  </label>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    Automatically approve file edits
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
                    Automatically approve ALL actions (Use with caution)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* コンテキスト設定 */}
          <div className="p-3 bg-surface-subtle dark:bg-surface-dark-muted rounded-lg border border-surface-border dark:border-surface-dark-border">
            <div className="text-sm font-medium text-text-primary dark:text-text-dark-primary mb-3">
              Context Settings
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="includeAllFiles"
                    checked={settings.includeAllFiles}
                    onChange={(e) =>
                      onSettingsChange({
                        ...settings,
                        includeAllFiles: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-DEFAULT bg-surface-base border-surface-border rounded focus:ring-2 focus:ring-primary-DEFAULT dark:bg-surface-dark-subtle dark:border-surface-dark-border transition-colors duration-200"
                    disabled={isRunning}
                  />
                </div>
                <div className="ml-2 text-sm">
                  <label
                    htmlFor="includeAllFiles"
                    className="font-medium text-text-primary dark:text-text-dark-primary cursor-pointer select-none"
                  >
                    Include All Files
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 追加ディレクトリ */}
          <Input
            label="Additional Directories (comma separated)"
            type="text"
            value={settings.includeDirectories}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                includeDirectories: e.target.value,
              })
            }
            disabled={isRunning}
            placeholder="e.g.: ./docs,./specs"
          />

          {/* 出力形式 */}
          <Select
            label="Output Format"
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
        </>
      )}

      {/* Geminiで実行する命令 */}
      <Input
        label="Gemini Instruction"
        type="text"
        value={settings.command}
        onChange={(e) =>
          onSettingsChange({ ...settings, command: e.target.value })
        }
        disabled={isRunning}
        placeholder="e.g.: analyze the code structure"
      />
    </div>
  );
}


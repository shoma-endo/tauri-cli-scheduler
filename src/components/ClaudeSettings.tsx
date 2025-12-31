import { ClaudeToolSettings } from "../types/tools";

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
    <div className="space-y-6">
      {/* Claude固有設定（新規ウィンドウモードのみ） */}
      {useNewITermWindow && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            モデル
          </label>
          <select
            value={settings.model}
            onChange={(e) =>
              onSettingsChange({ ...settings, model: e.target.value })
            }
            className="w-full px-4 py-3 text-sm bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isRunning}
          >
            <option value="claude-opus-4-5-20251101">Opus 4.5</option>
            <option value="claude-sonnet-4-5-20250929">Sonnet 4.5</option>
            <option value="claude-haiku-4-5-20251001">Haiku 4.5</option>
          </select>

          <div className="mt-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dangerouslySkipPermissions}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    dangerouslySkipPermissions: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={isRunning}
              />
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                権限確認をスキップ（危険）
              </span>
            </label>
            <p className="ml-6 text-xs text-gray-500 dark:text-gray-400 mt-1">
              Claude Codeの権限確認を省略します（安全性に注意）
            </p>
          </div>
        </div>
      )}

      {/* Claude Codeで実行する命令 */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Claude Codeで実行する命令
        </label>
        <div className="relative">
          <input
            type="text"
            value={settings.command}
            onChange={(e) =>
              onSettingsChange({ ...settings, command: e.target.value })
            }
            className="w-full px-4 py-3 pr-12 text-sm bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isRunning}
          />
          <button
            type="button"
            onClick={() => onSettingsChange({ ...settings, command: "" })}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isRunning}
            title="クリア"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

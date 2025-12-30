import { CodexToolSettings } from "../types/tools";

interface CodexSettingsProps {
  settings: CodexToolSettings;
  isRunning: boolean;
  useNewITermWindow: boolean;
  onSettingsChange: (settings: CodexToolSettings) => void;
}

export function CodexSettings({
  settings,
  isRunning,
  useNewITermWindow,
  onSettingsChange,
}: CodexSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Codex固有設定（新規ウィンドウモードのみ） */}
      {useNewITermWindow && (
        <>
          {/* モデル選択 */}
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
              <option value="gpt-5.2-codex">gpt-5.2-codex</option>
              <option value="gpt-5.2">gpt-5.2</option>
            </select>
          </div>

          {/* 承認モード */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              承認モード
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="approvalSuggest"
                  name="approvalMode"
                  value="suggest"
                  checked={settings.approvalMode === "suggest"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "suggest" })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="approvalSuggest"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Suggest (推奨)
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    すべての変更を確認してから適用
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="approvalAuto"
                  name="approvalMode"
                  value="auto"
                  checked={settings.approvalMode === "auto"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "auto" })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="approvalAuto"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Auto
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    安全な変更は自動適用、リスクのある変更は確認
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="approvalFullAuto"
                  name="approvalMode"
                  value="full-auto"
                  checked={settings.approvalMode === "full-auto"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "full-auto" })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="approvalFullAuto"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Full Auto
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    すべての変更を自動適用（注意して使用）
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Web検索 */}
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableSearch}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    enableSearch: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={isRunning}
              />
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                Web検索を有効化
              </span>
            </label>
            <p className="ml-6 text-xs text-gray-500 dark:text-gray-400 mt-1">
              Codexがインターネット検索を使用してコンテキストを収集します
            </p>
          </div>
        </>
      )}

      {/* Codexで実行する命令 */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Codexで実行する命令
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

import { GeminiToolSettings } from "../types/tools";

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
    <div className="space-y-6">
      {/* Gemini固有設定（新規ウィンドウモードのみ） */}
      {useNewITermWindow && (
        <>
          {/* モデル表示 */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              モデル
            </label>
            <div className="w-full px-4 py-3 text-sm bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
              Auto (Gemini 3)
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Gemini CLIが最適なモデル（gemini-3-pro / gemini-3-flash）を選択します
            </p>
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
                  id="geminiApprovalDefault"
                  name="geminiApprovalMode"
                  value="default"
                  checked={settings.approvalMode === "default"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "default" })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="geminiApprovalDefault"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Default
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    重要操作は都度確認します
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="geminiApprovalAutoEdit"
                  name="geminiApprovalMode"
                  value="auto_edit"
                  checked={settings.approvalMode === "auto_edit"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "auto_edit" })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="geminiApprovalAutoEdit"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Auto Edit
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ファイル編集を自動承認します
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="geminiApprovalYolo"
                  name="geminiApprovalMode"
                  value="yolo"
                  checked={settings.approvalMode === "yolo"}
                  onChange={() =>
                    onSettingsChange({ ...settings, approvalMode: "yolo" })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="geminiApprovalYolo"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    YOLO
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    すべての操作を自動承認します（注意）
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* コンテキスト設定 */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              コンテキスト設定
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.includeAllFiles}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      includeAllFiles: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isRunning}
                />
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                  全ファイルをコンテキストに含める
                </span>
              </label>
              <div>
                <label className="block mb-1 text-xs text-gray-500 dark:text-gray-400">
                  追加ディレクトリ（カンマ区切り）
                </label>
                <input
                  type="text"
                  value={settings.includeDirectories}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      includeDirectories: e.target.value,
                    })
                  }
                  placeholder="examples: ./docs,./specs"
                  className="w-full px-4 py-3 text-sm bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>

          {/* 出力形式 */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              出力形式
            </label>
            <select
              value={settings.outputFormat}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  outputFormat: e.target.value as "text" | "json",
                })
              }
              className="w-full px-4 py-3 text-sm bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isRunning}
            >
              <option value="text">text</option>
              <option value="json">json</option>
            </select>
          </div>
        </>
      )}

      {/* Geminiで実行する命令 */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Geminiで実行する命令
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

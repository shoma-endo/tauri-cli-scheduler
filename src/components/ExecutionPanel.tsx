import { ITermStatus, ToolType, TOOL_DISPLAY_NAMES } from "../types/tools";

interface ExecutionPanelProps {
  activeTab: ToolType;
  isRunning: boolean;
  countdown: string;
  status: string;
  toolStatus: string;
  iTermStatus: ITermStatus | null;
  onStart: () => void;
  onStop: () => void;
}

export function ExecutionPanel({
  activeTab,
  isRunning,
  countdown,
  status,
  toolStatus,
  iTermStatus,
  onStart,
  onStop,
}: ExecutionPanelProps) {
  const toolName = TOOL_DISPLAY_NAMES[activeTab];

  return (
    <div className="space-y-4">
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            プライバシーとセキュリティ &gt; アクセシビリティ
            にて、このアプリを追加し有効化してください
          </span>
        </div>
        {!isRunning ? (
          <button
            type="button"
            onClick={onStart}
            className="w-full px-6 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!iTermStatus?.is_installed}
          >
            <svg
              className="w-5 h-5 inline-block mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            開始
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            className="w-full px-6 py-3 font-medium text-white bg-gradient-to-r from-red-500 to-red-800 rounded-2xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5 inline-block mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            停止
          </button>
        )}
      </div>

      {isRunning && countdown && (
        <div className="mt-6 p-4 text-center bg-blue-50 dark:bg-blue-900 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
            残り時間: {countdown}
          </p>
        </div>
      )}

      {status && (
        <div
          className={`mt-4 p-4 rounded-lg border-2 transition-all duration-300 ${
            status.includes("エラー")
              ? "text-red-700 bg-red-50 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
              : status.includes("完了")
                ? "text-green-700 bg-green-50 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                : "text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
          }`}
        >
          <p className="font-medium">ステータス: {status}</p>
        </div>
      )}

      {toolStatus && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            {toolName} Status
          </label>
          <div className="p-4 bg-black text-gray-100 rounded-lg font-mono text-xs overflow-auto max-h-48 border-2 border-gray-700 shadow-inner">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {toolStatus}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

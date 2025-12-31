import { open } from "@tauri-apps/plugin-dialog";
import { ITermStatus } from "../types/tools";

interface CommonSettingsSectionProps {
  executionTime: string;
  targetDirectory: string;
  useNewITermWindow: boolean;
  autoRetryOnRateLimit: boolean;
  iTermStatus: ITermStatus | null;
  checkingITerm: boolean;
  isRunning: boolean;
  onExecutionTimeChange: (time: string) => void;
  onTargetDirectoryChange: (dir: string) => void;
  onUseNewITermWindowChange: (value: boolean) => void;
  onAutoRetryOnRateLimitChange: (value: boolean) => void;
  onCheckITermStatus: () => void;
}

export function CommonSettingsSection({
  executionTime,
  targetDirectory,
  useNewITermWindow,
  autoRetryOnRateLimit,
  iTermStatus,
  checkingITerm,
  isRunning,
  onExecutionTimeChange,
  onTargetDirectoryChange,
  onUseNewITermWindowChange,
  onAutoRetryOnRateLimitChange,
  onCheckITermStatus,
}: CommonSettingsSectionProps) {
  function setNextHour01() {
    const [currentHours] = executionTime.split(":").map(Number);
    const nextHour = (currentHours + 1) % 24;
    const hours = String(nextHour).padStart(2, "0");
    onExecutionTimeChange(`${hours}:01`);
  }

  async function selectDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: targetDirectory,
        title: "実行対象ディレクトリを選択",
      });

      if (selected && typeof selected === "string") {
        onTargetDirectoryChange(selected);
      }
    } catch (error) {
      console.error("Directory selection error:", error);
    }
  }

  return (
    <div className="space-y-4">
      {/* 実行時刻設定セクション */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            実行時刻設定
          </h3>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="time"
            value={executionTime}
            onChange={(e) => onExecutionTimeChange(e.target.value)}
            className="w-32 px-4 py-3 text-base font-medium bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isRunning}
          />
          <button
            type="button"
            onClick={setNextHour01}
            className="px-6 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isRunning}
          >
            次の{" "}
            {String((parseInt(executionTime.split(":")[0]) + 1) % 24).padStart(
              2,
              "0",
            )}
            :01分
          </button>
        </div>
      </div>

      {/* ディレクトリ設定セクション（新規ウィンドウ利用時のみ） */}
      {useNewITermWindow && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              実行対象ディレクトリ
            </h3>
            <span className="ml-2 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
              新規ウィンドウ利用時のみ
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetDirectory}
              onChange={(e) => onTargetDirectoryChange(e.target.value)}
              className="flex-1 px-4 py-3 text-sm bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isRunning}
              readOnly
            />
            <button
              type="button"
              onClick={selectDirectory}
              className="px-6 py-3 font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isRunning}
            >
              フォルダ選択
            </button>
          </div>
        </div>
      )}

      {/* iTerm 設定セクション */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5.36 5.36l-.707.707M9 19.414l-.707-.707"
            />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            iTerm ステータス
          </h3>
        </div>

        {iTermStatus ? (
          iTermStatus.is_installed ? (
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  iTermStatus.is_running ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {iTermStatus.is_running ? "起動中" : "未起動"}
              </span>
              <button
                type="button"
                onClick={onCheckITermStatus}
                className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRunning || checkingITerm}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                インストールされていません
              </span>
              <button
                type="button"
                onClick={onCheckITermStatus}
                className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRunning || checkingITerm}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          )
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              確認中...
            </span>
          </div>
        )}
      </div>

      {/* ウィンドウ・レート制限設定セクション */}
      <div className="grid grid-cols-2 gap-4">
        {/* iTerm ウィンドウ設定 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              ウィンドウ設定
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="useNewWindow"
                name="windowOption"
                value="new"
                checked={useNewITermWindow}
                onChange={() => onUseNewITermWindowChange(true)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={isRunning}
              />
              <label
                htmlFor="useNewWindow"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                新規ウィンドウ利用
              </label>
            </div>
            <div className="flex items-start">
              <input
                type="radio"
                id="useExistingWindow"
                name="windowOption"
                value="existing"
                checked={!useNewITermWindow}
                onChange={() => onUseNewITermWindowChange(false)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mt-1"
                disabled={isRunning}
              />
              <div className="ml-2">
                <label
                  htmlFor="useExistingWindow"
                  className="text-sm font-medium text-gray-900 dark:text-white"
                >
                  既存ウィンドウ利用
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ※CLIを実行状態に保持してください
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rate limit オプション */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Rate Limit対応
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="autoRetryEnabled"
                name="rateLimitOption"
                value="auto"
                checked={autoRetryOnRateLimit}
                onChange={() => onAutoRetryOnRateLimitChange(true)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={isRunning}
              />
              <label
                htmlFor="autoRetryEnabled"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                自動リトライ
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="autoRetryDisabled"
                name="rateLimitOption"
                value="stop"
                checked={!autoRetryOnRateLimit}
                onChange={() => onAutoRetryOnRateLimitChange(false)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={isRunning}
              />
              <label
                htmlFor="autoRetryDisabled"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                終了する
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

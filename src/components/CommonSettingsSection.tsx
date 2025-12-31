import { open } from "@tauri-apps/plugin-dialog";
import { ITermStatus } from "../types/tools";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";

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
      <Card>
        <CardHeader>
          <svg
            className="w-5 h-5 text-primary-DEFAULT"
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
          <CardTitle>execution time settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-center">
            <div className="w-32">
              <Input
                type="time"
                value={executionTime}
                onChange={(e) => onExecutionTimeChange(e.target.value)}
                disabled={isRunning}
              />
            </div>
            <Button
              variant="primary"
              onClick={setNextHour01}
              disabled={isRunning}
            >
              Next{" "}
              {String((parseInt(executionTime.split(":")[0]) + 1) % 24).padStart(
                2,
                "0",
              )}
              :01
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ディレクトリ設定セクション（新規ウィンドウ利用時のみ） */}
      {useNewITermWindow && (
        <Card>
          <CardHeader>
            <svg
              className="w-5 h-5 text-primary-DEFAULT"
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
            <CardTitle>Execution Target Directory</CardTitle>
            <Badge variant="warning">
              New Window Mode Only
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  value={targetDirectory}
                  onChange={(e) => onTargetDirectoryChange(e.target.value)}
                  disabled={isRunning}
                  readOnly
                />
              </div>
              <Button
                variant="secondary"
                onClick={selectDirectory}
                disabled={isRunning}
              >
                Select Folder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* iTerm 設定セクション */}
      <Card>
        <CardHeader>
          <svg
            className="w-5 h-5 text-primary-DEFAULT"
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
          <CardTitle>iTerm Status</CardTitle>
        </CardHeader>
        <CardContent>
          {iTermStatus ? (
            iTermStatus.is_installed ? (
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    iTermStatus.is_running ? "bg-status-success" : "bg-text-muted"
                  }`}
                ></div>
                <span className="text-sm text-text-primary dark:text-text-dark-primary">
                  {iTermStatus.is_running ? "Running" : "Not Running"}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onCheckITermStatus}
                  className="rounded-full w-8 h-8 p-0 flex items-center justify-center ml-2"
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
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-status-error"></div>
                <span className="text-sm text-status-error font-medium">
                  Not Installed
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onCheckITermStatus}
                  className="rounded-full w-8 h-8 p-0 flex items-center justify-center ml-2"
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
                </Button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-text-muted animate-pulse"></div>
              <span className="text-sm text-text-secondary dark:text-text-dark-secondary">
                Checking...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ウィンドウ・レート制限設定セクション */}
      <div className="grid grid-cols-2 gap-4">
        {/* iTerm ウィンドウ設定 */}
        <Card>
          <CardHeader>
            <svg
              className="w-5 h-5 text-primary-DEFAULT"
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
            <CardTitle>Window Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="useNewWindow"
                  name="windowOption"
                  value="new"
                  checked={useNewITermWindow}
                  onChange={() => onUseNewITermWindowChange(true)}
                  className="w-4 h-4 text-primary-600 bg-surface-subtle border-surface-border focus:ring-primary-DEFAULT focus:ring-2"
                  disabled={isRunning}
                />
                <label
                  htmlFor="useNewWindow"
                  className="ml-2 text-sm font-medium text-text-primary dark:text-text-dark-primary"
                >
                  Use New Window
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
                  className="w-4 h-4 text-primary-600 bg-surface-subtle border-surface-border focus:ring-primary-DEFAULT focus:ring-2 mt-1"
                  disabled={isRunning}
                />
                <div className="ml-2">
                  <label
                    htmlFor="useExistingWindow"
                    className="text-sm font-medium text-text-primary dark:text-text-dark-primary"
                  >
                    Use Existing Window
                  </label>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">
                    * Requires active CLI session
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate limit オプション */}
        <Card>
          <CardHeader>
            <svg
              className="w-5 h-5 text-primary-DEFAULT"
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
            <CardTitle>Rate Limit Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="autoRetryEnabled"
                  name="rateLimitOption"
                  value="auto"
                  checked={autoRetryOnRateLimit}
                  onChange={() => onAutoRetryOnRateLimitChange(true)}
                  className="w-4 h-4 text-primary-600 bg-surface-subtle border-surface-border focus:ring-primary-DEFAULT focus:ring-2"
                  disabled={isRunning}
                />
                <label
                  htmlFor="autoRetryEnabled"
                  className="ml-2 text-sm font-medium text-text-primary dark:text-text-dark-primary"
                >
                  Auto Retry
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
                  className="w-4 h-4 text-primary-600 bg-surface-subtle border-surface-border focus:ring-primary-DEFAULT focus:ring-2"
                  disabled={isRunning}
                />
                <label
                  htmlFor="autoRetryDisabled"
                  className="ml-2 text-sm font-medium text-text-primary dark:text-text-dark-primary"
                >
                  Abort
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

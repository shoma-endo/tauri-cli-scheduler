import { ITermStatus, ToolType, TOOL_DISPLAY_NAMES } from "../types/tools";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";

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

  // ステータスのバリアントを決定
  const getStatusVariant = (): "success" | "error" | "warning" | "info" => {
    if (status.includes("エラー")) return "error";
    if (status.includes("完了")) return "success";
    if (status.includes("Rate limit")) return "warning";
    return "info";
  };

  return (
    <div className="space-y-4">
      {/* プライバシーバナー */}
      <div className="pt-4 px-4 py-3 bg-surface-base dark:bg-surface-dark-base rounded-lg border-2 border-surface-border dark:border-surface-dark-border shadow-card dark:shadow-sm flex items-center gap-2">
        <svg
          className="w-5 h-5 text-primary-DEFAULT flex-shrink-0"
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
        <span className="text-sm text-text-secondary dark:text-text-dark-secondary">
          プライバシーとセキュリティ &gt; アクセシビリティ
          にて、このアプリを追加し有効化してください
        </span>
      </div>

      {/* 実行制御ボタン */}
      <div>
        {!isRunning ? (
          <Button
            variant="primary"
            size="lg"
            onClick={onStart}
            disabled={!iTermStatus?.is_installed}
            className="w-full flex items-center justify-center gap-2"
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>開始</span>
          </Button>
        ) : (
          <Button
            variant="danger"
            size="lg"
            onClick={onStop}
            className="w-full flex items-center justify-center gap-2"
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
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            <span>停止</span>
          </Button>
        )}
      </div>

      {/* カウントダウン表示 */}
      {isRunning && countdown && (
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-lg font-semibold text-primary-DEFAULT dark:text-blue-300">
              残り時間: {countdown}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ステータス表示 */}
      {status && (
        <Card>
          <CardContent className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-text-primary dark:text-text-dark-primary">
                {status}
              </p>
            </div>
            <Badge variant={getStatusVariant()} size="sm">
              {status.includes("エラー")
                ? "エラー"
                : status.includes("完了")
                  ? "完了"
                  : status.includes("Rate limit")
                    ? "待機中"
                    : "実行中"}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* ターミナル出力 */}
      {toolStatus && (
        <Card>
          <CardContent className="pt-0">
            <label className="block mb-3 text-sm font-medium text-text-primary dark:text-text-dark-primary">
              {toolName} ターミナル出力
            </label>
            <div className="p-4 bg-surface-dark-base text-gray-100 dark:text-gray-200 rounded-lg font-mono text-xs overflow-auto max-h-48 border-2 border-surface-border dark:border-surface-dark-border shadow-inner">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {toolStatus}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


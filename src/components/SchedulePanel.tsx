import { ScheduleManager } from "./ScheduleManager";
import { RegisteredSchedule } from "../types/schedule";
import { ToolType } from "../types/tools";

interface SchedulePanelProps {
  tool: ToolType;
  executionTime: string;
  targetDirectory: string;
  isRunning: boolean;
  registeredSchedule: RegisteredSchedule | null;
  onScheduleRegister: (success: boolean) => void;
  onScheduleUnregister: (success: boolean) => void;
}

export function SchedulePanel({
  tool,
  executionTime,
  targetDirectory,
  isRunning,
  registeredSchedule,
  onScheduleRegister,
  onScheduleUnregister,
}: SchedulePanelProps) {
  return (
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
            d="M8 7V3m8 4V3m-9 8h10m5 0a2 2 0 01-2 2H7a2 2 0 01-2-2m14 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2z"
          />
        </svg>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          スケジュール管理
        </h3>
        {registeredSchedule && (
          <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded font-medium">
            登録済み
          </span>
        )}
      </div>

      <ScheduleManager
        tool={tool}
        executionTime={executionTime}
        targetDirectory={targetDirectory}
        isRunning={isRunning}
        registeredSchedule={registeredSchedule}
        onScheduleRegister={onScheduleRegister}
        onScheduleUnregister={onScheduleUnregister}
      />
    </div>
  );
}

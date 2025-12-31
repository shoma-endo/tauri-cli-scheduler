import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RegisteredSchedule, ScheduleResult } from "../types/schedule";

interface ScheduleManagerProps {
  tool: string;
  executionTime: string;
  targetDirectory: string;
  isRunning: boolean;
  registeredSchedule: RegisteredSchedule | null;
  onScheduleRegister: (success: boolean) => void;
  onScheduleUnregister: (success: boolean) => void;
}

export function ScheduleManager({
  tool,
  executionTime,
  targetDirectory,
  isRunning,
  registeredSchedule,
  onScheduleRegister,
  onScheduleUnregister,
}: ScheduleManagerProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegisterSchedule = async () => {
    if (!targetDirectory.trim()) {
      setMessage("エラー: 実行対象ディレクトリを指定してください");
      return;
    }

    setIsRegistering(true);
    setMessage("スケジュール登録中...");

    try {
      const result = await invoke<ScheduleResult>("register_schedule", {
        tool,
        executionTime,
        targetDirectory,
        commandArgs: "",
      });

      setMessage(result.message);
      if (result.success) {
        onScheduleRegister(true);
      } else {
        onScheduleRegister(false);
      }
    } catch (error) {
      const errorMsg = `エラー: ${error}`;
      setMessage(errorMsg);
      onScheduleRegister(false);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregisterSchedule = async () => {
    setIsUnregistering(true);
    setMessage("スケジュール削除中...");

    try {
      const result = await invoke<ScheduleResult>("unregister_schedule", {
        tool,
      });

      setMessage(result.message);
      if (result.success) {
        onScheduleUnregister(true);
      } else {
        onScheduleUnregister(false);
      }
    } catch (error) {
      const errorMsg = `エラー: ${error}`;
      setMessage(errorMsg);
      onScheduleUnregister(false);
    } finally {
      setIsUnregistering(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">
        スケジュール管理
      </h3>

      <div className="space-y-4">
        {registeredSchedule && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
            <p className="text-green-800 dark:text-green-200 text-sm">
              ✓ スケジュール登録済み：毎日 {registeredSchedule.execution_time}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {!registeredSchedule ? (
            <button
              onClick={handleRegisterSchedule}
              disabled={isRunning || isRegistering || !targetDirectory.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
            >
              {isRegistering ? "登録中..." : "スケジュール登録"}
            </button>
          ) : (
            <button
              onClick={handleUnregisterSchedule}
              disabled={isRunning || isUnregistering}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
            >
              {isUnregistering ? "削除中..." : "スケジュール削除"}
            </button>
          )}
        </div>

        {message && (
          <div
            className={`text-sm p-3 rounded ${
              message.includes("エラー")
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200"
                : message.includes("成功")
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200"
                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

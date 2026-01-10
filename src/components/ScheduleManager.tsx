import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RegisteredSchedule, ScheduleResult, ScheduleType } from "../types/schedule";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface ScheduleManagerProps {
  tool: string;
  executionTime: string;
  targetDirectory: string;
  isRunning: boolean;
  registeredSchedule: RegisteredSchedule | null;
  onScheduleRegister: (success: boolean) => void;
  onScheduleUnregister: (success: boolean) => void;
}

const getTodayDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [intervalValue, setIntervalValue] = useState<number>(3);
  const [startDate, setStartDate] = useState<string>(getTodayDateString());

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
        scheduleType,
        intervalValue: scheduleType === 'interval' ? intervalValue : undefined,
        startDate: scheduleType !== 'daily' ? startDate : undefined,
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

  const getScheduleDescription = (schedule: RegisteredSchedule) => {
    const time = schedule.execution_time;
    switch (schedule.schedule_type) {
      case 'daily':
        return `毎日 ${time}`;
      case 'weekly':
        return `毎週 (${schedule.start_date} 開始) ${time}`;
      case 'interval':
        return `${schedule.interval_value}日ごと (${schedule.start_date} 開始) ${time}`;
      default:
        return `毎日 ${time}`;
    }
  };

  return (
    <div className="space-y-4">
        {registeredSchedule && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
            <p className="text-green-800 dark:text-green-200 text-sm">
              ✓ スケジュール登録済み：{getScheduleDescription(registeredSchedule)}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {!registeredSchedule && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  繰り返しの種類
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-primary-DEFAULT"
                      name={`scheduleType-${tool}`}
                      value="daily"
                      checked={scheduleType === 'daily'}
                      onChange={() => setScheduleType('daily')}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">毎日</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-primary-DEFAULT"
                      name={`scheduleType-${tool}`}
                      value="weekly"
                      checked={scheduleType === 'weekly'}
                      onChange={() => setScheduleType('weekly')}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">毎週</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-primary-DEFAULT"
                      name={`scheduleType-${tool}`}
                      value="interval"
                      checked={scheduleType === 'interval'}
                      onChange={() => setScheduleType('interval')}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">指定間隔</span>
                  </label>
                </div>
              </div>

              {scheduleType === 'interval' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    実行間隔（日）
                  </label>
                  <Input
                    type="number"
                    min={2}
                    value={intervalValue}
                    onChange={(e) => setIntervalValue(parseInt(e.target.value) || 2)}
                    className="w-full"
                  />
                </div>
              )}

              {scheduleType !== 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    開始日（基準日）
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {scheduleType === 'weekly' 
                      ? "※指定した日付の曜日で毎週実行されます" 
                      : "※この日付を基準に実行判定を行います"}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {!registeredSchedule ? (
              <Button
                variant="primary"
                onClick={handleRegisterSchedule}
                disabled={isRunning || isRegistering || !targetDirectory.trim()}
                isLoading={isRegistering}
                className="flex-1"
              >
                スケジュール登録
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleUnregisterSchedule}
                disabled={isRunning || isUnregistering}
                isLoading={isUnregistering}
                className="flex-1"
              >
                スケジュール削除
              </Button>
            )}
          </div>
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
  );
}

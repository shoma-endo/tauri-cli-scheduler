import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RegisteredSchedule, ScheduleHistoryEntry, ScheduleResult, ScheduleType } from "../types/schedule";
import { Button } from "./ui/Button";
import { Input, Textarea } from "./ui/Input";
import { Select } from "./ui/Select";

interface ScheduleManagerProps {
  tool: string;
  executionTime: string;
  targetDirectory: string;
  isRunning: boolean;
  registeredSchedules: RegisteredSchedule[];
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
  registeredSchedules,
  onScheduleRegister,
  onScheduleUnregister,
}: ScheduleManagerProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [intervalValue, setIntervalValue] = useState<number>(3);
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [scheduleTime, setScheduleTime] = useState<string>(executionTime);
  const [scheduleTitle, setScheduleTitle] = useState<string>("");
  const [scheduleCommand, setScheduleCommand] = useState<string>("");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editScheduleType, setEditScheduleType] = useState<ScheduleType>("daily");
  const [editIntervalValue, setEditIntervalValue] = useState<number>(3);
  const [editStartDate, setEditStartDate] = useState<string>(getTodayDateString());
  const [editScheduleTime, setEditScheduleTime] = useState<string>(executionTime);
  const [editScheduleCommand, setEditScheduleCommand] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [historyScheduleId, setHistoryScheduleId] = useState<string>("");
  const [historyEntries, setHistoryEntries] = useState<ScheduleHistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    setScheduleTime(executionTime);
    setEditScheduleTime(executionTime);
  }, [executionTime]);

  const sortedSchedules = useMemo(() => {
    return [...registeredSchedules].sort((a, b) => {
      const timeOrder = a.execution_time.localeCompare(b.execution_time);
      if (timeOrder !== 0) return timeOrder;
      return a.schedule_type.localeCompare(b.schedule_type);
    });
  }, [registeredSchedules]);

  useEffect(() => {
    if (registeredSchedules.length === 0) {
      setHistoryScheduleId("");
      setHistoryEntries([]);
      return;
    }
    if (
      !historyScheduleId ||
      !registeredSchedules.some((schedule) => schedule.schedule_id === historyScheduleId)
    ) {
      setHistoryScheduleId(registeredSchedules[0].schedule_id);
    }
  }, [registeredSchedules, historyScheduleId]);

  useEffect(() => {
    if (!historyScheduleId) {
      setHistoryEntries([]);
      return;
    }

    let cancelled = false;
    setIsHistoryLoading(true);
    invoke<ScheduleHistoryEntry[]>("get_schedule_history", {
      scheduleId: historyScheduleId,
    })
      .then((entries) => {
        if (!cancelled) {
          setHistoryEntries(entries);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistoryEntries([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [historyScheduleId]);

  const handleRegisterSchedule = async () => {
    if (!targetDirectory.trim()) {
      setMessage("エラー: 実行対象ディレクトリを指定してください");
      return;
    }
    if (!scheduleCommand.trim()) {
      setMessage("エラー: スケジュール命令を入力してください");
      return;
    }

    setIsRegistering(true);
    setMessage("スケジュール登録中...");

    try {
      const result = await invoke<ScheduleResult>("register_schedule", {
        tool,
        executionTime: scheduleTime,
        targetDirectory,
        commandArgs: scheduleCommand,
        title: scheduleTitle.trim() || "無題のスケジュール",
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

  const startEditing = (schedule: RegisteredSchedule) => {
    setEditingScheduleId(schedule.schedule_id);
    setEditTitle(schedule.title);
    setEditScheduleTime(schedule.execution_time);
    setEditScheduleType(schedule.schedule_type);
    setEditIntervalValue(schedule.interval_value ?? 3);
    setEditStartDate(schedule.start_date ?? getTodayDateString());
    setEditScheduleCommand(schedule.command_args ?? "");
  };

  const cancelEditing = () => {
    setEditingScheduleId(null);
  };

  const handleUpdateSchedule = async () => {
    if (!editingScheduleId) return;
    if (!targetDirectory.trim()) {
      setMessage("エラー: 実行対象ディレクトリを指定してください");
      return;
    }
    if (!editScheduleCommand.trim()) {
      setMessage("エラー: スケジュール命令を入力してください");
      return;
    }

    setIsUpdating(true);
    setMessage("スケジュール更新中...");

    try {
      const result = await invoke<ScheduleResult>("update_schedule", {
        tool,
        scheduleId: editingScheduleId,
        executionTime: editScheduleTime,
        targetDirectory,
        commandArgs: editScheduleCommand,
        title: editTitle.trim() || "無題のスケジュール",
        scheduleType: editScheduleType,
        intervalValue: editScheduleType === "interval" ? editIntervalValue : undefined,
        startDate: editScheduleType !== "daily" ? editStartDate : undefined,
      });

      setMessage(result.message);
      if (result.success) {
        onScheduleRegister(true);
        setEditingScheduleId(null);
      } else {
        onScheduleRegister(false);
      }
    } catch (error) {
      const errorMsg = `エラー: ${error}`;
      setMessage(errorMsg);
      onScheduleRegister(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnregisterSchedule = async (scheduleId: string) => {
    setDeletingScheduleId(scheduleId);
    setMessage("スケジュール削除中...");

    try {
      const result = await invoke<ScheduleResult>("unregister_schedule", {
        tool,
        scheduleId,
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
      setDeletingScheduleId(null);
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

  const formatHistoryStatus = (status: string) => {
    switch (status) {
      case "success":
        return "成功";
      case "failure":
        return "失敗";
      case "skipped":
        return "スキップ";
      default:
        return status;
    }
  };

  const formatHistoryTimestamp = (timestamp: string) => {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return timestamp;
    }
    return parsed.toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            登録済みスケジュール
          </p>
          {registeredSchedules.length > 0 && (
            <span className="text-xs text-gray-500">
              {registeredSchedules.length}件
            </span>
          )}
        </div>

        {sortedSchedules.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
            まだスケジュールがありません。下のフォームから追加できます。
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSchedules.map((schedule) => (
              <div
                key={schedule.schedule_id}
                className="flex flex-col gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {schedule.title || "無題のスケジュール"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getScheduleDescription(schedule)}
                    {" ・ "}
                    {schedule.schedule_type === "interval" && schedule.start_date
                      ? `開始日: ${schedule.start_date}`
                      : schedule.schedule_type === "weekly" && schedule.start_date
                        ? `曜日基準: ${schedule.start_date}`
                        : "繰り返し: 毎日"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => startEditing(schedule)}
                    disabled={isRunning || editingScheduleId === schedule.schedule_id}
                  >
                    編集
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleUnregisterSchedule(schedule.schedule_id)}
                    disabled={isRunning || deletingScheduleId === schedule.schedule_id}
                    isLoading={deletingScheduleId === schedule.schedule_id}
                  >
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          実行履歴
        </p>
        <Select
          label="対象スケジュール"
          value={historyScheduleId}
          onChange={(e) => setHistoryScheduleId(e.target.value)}
          options={sortedSchedules.map((schedule) => ({
            value: schedule.schedule_id,
            label: `${schedule.title || "無題のスケジュール"} (${schedule.execution_time})`,
          }))}
          disabled={sortedSchedules.length === 0 || isRunning}
        />
        {sortedSchedules.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            登録済みスケジュールがありません。
          </p>
        ) : isHistoryLoading ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            履歴を読み込み中...
          </p>
        ) : historyEntries.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            履歴がありません。
          </p>
        ) : (
          <div className="space-y-2">
            {historyEntries.map((entry, index) => (
              <div
                key={`${entry.timestamp}-${index}`}
                className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300"
              >
                <span>{formatHistoryTimestamp(entry.timestamp)}</span>
                <span className="font-medium">
                  {formatHistoryStatus(entry.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingScheduleId && (
        <div className="space-y-3 rounded-md border border-primary-DEFAULT/30 bg-white/80 dark:bg-gray-900/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              スケジュール編集
            </p>
            <Button variant="ghost" onClick={cancelEditing}>
              キャンセル
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              タイトル
            </label>
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="例: 朝の定例タスク"
            />
          </div>

          <Textarea
            label="スケジュール命令"
            value={editScheduleCommand}
            onChange={(e) => setEditScheduleCommand(e.target.value)}
            disabled={isRunning}
            placeholder="例: 仕様書を要約してください"
            rows={4}
          />

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                実行時刻
              </label>
              <Input
                type="time"
                value={editScheduleTime}
                onChange={(e) => setEditScheduleTime(e.target.value)}
                disabled={isRunning}
              />
            </div>

            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                繰り返しの種類
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary-DEFAULT"
                    name={`editScheduleType-${tool}`}
                    value="daily"
                    checked={editScheduleType === "daily"}
                    onChange={() => setEditScheduleType("daily")}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">毎日</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary-DEFAULT"
                    name={`editScheduleType-${tool}`}
                    value="weekly"
                    checked={editScheduleType === "weekly"}
                    onChange={() => setEditScheduleType("weekly")}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">毎週</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary-DEFAULT"
                    name={`editScheduleType-${tool}`}
                    value="interval"
                    checked={editScheduleType === "interval"}
                    onChange={() => setEditScheduleType("interval")}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">指定間隔</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {editScheduleType === "interval" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  実行間隔（日）
                </label>
                <Input
                  type="number"
                  min={2}
                  value={editIntervalValue}
                  onChange={(e) => setEditIntervalValue(parseInt(e.target.value) || 2)}
                  className="w-full"
                />
              </div>
            )}

            {editScheduleType !== "daily" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  開始日（基準日）
                </label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editScheduleType === "weekly"
                    ? "※指定した日付の曜日で毎週実行されます"
                    : "※この日付を基準に実行判定を行います"}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleUpdateSchedule}
              disabled={
                isRunning ||
                isUpdating ||
                !targetDirectory.trim() ||
                !editScheduleCommand.trim()
              }
              isLoading={isUpdating}
              className="flex-1"
            >
              編集を保存
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          新規スケジュール
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            タイトル
          </label>
          <Input
            type="text"
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
            placeholder="例: 朝の定例タスク"
          />
        </div>

        <Textarea
          label="スケジュール命令"
          value={scheduleCommand}
          onChange={(e) => setScheduleCommand(e.target.value)}
          disabled={isRunning}
          placeholder="例: 仕様書を要約してください"
          rows={4}
        />

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              実行時刻
            </label>
            <Input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              disabled={isRunning}
            />
            <p className="text-xs text-gray-500 mt-1">
              ※共通設定の時刻を初期値として反映します
            </p>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              繰り返しの種類
            </label>
            <div className="flex flex-wrap gap-4">
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
        </div>

        <div className="grid gap-3 md:grid-cols-2">
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

        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleRegisterSchedule}
            disabled={
              isRunning ||
              isRegistering ||
              !targetDirectory.trim() ||
              !scheduleCommand.trim()
            }
            isLoading={isRegistering}
            className="flex-1"
          >
            スケジュール追加
          </Button>
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

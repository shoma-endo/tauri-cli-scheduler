export interface RegisteredSchedule {
  tool: string;
  schedule_id: string;
  title: string;
  execution_time: string;
  command_args?: string;
  schedule_type: 'daily' | 'weekly' | 'interval';
  interval_value?: number;
  start_date?: string; // YYYY-MM-DD
  created_at: string;
}

export interface ScheduleResult {
  success: boolean;
  message: string;
  registered_tool?: string;
  schedule_id?: string;
}

export interface ScheduleHistoryEntry {
  timestamp: string;
  schedule_id: string;
  tool: string;
  status: string;
}

export type ScheduleType = 'daily' | 'weekly' | 'interval';

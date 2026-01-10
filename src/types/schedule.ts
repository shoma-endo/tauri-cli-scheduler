export interface RegisteredSchedule {
  tool: string;
  execution_time: string;
  schedule_type: 'daily' | 'weekly' | 'interval';
  interval_value?: number;
  start_date?: string; // YYYY-MM-DD
  created_at: string;
}

export interface ScheduleResult {
  success: boolean;
  message: string;
  registered_tool?: string;
}

export type ScheduleType = 'daily' | 'weekly' | 'interval';
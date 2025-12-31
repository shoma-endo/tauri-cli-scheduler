export interface RegisteredSchedule {
  tool: string;
  execution_time: string;
  created_at: string;
}

export interface ScheduleResult {
  success: boolean;
  message: string;
  registered_tool?: string;
}

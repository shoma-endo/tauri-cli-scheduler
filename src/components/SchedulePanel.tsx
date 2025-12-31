import { ScheduleManager } from "./ScheduleManager";
import { RegisteredSchedule } from "../types/schedule";
import { ToolType } from "../types/tools";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";

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
            d="M8 7V3m8 4V3m-9 8h10m5 0a2 2 0 01-2 2H7a2 2 0 01-2-2m14 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2z"
          />
        </svg>
        <CardTitle>Schedule Management</CardTitle>
        {registeredSchedule && (
          <Badge variant="success">
            Registered
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <ScheduleManager
          tool={tool}
          executionTime={executionTime}
          targetDirectory={targetDirectory}
          isRunning={isRunning}
          registeredSchedule={registeredSchedule}
          onScheduleRegister={onScheduleRegister}
          onScheduleUnregister={onScheduleUnregister}
        />
      </CardContent>
    </Card>
  );
}


import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

interface ToolSettingsSectionProps {
  toolName: string;
  toolIcon: React.ReactNode;
  children: React.ReactNode;
}

export function ToolSettingsSection({
  toolName,
  toolIcon,
  children,
}: ToolSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        {toolIcon}
        <CardTitle>{toolName} Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}


import iconImage from "../assets/icon.png";
import { ToolType, TOOL_DISPLAY_NAMES } from "../types/tools";

interface HeaderProps {
  activeTab: ToolType;
}

export function Header({ activeTab }: HeaderProps) {
  const toolName = TOOL_DISPLAY_NAMES[activeTab];

  return (
    <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
      <div className="flex items-center gap-3">
        <img src={iconImage} alt="CLI Runner" className="w-10 h-10" />
        <h1 className="text-2xl font-bold text-white">{toolName} Runner</h1>
      </div>
    </div>
  );
}

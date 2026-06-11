import { List, LayoutGrid } from "lucide-react";

interface TabSwitcherProps {
  view: "list" | "board";
  onChange: (view: "list" | "board") => void;
}

export function TabSwitcher({ view, onChange }: TabSwitcherProps) {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange("list")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          view === "list" ? "bg-white shadow-sm text-kairos-600" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <List size={16} />
        List
      </button>
      <button
        onClick={() => onChange("board")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          view === "board" ? "bg-white shadow-sm text-kairos-600" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <LayoutGrid size={16} />
        Board
      </button>
    </div>
  );
}

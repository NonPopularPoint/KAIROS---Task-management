import { AlertTriangle } from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "ready_for_review" | "completed" | "cancelled";
type Priority = "low" | "medium" | "high" | "critical";
type LabelName = "Frontend" | "Backend" | "Bug" | "Feature" | "Research" | "Documentation" | "Urgent";

const statusConfig: Record<TaskStatus, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-gray-100 text-gray-700 border-gray-200" },
  in_progress: { label: "In Progress", classes: "bg-kairos-100 text-kairos-700 border-kairos-200" },
  ready_for_review: { label: "Ready For Review", classes: "bg-amber-100 text-amber-700 border-amber-200" },
  completed: { label: "Completed", classes: "bg-teal-100 text-teal-700 border-teal-200" },
  cancelled: { label: "Cancelled", classes: "bg-coral-100 text-coral-700 border-coral-200" },
};

const priorityConfig: Record<Priority, { label: string; dot: string; classes: string }> = {
  low: { label: "Low", dot: "bg-gray-400", classes: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", dot: "bg-amber-400", classes: "bg-amber-100 text-amber-700" },
  high: { label: "High", dot: "bg-coral-400", classes: "bg-coral-100 text-coral-700" },
  critical: { label: "Critical", dot: "bg-coral-600", classes: "bg-coral-200 text-coral-800" },
};

const labelColors: Record<string, { dot: string; bg: string }> = {
  Frontend: { dot: "bg-blue-500", bg: "bg-blue-100 text-blue-700" },
  Backend: { dot: "bg-orange-500", bg: "bg-orange-100 text-orange-700" },
  Bug: { dot: "bg-pink-500", bg: "bg-pink-100 text-pink-700" },
  Feature: { dot: "bg-violet-500", bg: "bg-violet-100 text-violet-700" },
  Research: { dot: "bg-yellow-500", bg: "bg-yellow-100 text-yellow-700" },
  Documentation: { dot: "bg-gray-500", bg: "bg-gray-200 text-gray-700" },
  Urgent: { dot: "bg-red-500", bg: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${config.classes}`}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
      {priority === "critical" && <AlertTriangle size={12} />}
    </span>
  );
}

export function LabelChip({ name }: { name: string }) {
  const colors = labelColors[name] || { dot: "bg-gray-400", bg: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {name}
    </span>
  );
}

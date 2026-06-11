"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MoreHorizontal, Edit, XCircle, RotateCcw, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { StatusBadge, PriorityBadge, LabelChip } from "@/components/ui/Badges";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  visibility: string;
  created_by: { id: string; name: string; email: string; avatar_url: string | null };
  assigned_to: { id: string; name: string; email: string; avatar_url: string | null } | null;
  labels: { id: string; name: string }[];
  created_at: string;
  completed_at: string | null;
}

interface TaskCardProps {
  task: Task;
  index: number;
  onCancel?: (id: string) => void;
  onReopen?: (id: string) => void;
}

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TaskCard({ task, index, onCancel, onReopen }: TaskCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isCreator = true;
  const canCancel = task.status !== "completed" && task.status !== "cancelled";
  const canReopen = task.status === "cancelled";
  const canEdit = task.status !== "completed";

  return (
    <>
      <motion.div
        className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer relative"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.05, ease: [0, 0, 0.2, 1] }}
        onClick={() => router.push(`/tasks/${task.id}`)}
      >
        {/* Header Row */}
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={task.status as any} />
          <PriorityBadge priority={task.priority as any} />
          {task.visibility === "private" && (
            <span className="text-xs text-gray-400 ml-auto mr-2">🔒 Private</span>
          )}
          <div className="ml-auto relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30">
                {canEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); router.push(`/tasks/${task.id}/edit`); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowCancel(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-coral-600 hover:bg-coral-50 transition-colors"
                  >
                    <XCircle size={14} />
                    Cancel
                  </button>
                )}
                {canReopen && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onReopen?.(task.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw size={14} />
                    Reopen
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[17px] font-semibold text-gray-900 mb-1.5 leading-snug line-clamp-2">
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {task.labels.slice(0, 4).map((l) => (
              <LabelChip key={l.id} name={l.name} />
            ))}
            {task.labels.length > 4 && (
              <span className="text-xs text-gray-400">+{task.labels.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            {task.assigned_to ? (
              <>
                <Avatar size="sm" src={task.assigned_to.avatar_url || undefined} name={task.assigned_to.name} />
                <span className="text-sm text-gray-600">{task.assigned_to.name.split(" ")[0]}</span>
              </>
            ) : (
              <span className="text-sm text-gray-400 italic">Unassigned</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{timeAgo(task.created_at)}</span>
          </div>
        </div>
      </motion.div>

      <ConfirmModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={() => { onCancel?.(task.id); setShowCancel(false); }}
        title="Cancel this task?"
        message="This will mark the task as cancelled. You can reopen it later."
        confirmLabel="Cancel Task"
      />
    </>
  );
}

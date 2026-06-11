"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus, UserPlus, UserMinus, UserCheck, ArrowRight,
  Send, RefreshCw, Check, X, RotateCcw, Activity
} from "lucide-react";
import { useRecentActivity } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/Skeleton";

const eventConfig: Record<string, { label: string; icon: typeof Plus; bg: string }> = {
  task_created: { label: "created", icon: Plus, bg: "bg-kairos-500" },
  task_assigned: { label: "assigned", icon: UserCheck, bg: "bg-amber-500" },
  task_reassigned: { label: "reassigned", icon: UserCheck, bg: "bg-amber-500" },
  task_unassigned: { label: "unassigned", icon: UserMinus, bg: "bg-gray-500" },
  task_claimed: { label: "claimed", icon: UserPlus, bg: "bg-teal-500" },
  status_changed: { label: "changed status of", icon: ArrowRight, bg: "bg-kairos-500" },
  task_submitted_for_review: { label: "submitted for review", icon: Send, bg: "bg-amber-500" },
  review_changes_requested: { label: "requested changes on", icon: RefreshCw, bg: "bg-coral-500" },
  task_approved_completed: { label: "completed", icon: Check, bg: "bg-teal-500" },
  task_cancelled: { label: "cancelled", icon: X, bg: "bg-coral-500" },
  task_reopened: { label: "reopened", icon: RotateCcw, bg: "bg-kairos-500" },
};

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 12) return `${hrs}h ago`;
  if (hrs < 24) return "today";
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentActivity() {
  const { data, loading, error } = useRecentActivity();
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">Recent Activity</h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton width="36px" height="36px" rounded="full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton width="65%" height="14px" />
                <Skeleton width="35%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">Recent Activity</h2>
        <p className="text-sm text-gray-400 text-center py-6">Unable to load recent activity.</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">Recent Activity</h2>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Activity size={24} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No recent activity</p>
          <p className="text-xs text-gray-500 max-w-[200px]">Task actions will appear here as your team works.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">Recent Activity</h2>
      <div className="space-y-1">
        {data.slice(0, 8).map((item, i) => {
          const config = eventConfig[item.event_type] || eventConfig.task_created;
          const Icon = config.icon;

          return (
            <motion.div
              key={item.id}
              className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              onClick={() => router.push(`/tasks/${item.task_id}`)}
            >
              <div className={`w-9 h-9 rounded-full ${config.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon size={15} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  <span className="font-semibold">{item.user?.name || "Someone"}</span>
                  <span className="text-gray-500"> {config.label} </span>
                  <span className="font-medium text-gray-700">a task</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.created_at)}</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={12} className="text-gray-400" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

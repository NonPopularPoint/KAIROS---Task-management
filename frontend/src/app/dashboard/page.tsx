"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutList, Clock, Play, Eye, CheckCircle2, XCircle,
  UserCheck, FileEdit, Users, BarChart3, Plus
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardMetrics, useWeeklyChart } from "@/hooks/useDashboard";
import { RecentActivity } from "@/components/RecentActivity";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getSubtitle(metrics: { total: number; pending: number; ready_for_review: number; completed: number; in_progress: number }) {
  if (metrics.total === 0) return "Let's get started. Create your first task.";
  if (metrics.pending === 0 && metrics.in_progress === 0 && metrics.ready_for_review === 0 && metrics.completed > 0)
    return "Great job! All tasks are done. Create something new?";
  if (metrics.ready_for_review > 0)
    return `You have ${metrics.ready_for_review} task${metrics.ready_for_review > 1 ? "s" : ""} waiting for review.`;
  return "Here's what's happening with your tasks.";
}

function CountUp({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        started.current = true;
        const start = performance.now();
        const duration = 800;
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{val}</span>;
}

const metricCards = [
  { key: "total", label: "Total Tasks", icon: LayoutList, iconBg: "bg-kairos-100", iconColor: "text-kairos-600", filter: "" },
  { key: "pending", label: "Pending", icon: Clock, iconBg: "bg-gray-100", iconColor: "text-gray-600", filter: "?status=pending" },
  { key: "in_progress", label: "In Progress", icon: Play, iconBg: "bg-kairos-100", iconColor: "text-kairos-600", filter: "?status=in_progress" },
  { key: "ready_for_review", label: "Ready For Review", icon: Eye, iconBg: "bg-amber-100", iconColor: "text-amber-600", filter: "?status=ready_for_review" },
  { key: "completed", label: "Completed", icon: CheckCircle2, iconBg: "bg-teal-100", iconColor: "text-teal-600", filter: "?status=completed" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, iconBg: "bg-coral-100", iconColor: "text-coral-600", filter: "?status=cancelled" },
  { key: "assigned_to_me", label: "Assigned to Me", icon: UserCheck, iconBg: "bg-kairos-100", iconColor: "text-kairos-600", filter: "?assignee_filter=assigned_to_me" },
  { key: "created_by_me", label: "Created by Me", icon: FileEdit, iconBg: "bg-amber-100", iconColor: "text-amber-600", filter: "?assignee_filter=created_by_me" },
  { key: "unassigned_public", label: "Unassigned Public", icon: Users, iconBg: "bg-gray-100", iconColor: "text-gray-600", filter: "?assignee_filter=unassigned" },
] as const;

const eventLabels: Record<string, string> = {
  task_created: "created",
  task_assigned: "assigned",
  task_reassigned: "reassigned",
  task_unassigned: "unassigned",
  task_claimed: "claimed",
  status_changed: "changed status of",
  task_submitted_for_review: "submitted for review",
  review_changes_requested: "requested changes on",
  task_approved_completed: "completed",
  task_cancelled: "cancelled",
  task_reopened: "reopened",
};

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function WeeklyChartSection() {
  const { data, loading, error, refetch } = useWeeklyChart();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tasks Completed This Week</h3>
        <Skeleton width="100%" height="220px" rounded="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tasks Completed This Week</h3>
        <div className="flex flex-col items-center py-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Unable to load chart</p>
          <button onClick={refetch} className="text-sm text-kairos-600 hover:text-kairos-700 font-medium">Retry</button>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tasks Completed This Week</h3>
        <div className="flex flex-col items-center py-8 text-center">
          <BarChart3 size={40} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No tasks completed this week</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Tasks Completed This Week</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#9ca3af" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#9ca3af" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
            cursor={{ fill: "#f3f4f6" }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={true} animationDuration={800} animationEasing="ease-out">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.count > 0 ? "#818cf8" : "#e5e7eb"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: metrics, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useDashboardMetrics();

  const firstName = user?.name?.split(" ")[0] || "there";
  const greeting = useMemo(() => getGreeting(), []);
  const subtitle = useMemo(() => metrics ? getSubtitle(metrics) : "", [metrics]);

  const showEmpty = !metricsLoading && !metricsError && metrics && metrics.total === 0;
  const showError = metricsError && !metrics;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Greeting Section */}
          <motion.div
            className="relative overflow-hidden bg-gradient-to-br from-kairos-600 via-kairos-700 to-kairos-900 rounded-2xl p-6 lg:p-8 mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative z-10">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-kairos-200">{subtitle || "Here's what's happening with your tasks."}</p>
              {showEmpty && (
                <button
                  onClick={() => router.push("/tasks/new")}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-kairos-700 rounded-lg text-sm font-medium hover:bg-kairos-50 transition-colors"
                >
                  <Plus size={16} />
                  Create your first task
                </button>
              )}
            </div>
          </motion.div>

          {/* Metric Cards */}
          {metricsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <Skeleton width="48px" height="48px" rounded="xl" className="mb-4" />
                  <Skeleton width="60px" height="32px" className="mb-2" />
                  <Skeleton width="80px" height="16px" />
                </div>
              ))}
            </div>
          ) : showError ? (
            <ErrorMessage message="Unable to load dashboard metrics." onRetry={refetchMetrics} />
          ) : metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {metricCards.map((card, i) => (
                <motion.div
                  key={card.key}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  onClick={() => router.push(`/tasks${card.filter}`)}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${card.iconBg} mb-4`}>
                    <card.icon size={24} className={card.iconColor} />
                  </div>
                  <p className="text-4xl font-bold text-gray-900">
                    <CountUp target={metrics[card.key as keyof typeof metrics] || 0} />
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                </motion.div>
              ))}
            </div>
          ) : null}

          {/* Weekly Chart */}
          <WeeklyChartSection />

          {/* Activity Feed */}
          <RecentActivity />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

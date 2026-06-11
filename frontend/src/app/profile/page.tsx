"use client";

import { LogOut, FileEdit, UserCheck, CheckCircle2, Calendar, Shield, ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardMetrics } from "@/hooks/useDashboard";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: metrics, loading: metricsLoading } = useDashboardMetrics();

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statCards = [
    { icon: FileEdit, label: "Tasks Created", value: metrics?.created_by_me ?? 0, color: "from-amber-400 to-amber-500", bg: "bg-amber-50", iconColor: "text-amber-500" },
    { icon: UserCheck, label: "Assigned to Me", value: metrics?.assigned_to_me ?? 0, color: "from-kairos-500 to-kairos-600", bg: "bg-kairos-50", iconColor: "text-kairos-500" },
    { icon: CheckCircle2, label: "Completed", value: metrics?.completed ?? 0, color: "from-teal-400 to-teal-500", bg: "bg-teal-50", iconColor: "text-teal-500" },
  ];

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Back Link */}
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </a>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-5 mb-5">
              <div className="shrink-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-20 h-20 rounded-full border-2 border-kairos-100 shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-kairos-500 to-kairos-700 text-white flex items-center justify-center text-xl font-bold border-2 border-kairos-200 shadow-sm">
                    {initials}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h1>
                <p className="text-sm text-gray-500 truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400 border-t border-gray-100 pt-4">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield size={14} />
                ID <code className="text-gray-500 font-mono text-[11px]">{user?.id?.slice(0, 12)}...</code>
              </span>
            </div>
          </div>

          {/* Task Statistics */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">Task Statistics</h2>
            {metricsLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-5 text-center">
                    <Skeleton width="40px" height="40px" rounded="xl" className="mx-auto mb-3" />
                    <Skeleton width="40px" height="28px" className="mx-auto mb-1" />
                    <Skeleton width="70px" height="12px" className="mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className={`${stat.bg} rounded-xl p-5 text-center hover:shadow-sm transition-shadow duration-200`}
                  >
                    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm mb-3`}>
                      <stat.icon size={22} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={() => { logout(); }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:text-coral-600 hover:border-coral-200 hover:bg-coral-50 transition-all duration-200"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

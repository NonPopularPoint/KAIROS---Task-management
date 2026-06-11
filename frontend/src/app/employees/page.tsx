"use client";

import { useRouter } from "next/navigation";
import { Users, Mail, Calendar, Shield, Search } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUsers } from "@/hooks/useUsers";

export default function EmployeesPage() {
  const router = useRouter();
  const { data: users, loading } = useUsers();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team</h1>
              <p className="text-sm text-gray-500 mt-1">
                {users?.length || 0} member{users?.length !== 1 ? "s" : ""} in your workspace
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-100">
                  <Skeleton width="48px" height="48px" rounded="full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="180px" height="18px" />
                    <Skeleton width="240px" height="14px" />
                  </div>
                </div>
              ))}
            </div>
          ) : users?.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No team members"
              description="Other users will appear here once they sign in."
            />
          ) : (
            <div className="space-y-3">
              {users?.map((user: any, i: number) => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  onClick={() => router.push(`/tasks?assignee_filter=assigned_to_me&assignee_filter=${user.id}`)}
                >
                  <div className="shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-12 h-12 rounded-full border-2 border-kairos-100 object-cover"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white shadow-sm ${
                        [
                          "bg-gradient-to-br from-kairos-500 to-kairos-700",
                          "bg-gradient-to-br from-amber-400 to-amber-600",
                          "bg-gradient-to-br from-teal-400 to-teal-600",
                          "bg-gradient-to-br from-coral-400 to-coral-600",
                          "bg-gradient-to-br from-violet-500 to-violet-700",
                        ][i % 5]
                      }`}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                      <Mail size={13} />
                      {user.email}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400 shrink-0">
                    <Calendar size={13} />
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                  </div>
                  <Shield size={14} className="text-gray-200 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

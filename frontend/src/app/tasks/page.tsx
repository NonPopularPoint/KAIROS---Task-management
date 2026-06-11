"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/Button";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { TaskFilters } from "@/components/TaskFilters";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Pagination } from "@/components/ui/Pagination";
import { useTasks } from "@/hooks/useTasks";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useToast } from "@/components/ui/Toast";

function TasksContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [view, setView] = useState<"list" | "board">("list");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { data: tasksData, loading, error, refetch } = useTasks({ ...filters, page, per_page: 20 });
  const { changeStatus } = useTaskMutations();

  useEffect(() => {
    const stored = localStorage.getItem("kairos_task_view");
    if (stored === "board" || stored === "list") setView(stored);
  }, []);

  const prevError = useRef(error);
  useEffect(() => {
    if (error && !prevError.current && tasksData) {
      toast("info", "Failed to refresh. Showing cached data.");
    }
    prevError.current = error;
  }, [error, tasksData, toast]);

  const handleFilterChange = useCallback((f: Record<string, any>) => {
    setFilters(f);
    setPage(1);
  }, []);

  const handleViewChange = (v: "list" | "board") => {
    if (v === "board") { router.push("/board"); return; }
    setView(v);
    localStorage.setItem("kairos_task_view", v);
  };

  const handleCancel = async (id: string) => {
    const result = await changeStatus(id, { status: "cancelled", cancellation_reason: "Cancelled from task list" });
    if (result) { toast("success", "Task cancelled"); refetch(); }
    else toast("error", "Failed to cancel task");
  };

  const handleReopen = async (id: string) => {
    const result = await changeStatus(id, { status: "pending" });
    if (result) { toast("success", "Task reopened"); refetch(); }
    else toast("error", "Failed to reopen task");
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <Button onClick={() => router.push("/tasks/new")}>
          <Plus size={18} />
          Create Task
        </Button>
      </div>

      <TaskFilters onChange={handleFilterChange} />

      <div className="flex items-center justify-between mb-6">
        <TabSwitcher view={view} onChange={handleViewChange} />
        <span className="text-sm text-gray-500">
          {tasksData ? `${tasksData.pagination.total_count} tasks` : ""}
        </span>
      </div>

      {(loading && !tasksData) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton width="64px" height="24px" rounded="full" />
                <Skeleton width="64px" height="24px" rounded="full" />
              </div>
              <Skeleton width="80%" height="22px" className="mb-2" />
              <Skeleton width="100%" height="16px" className="mb-1" />
              <Skeleton width="60%" height="16px" className="mb-3" />
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <Skeleton width="100px" height="14px" />
                <Skeleton width="60px" height="14px" />
              </div>
            </div>
          ))}
        </div>
      ) : error && !tasksData ? (
        <div className="mb-8">
          <ErrorMessage message="Unable to load tasks." onRetry={refetch} />
        </div>
      ) : tasksData && tasksData.tasks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {tasksData.tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} onCancel={handleCancel} onReopen={handleReopen} />
            ))}
            {loading && Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-${i}`} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton width="64px" height="24px" rounded="full" />
                  <Skeleton width="64px" height="24px" rounded="full" />
                </div>
                <Skeleton width="80%" height="22px" className="mb-2" />
                <Skeleton width="100%" height="16px" className="mb-1" />
                <Skeleton width="60%" height="16px" className="mb-3" />
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <Skeleton width="100px" height="14px" />
                  <Skeleton width="60px" height="14px" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : tasksData && tasksData.tasks.length === 0 ? (
        <div className="mb-8">
          <EmptyState
            icon={Plus}
            title={
              filters.search
                ? `No results for "${filters.search}"`
                : filters.status?.length || filters.priority || filters.visibility || filters.label_ids?.length || filters.assignee_filter
                  ? "No tasks match your criteria"
                  : "No tasks yet"
            }
            description={
              filters.search
                ? "Try different keywords or check your spelling."
                : filters.status?.length || filters.priority || filters.visibility || filters.label_ids?.length || filters.assignee_filter
                  ? "Try adjusting or clearing your filters."
                  : "When you create or get assigned tasks, they will appear here."
            }
            action={
              filters.search || filters.status?.length || filters.priority || filters.visibility || filters.label_ids?.length || filters.assignee_filter
                ? undefined
                : { label: "Create your first task", onClick: () => router.push("/tasks/new") }
            }
          />
        </div>
      ) : null}

      {tasksData && tasksData.tasks.length > 0 && (
        <>

          <Pagination
            page={tasksData.pagination.page}
            totalPages={tasksData.pagination.total_pages}
            totalCount={tasksData.pagination.total_count}
            perPage={tasksData.pagination.per_page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-100 rounded-lg w-1/3" />
              <div className="h-16 bg-gray-100 rounded-xl" />
              <div className="h-96 bg-gray-100 rounded-2xl" />
            </div>
          </div>
        }>
          <TasksContent />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

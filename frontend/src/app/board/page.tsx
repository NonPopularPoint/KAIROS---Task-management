"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Clock, Play, Eye, CheckCircle2, AlertTriangle } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { TabSwitcher } from "@/components/ui/TabSwitcher";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTasks } from "@/hooks/useTasks";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useToast } from "@/components/ui/Toast";
import {
  DndContext, closestCorners, DragOverlay, useDraggable, useDroppable,
  type DragEndEvent, type DragStartEvent
} from "@dnd-kit/core";

const statuses = [
  { key: "pending", label: "Pending", icon: Clock, color: "bg-gray-400" },
  { key: "in_progress", label: "In Progress", icon: Play, color: "bg-kairos-500" },
  { key: "ready_for_review", label: "Ready For Review", icon: Eye, color: "bg-amber-500" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "bg-teal-500" },
];

const validTransitions: Record<string, string[]> = {
  pending: ["in_progress"],
  in_progress: ["ready_for_review"],
  ready_for_review: ["pending", "completed", "in_progress"],
  completed: [],
};

function BoardCard({ task, disabled }: { task: any; disabled?: boolean }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task, status: task.status },
    disabled,
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => router.push(`/tasks/${task.id}`)}
      className={`bg-white rounded-lg p-3 border border-gray-100 transition-all duration-150 group ${
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "shadow-2xl rotate-2 scale-105 opacity-95 z-50" : "shadow-sm hover:shadow-md"}`}
      style={style}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
          task.priority === "critical" ? "bg-coral-500" :
          task.priority === "high" ? "bg-coral-400" :
          task.priority === "medium" ? "bg-amber-400" : "bg-gray-400"
        }`} />
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">{task.title}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {task.labels?.slice(0, 2).map((l: any) => (
            <span key={l.id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{l.name}</span>
          ))}
        </div>
        {task.assigned_to && (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-kairos-500 to-kairos-700 text-white flex items-center justify-center text-[9px] font-semibold shrink-0 ml-2" title={task.assigned_to.name}>
            {task.assigned_to.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function Column({ status, tasks, isMobile }: { status: typeof statuses[0]; tasks: any[]; isMobile?: boolean }) {
  const router = useRouter();
  const { setNodeRef, isOver } = useDroppable({ id: status.key, disabled: isMobile });

  const invalid = status.key !== "pending" && tasks.length === 0 && isOver;

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50/80 rounded-xl border flex flex-col overflow-hidden transition-all duration-200 ${
        isOver && isMobile ? "" :
        isOver && invalid ? "bg-coral-50 border-2 border-coral-300 border-dashed" :
        isOver ? "bg-kairos-50 border-2 border-kairos-300 border-dashed" :
        "border-gray-200/60"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
          <h2 className="text-sm font-semibold text-gray-700">{status.label}</h2>
          <span className="text-xs text-gray-400 font-medium">{tasks.length}</span>
        </div>
        {status.key === "pending" && (
          <button onClick={() => router.push("/tasks/new")} className="p-1 rounded-md text-gray-400 hover:text-kairos-600 hover:bg-kairos-50 transition-colors" title="Add task">
            <Plus size={18} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[120px]">
        {tasks.length > 0 ? (
          tasks.map((task: any) => <BoardCard key={task.id} task={task} disabled={isMobile} />)
        ) : (
          <div className={`flex items-center justify-center h-24 text-xs transition-colors duration-200 ${
            isOver && !isMobile ? "text-kairos-600 font-medium" : "text-gray-400"
          }`}>
            {isOver && !isMobile ? "Drop here" : "No tasks"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, loading } = useTasks({ per_page: 100 });
  const { changeStatus } = useTaskMutations();
  const [activeTask, setActiveTask] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState<{ type: string; taskId: string } | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => { setIsMobile(window.innerWidth < 768); }, []);

  const grouped: Record<string, any[]> = { pending: [], in_progress: [], ready_for_review: [], completed: [] };
  if (data) data.tasks.forEach((t) => { if (grouped[t.status]) grouped[t.status].push(t); });

  const handleDragStart = (event: DragStartEvent) => {
    const status = event.active.data.current?.status;
    const task = status ? grouped[status]?.find((t: any) => t.id === event.active.id) : null;
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const overId = event.over?.id as string;
    const taskData = event.active.data.current?.task as any;
    if (!overId || !taskData || taskData.status === overId) return;

    const allowed = validTransitions[taskData.status];
    if (!allowed?.includes(overId)) {
      toast("error", "Cannot move task to this column");
      return;
    }

    if (overId === "ready_for_review") {
      setShowModal({ type: "ready_for_review", taskId: taskData.id });
      return;
    }
    if (taskData.status === "ready_for_review" && overId === "in_progress") {
      setShowModal({ type: "changes", taskId: taskData.id });
      return;
    }

    const result = await changeStatus(taskData.id, { status: overId });
    if (result) toast("success", `Moved to ${statuses.find((s) => s.key === overId)?.label}`);
    else toast("error", "Failed to move task");
  };

  const submitModal = async () => {
    if (!showModal) return;
    let body: any = { status: showModal.type === "changes" ? "in_progress" : "ready_for_review" };
    if (showModal.type === "ready_for_review") body.completion_note = note || "Moved from board";
    if (showModal.type === "changes") body.review_feedback = note || "Adjustments needed";
    const result = await changeStatus(showModal.taskId, body);
    if (result) toast("success", "Status updated");
    else toast("error", "Failed to update");
    setShowModal(null);
    setNote("");
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 lg:p-8 max-w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Board</h1>
            <div className="flex items-center gap-4">
              <TabSwitcher view="board" onChange={(v) => { if (v === "list") router.push("/tasks"); }} />
              <Button onClick={() => router.push("/tasks/new")}><Plus size={18} /> Create Task</Button>
            </div>
          </div>

          {loading && !data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-50/80 rounded-xl border border-gray-200/60 flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200/60"><Skeleton width="80px" height="20px" /></div>
                  <div className="p-3 space-y-2 flex-1">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="bg-white rounded-lg p-3 border border-gray-100 space-y-2">
                        <Skeleton width="60%" height="14px" />
                        <Skeleton width="40%" height="12px" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (data && data.tasks.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No tasks yet</h3>
              <p className="text-sm text-gray-500 mb-6">Create your first task to get started with the board.</p>
              <Button onClick={() => router.push("/tasks/new")}><Plus size={16} /> Create Task</Button>
            </div>
          ) : (
            <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
                {statuses.map((s) => <Column key={s.key} status={s} tasks={grouped[s.key] || []} isMobile={isMobile} />)}
              </div>
              <DragOverlay>
                {activeTask ? <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-2xl rotate-2 scale-105 w-[280px]"><p className="text-sm font-semibold text-gray-900">{activeTask.title}</p></div> : null}
              </DragOverlay>
            </DndContext>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowModal(null); setNote(""); }}>
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {showModal.type === "changes" ? "Request Changes" : showModal.type === "ready_for_review" ? "Submit for Review" : ""}
                </h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 2000))}
                  placeholder={showModal.type === "ready_for_review" ? "Describe what you've completed..." : "Provide feedback..."}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-kairos-500 focus:ring-4 focus:ring-kairos-500/10 outline-none resize-none min-h-[100px]"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{note.length} / 2000</p>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => { setShowModal(null); setNote(""); }}>Cancel</Button>
                  <Button onClick={submitModal}>Confirm</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

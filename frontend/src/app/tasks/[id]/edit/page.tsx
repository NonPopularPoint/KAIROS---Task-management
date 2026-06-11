"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Globe, Save } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLabels } from "@/hooks/useLabels";
import { useUsers } from "@/hooks/useUsers";
import { useTask } from "@/hooks/useTasks";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useToast } from "@/components/ui/Toast";

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: allLabels } = useLabels();
  const { data: users } = useUsers();
  const { data: task, loading: taskLoading, error: taskError } = useTask(id);
  const { updateTask } = useTaskMutations();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [visibility, setVisibility] = useState("private");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialised, setInitialised] = useState(false);

  const assigneeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task && !initialised) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setVisibility(task.visibility || "private");
      setSelectedLabels(task.labels?.map((l: any) => l.id) || []);
      setAssigneeId(task.assigned_to?.id || "");
      setInitialised(true);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [task, initialised]);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) setAssigneeOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const isCompleted = task?.status === "completed";

  const filteredUsers = (users || []).filter(
    (u: any) => u.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );
  const selectedUser = (users || []).find((u: any) => u.id === assigneeId);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setSaving(true);
    const result = await updateTask(id, {
      title: trimmed,
      description: description.trim() || null,
      priority,
      visibility,
      label_ids: selectedLabels,
      assigned_to: assigneeId || null,
    });
    setSaving(false);

    if (result) {
      toast("success", "Task updated");
      router.push(`/tasks/${id}`);
    } else {
      toast("error", "Failed to update task");
    }
  };

  if (taskLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
            <Skeleton width="120px" height="20px" />
            <Skeleton width="60%" height="36px" />
            <div className="space-y-6">
              <Skeleton width="100%" height="100px" rounded="xl" />
              <Skeleton width="100%" height="160px" rounded="xl" />
              <Skeleton width="100%" height="60px" rounded="xl" />
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (taskError || !task) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6 lg:p-8 max-w-2xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
              <ArrowLeft size={16} />
              Back
            </button>
            <p className="text-sm text-gray-500 text-center py-16">Task not found or you don&apos;t have access.</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <button
            onClick={() => router.push(`/tasks/${id}`)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to task
          </button>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">Edit Task</h1>

          {isCompleted && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-teal-800">
                This task is completed and cannot be edited.
              </p>
              <p className="text-xs text-teal-600 mt-1">
                Completed tasks are locked. Create a new task if you need to start fresh.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 space-y-6">
            <Input
              ref={titleRef}
              label="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              maxLength={200}
              currentLength={title.length}
              disabled={isCompleted}
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 10000))}
              maxLength={10000}
              currentLength={description.length}
              rows={5}
              disabled={isCompleted}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-1.5">Priority</p>
                <div className="flex gap-2 flex-wrap">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => !isCompleted && setPriority(p.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                        isCompleted ? "cursor-not-allowed opacity-60" : ""
                      } ${
                        priority === p.value
                          ? "bg-kairos-100 text-kairos-700 border-kairos-200 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</p>
                <div className="flex gap-2">
                  {[{ value: "private", label: "Private", icon: Lock }, { value: "public", label: "Public", icon: Globe }].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => !isCompleted && setVisibility(opt.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                        isCompleted ? "cursor-not-allowed opacity-60" : ""
                      } ${
                        visibility === opt.value
                          ? "bg-kairos-100 text-kairos-700 border-kairos-200 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <opt.icon size={16} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Labels</p>
              <div className="flex flex-wrap gap-2">
                {(allLabels || []).map((l: any) => {
                  const active = selectedLabels.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => !isCompleted && setSelectedLabels((prev) => prev.includes(l.id) ? prev.filter((v) => v !== l.id) : [...prev, l.id])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        isCompleted ? "cursor-not-allowed opacity-60" : ""
                      } ${
                        active
                          ? "bg-kairos-50 text-kairos-700 border-kairos-200 shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative" ref={assigneeRef}>
              <p className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</p>
              {selectedUser ? (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kairos-500 to-kairos-700 text-white flex items-center justify-center text-xs font-semibold">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-900 flex-1">{selectedUser.name}</span>
                  {!isCompleted && (
                    <button onClick={() => setAssigneeId("")} className="text-xs text-gray-400 hover:text-coral-600">
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={assigneeSearch}
                    onChange={(e) => { setAssigneeSearch(e.target.value); setAssigneeOpen(true); }}
                    onFocus={() => setAssigneeOpen(true)}
                    placeholder="Search users..."
                    disabled={isCompleted}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-kairos-500 focus:ring-4 focus:ring-kairos-500/10 outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {assigneeOpen && !isCompleted && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 max-h-48 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u: any) => (
                          <button
                            key={u.id}
                            onClick={() => { setAssigneeId(u.id); setAssigneeOpen(false); setAssigneeSearch(""); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-kairos-500 to-kairos-700 text-white flex items-center justify-center text-[10px] font-semibold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            {u.name}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-gray-400">No users found</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <Button variant="ghost" onClick={() => router.push(`/tasks/${id}`)}>Cancel</Button>
            {!isCompleted && (
              <Button onClick={handleSubmit} disabled={!title.trim()} loading={saving}>
                <Save size={16} />
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

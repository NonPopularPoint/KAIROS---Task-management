"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Lock, Globe } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useLabels } from "@/hooks/useLabels";
import { useUsers } from "@/hooks/useUsers";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useToast } from "@/components/ui/Toast";

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const labelColors: Record<string, string> = {
  Frontend: "bg-blue-100 text-blue-700 border-blue-200",
  Backend: "bg-orange-100 text-orange-700 border-orange-200",
  Bug: "bg-pink-100 text-pink-700 border-pink-200",
  Feature: "bg-violet-100 text-violet-700 border-violet-200",
  Research: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Documentation: "bg-gray-200 text-gray-700 border-gray-300",
  Urgent: "bg-red-100 text-red-700 border-red-200",
};

export default function CreateTaskPage() {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: allLabels } = useLabels();
  const { data: users } = useUsers();
  const { createTask } = useTaskMutations();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [visibility, setVisibility] = useState("private");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const assigneeRef = useRef<HTMLDivElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) setAssigneeOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggleLabel = (id: string) => {
    setSelectedLabels((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  };

  const selectAssignee = (uid: string) => {
    setAssigneeId(uid);
    setAssigneeOpen(false);
    setAssigneeSearch("");
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setSaving(true);
    const result = await createTask({
      title: trimmedTitle,
      description: description.trim() || undefined,
      priority,
      visibility,
      label_ids: selectedLabels,
      assigned_to: assigneeId || undefined,
    });
    setSaving(false);

    if (result && (result as any).id) {
      toast("success", "Task created");
      router.push(`/tasks/${(result as any).id}`);
    } else {
      toast("error", "Failed to create task");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && title.trim()) {
      handleSubmit();
    }
  };

  const filteredUsers = (users || []).filter(
    (u: any) => u.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const selectedUser = (users || []).find((u: any) => u.id === assigneeId);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto" onKeyDown={handleKeyDown}>
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">Create New Task</h1>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 space-y-6">
            {/* Title */}
            <Input
              ref={titleRef}
              label="Title *"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              maxLength={200}
              currentLength={title.length}
              helpText="A clear, concise title helps others understand the task."
            />

            {/* Description */}
            <Textarea
              label="Description"
              placeholder="Describe the task in detail (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 10000))}
              maxLength={10000}
              currentLength={description.length}
              rows={5}
              helpText="Include any relevant context, requirements, or notes."
            />

            {/* Priority + Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-1.5">Priority</p>
                <div className="flex gap-2 flex-wrap">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
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
                  {[
                    { value: "private", label: "Private", icon: Lock },
                    { value: "public", label: "Public", icon: Globe },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setVisibility(opt.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
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

            {/* Labels */}
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Labels</p>
              <div className="flex flex-wrap gap-2">
                {(allLabels || []).map((l) => {
                  const active = selectedLabels.includes(l.id);
                  const color = labelColors[l.name] || "bg-gray-100 text-gray-600 border-gray-200";
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleLabel(l.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        active ? color + " shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignee */}
            <div className="relative" ref={assigneeRef}>
              <p className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</p>
              {selectedUser ? (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kairos-500 to-kairos-700 text-white flex items-center justify-center text-xs font-semibold">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-900 flex-1">{selectedUser.name}</span>
                  <button onClick={() => setAssigneeId("")} className="text-xs text-gray-400 hover:text-coral-600">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={assigneeSearch}
                    onChange={(e) => { setAssigneeSearch(e.target.value); setAssigneeOpen(true); }}
                    onFocus={() => setAssigneeOpen(true)}
                    placeholder="Search users..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-kairos-500 focus:ring-4 focus:ring-kairos-500/10 outline-none transition-all duration-200"
                  />
                  {assigneeOpen && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 max-h-48 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u: any) => (
                          <button
                            key={u.id}
                            onClick={() => selectAssignee(u.id)}
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
              {assigneeId && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  If you assign this task to another user, they will receive an email notification.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:block">Ctrl+Enter</span>
              <Button onClick={handleSubmit} disabled={!title.trim()} loading={saving}>
                <Plus size={16} />
                Create Task
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

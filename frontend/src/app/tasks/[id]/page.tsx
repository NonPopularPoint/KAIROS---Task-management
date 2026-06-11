"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Edit, ArrowLeft, Check, X, Lock, Globe, Clock, CalendarCheck, Plus, UserPlus, UserMinus, UserCheck2, ArrowRight, Send, RefreshCw, RotateCcw, FileSearch, ListTodo } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/Button";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badges";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Textarea } from "@/components/ui/Textarea";
import { useTask } from "@/hooks/useTasks";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useAuth } from "@/hooks/useAuth";
import { useLabels } from "@/hooks/useLabels";
import { useComments } from "@/hooks/useComments";
import { useTaskHistory } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/components/ui/Toast";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EditableTitle({ title, taskId, canEdit }: { title: string; taskId: string; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateTask } = useTaskMutations();
  const { toast } = useToast();

  useEffect(() => { setValue(title); }, [title]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) { setEditing(false); setValue(title); return; }
    setSaving(true);
    const result = await updateTask(taskId, { title: trimmed });
    setSaving(false);
    if (result) { toast("success", "Title updated"); setEditing(false); }
    else { toast("error", "Failed to update title"); setValue(title); }
  };

  const cancel = () => { setValue(title); setEditing(false); };

  if (!canEdit) {
    return <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{title}</h1>;
  }

  if (!editing) {
    return (
      <h1
        className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight cursor-pointer hover:text-kairos-600 transition-colors group relative"
        onClick={() => setEditing(true)}
      >
        {title}
        <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit size={18} className="text-gray-300 inline -mt-1" />
        </span>
      </h1>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 200))}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
        className="flex-1 text-2xl lg:text-3xl font-bold text-gray-900 bg-transparent border-0 border-b-2 border-kairos-500 outline-none px-1 py-0 leading-tight"
        disabled={saving}
      />
      <button onClick={save} disabled={saving} className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors shrink-0">
        <Check size={20} />
      </button>
      <button onClick={cancel} disabled={saving} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0">
        <X size={20} />
      </button>
    </div>
  );
}

function DescriptionSection({ task, isCreator, canModify }: { task: any; isCreator: boolean; canModify: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(task.description || "");
  const [localDesc, setLocalDesc] = useState(task.description || "");
  const [saving, setSaving] = useState(false);
  const { updateTask } = useTaskMutations();
  const { toast } = useToast();

  useEffect(() => {
    setValue(task.description || "");
    setLocalDesc(task.description || "");
  }, [task.description]);

  const save = async () => {
    const trimmed = value.trim();
    setSaving(true);
    const result = await updateTask(task.id, { description: trimmed || null });
    setSaving(false);
    if (result) {
      toast("success", "Description updated");
      setLocalDesc(trimmed);
      setEditing(false);
    } else {
      toast("error", "Failed to update description");
      setValue(task.description || "");
    }
  };

  const cancel = () => { setValue(task.description || ""); setEditing(false); };

  const displayText = editing ? value : localDesc;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Description</h2>
        {canModify && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-kairos-600 hover:text-kairos-700 font-medium transition-colors"
          >
            {localDesc ? "Edit" : "Add description"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Describe the task in detail..."
            maxLength={10000}
            currentLength={value.length}
            disabled={saving}
            rows={5}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save} loading={saving}>Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>Cancel</Button>
          </div>
        </div>
      ) : localDesc ? (
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{localDesc}</p>
      ) : (
        <p className="text-gray-400 text-sm italic">
          {isCreator ? "Add a description to provide more context." : "No description provided."}
        </p>
      )}
    </section>
  );
}

function LabelsSection({ task, canModify }: { task: any; canModify: boolean }) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(task.labels.map((l: any) => l.id));
  const [saving, setSaving] = useState(false);
  const { data: allLabels } = useLabels();
  const { updateTask } = useTaskMutations();
  const { toast } = useToast();

  useEffect(() => { setSelected(task.labels.map((l: any) => l.id)); }, [task.labels]);

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    const result = await updateTask(task.id, { label_ids: selected });
    setSaving(false);
    if (result) { toast("success", "Labels updated"); setEditing(false); }
    else toast("error", "Failed to update labels");
  };

  const labelConfig: Record<string, { dot: string; bg: string }> = {
    Frontend: { dot: "bg-blue-500", bg: "bg-blue-100 text-blue-700" },
    Backend: { dot: "bg-orange-500", bg: "bg-orange-100 text-orange-700" },
    Bug: { dot: "bg-pink-500", bg: "bg-pink-100 text-pink-700" },
    Feature: { dot: "bg-violet-500", bg: "bg-violet-100 text-violet-700" },
    Research: { dot: "bg-yellow-500", bg: "bg-yellow-100 text-yellow-700" },
    Documentation: { dot: "bg-gray-500", bg: "bg-gray-200 text-gray-700" },
    Urgent: { dot: "bg-red-500", bg: "bg-red-100 text-red-700" },
  };

  const currentLabels = (allLabels || []).filter((l) => selected.includes(l.id));

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Labels</h2>
        {canModify && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-kairos-600 hover:text-kairos-700 font-medium transition-colors"
          >
            {currentLabels.length > 0 ? "Edit" : "Add labels"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(allLabels || []).map((l) => {
              const cfg = labelConfig[l.name] || { dot: "bg-gray-400", bg: "bg-gray-100 text-gray-600" };
              const active = selected.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => toggle(l.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
                    active
                      ? `${cfg.bg} border-current/20 shadow-sm`
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {l.name}
                  {active && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save} loading={saving}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setSelected(task.labels.map((l: any) => l.id)); setEditing(false); }} disabled={saving}>Cancel</Button>
          </div>
        </div>
      ) : currentLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {currentLabels.map((l) => {
            const cfg = labelConfig[l.name] || { dot: "bg-gray-400", bg: "bg-gray-100 text-gray-600" };
            return (
              <span key={l.id} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {l.name}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No labels assigned.</p>
      )}
    </section>
  );
}

function CommentsSection({ taskId, user, isCreator }: { taskId: string; user: any; isCreator: boolean }) {
  const { data: comments, loading, posting, addComment, editComment, deleteComment } = useComments(taskId);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    const result = await addComment(message.trim());
    if (result) { setMessage(""); toast("success", "Comment added"); }
    else toast("error", "Failed to add comment");
    inputRef.current?.focus();
  };

  const handleEdit = async (id: string) => {
    if (!editText.trim()) return;
    const result = await editComment(id, editText.trim());
    if (result) { setEditingId(null); toast("success", "Comment updated"); }
    else toast("error", "Failed to update comment");
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteComment(id);
    if (ok) { setConfirmDelete(null); toast("success", "Comment deleted"); }
    else toast("error", "Failed to delete comment");
  };

  const canDelete = (comment: any) =>
    comment.user_id === user?.id || isCreator;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Comments</h2>

      <div className="space-y-3 mb-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton width="32px" height="32px" rounded="full" />
                <div><Skeleton width="100px" height="14px" /><Skeleton width="60px" height="12px" className="mt-1" /></div>
              </div>
              <Skeleton width="80%" height="14px" />
            </div>
          ))
        ) : comments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No comments yet. Be the first to comment.</p>
        ) : (
          [...comments].reverse().map((c: any) => (
            <div key={c.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kairos-500 to-kairos-700 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {c.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.user?.name}</p>
                    <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                {(c.user_id === user?.id || isCreator) && editingId !== c.id && (
                  <div className="flex items-center gap-2">
                    {c.user_id === user?.id && (
                      <button onClick={() => { setEditingId(c.id); setEditText(c.message); }} className="text-xs text-gray-400 hover:text-kairos-600 transition-colors">Edit</button>
                    )}
                    {canDelete(c) && (
                      <button onClick={() => setConfirmDelete(c.id)} className="text-xs text-gray-400 hover:text-coral-600 transition-colors">Delete</button>
                    )}
                  </div>
                )}
              </div>
              {editingId === c.id ? (
                <div className="space-y-2">
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value.slice(0, 2000))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-kairos-500 focus:ring-4 focus:ring-kairos-500/10 outline-none resize-none" rows={3} />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleEdit(c.id)} disabled={!editText.trim()}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.message}</p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="relative">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && message.trim()) handleSubmit(); }}
          placeholder="Add a comment..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-kairos-500 focus:ring-4 focus:ring-kairos-500/10 outline-none resize-none transition-all duration-200"
          rows={3}
        />
        <div className="flex items-center justify-between mt-2">
          <p className={`text-xs ${message.length > 1900 ? "text-coral-500" : message.length > 1600 ? "text-amber-500" : "text-gray-400"}`}>
            {message.length} / 2000
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:block">Ctrl+Enter</span>
            <Button size="sm" onClick={handleSubmit} disabled={!message.trim()} loading={posting}>
              Comment
            </Button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete comment?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const eventConfig: Record<string, { label: string; icon: any; bg: string }> = {
  task_created: { label: "created", icon: Plus, bg: "bg-kairos-500" },
  task_assigned: { label: "assigned", icon: UserCheck2, bg: "bg-amber-500" },
  task_reassigned: { label: "reassigned", icon: UserCheck2, bg: "bg-amber-500" },
  task_unassigned: { label: "unassigned", icon: UserMinus, bg: "bg-gray-500" },
  task_claimed: { label: "claimed", icon: UserPlus, bg: "bg-teal-500" },
  status_changed: { label: "changed status of", icon: ArrowRight, bg: "bg-kairos-500" },
  task_submitted_for_review: { label: "submitted for review", icon: Send, bg: "bg-amber-500" },
  review_changes_requested: { label: "requested changes on", icon: RefreshCw, bg: "bg-coral-500" },
  task_approved_completed: { label: "completed", icon: Check, bg: "bg-teal-500" },
  task_cancelled: { label: "cancelled", icon: X, bg: "bg-coral-500" },
  task_reopened: { label: "reopened", icon: RotateCcw, bg: "bg-kairos-500" },
};

function TaskHistorySection({ taskId }: { taskId: string }) {
  const { data: history, loading } = useTaskHistory(taskId);

  if (loading) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Activity</h2>
        <div className="space-y-0 relative pl-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="relative pb-5 last:pb-0">
              <Skeleton width="28px" height="28px" rounded="full" className="absolute left-[-17px]" />
              <div className="pl-6 space-y-1"><Skeleton width="70%" height="14px" /><Skeleton width="40%" height="12px" /></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Activity</h2>
      {history.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">No activity recorded yet.</p>
      ) : (
        <div className="relative pl-8 max-h-[400px] overflow-y-auto">
          <div className="absolute left-[13px] top-2 bottom-2 w-[2px] bg-gray-200" />
          <div className="space-y-0">
            {[...history].reverse().map((entry, i) => {
              const config = eventConfig[entry.event_type] || eventConfig.task_created;
              const Icon = config.icon;
              return (
                <div key={entry.id} className="relative pb-5 last:pb-0">
                  <div className={`absolute left-[-17px] top-0 w-7 h-7 rounded-full ${config.bg} text-white flex items-center justify-center z-10 ring-4 ring-white`}>
                    <Icon size={13} />
                  </div>
                  <div className="pl-6">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{entry.user?.name || "Someone"}</span>{" "}
                      {config.label} this task
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    {entry.details?.reason && (
                      <p className="text-xs text-gray-500 mt-1 italic">{entry.details.reason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function AssigneeCard({ task, user, isCreator, onUpdate }: { task: any; user: any; isCreator: boolean; onUpdate?: () => void }) {
  const { data: users } = useUsers();
  const [dropdown, setDropdown] = useState(false);
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { assignTask, reassignTask, unassignTask, claimTask } = useTaskMutations();
  const { toast } = useToast();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setDropdown(false); } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const isAssigned = !!task.assigned_to;
  const isPublicUnassigned = !isAssigned && task.visibility === "public";
  const needsAssignee = !isAssigned && task.status === "in_progress";
  const canUnassign = isCreator && isAssigned && (task.status === "pending" || task.status === "in_progress");
  const canClaim = !isCreator && isPublicUnassigned && task.status !== "completed" && task.status !== "cancelled";

  const handleAssign = async (uid: string) => {
    if (isAssigned && task.status === "in_progress") {
      setPendingId(uid);
      setShowReason(true);
      setDropdown(false);
      return;
    }
    const fn = isAssigned ? reassignTask : assignTask;
    const result = await fn(task.id, uid);
    if (result) { toast("success", "Assignee updated"); onUpdate?.(); }
    else toast("error", "Failed to update assignee");
    setDropdown(false);
  };

  const handleReassignWithReason = async () => {
    if (!pendingId || !reason.trim()) return;
    const result = await reassignTask(task.id, pendingId, reason.trim());
    if (result) { toast("success", "Task reassigned"); setShowReason(false); setReason(""); onUpdate?.(); }
    else toast("error", "Failed to reassign");
  };

  const handleUnassign = async () => {
    const result = await unassignTask(task.id);
    if (result) { toast("success", "Assignee removed"); onUpdate?.(); }
    else toast("error", "Failed to unassign");
  };

  const handleClaim = async () => {
    const result = await claimTask(task.id);
    if (result) { toast("success", "Task claimed"); onUpdate?.(); }
    else toast("error", "Failed to claim");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</h3>
        {needsAssignee && <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 uppercase tracking-wider">Needs Assignee</span>}
      </div>

      {isAssigned ? (
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kairos-500 to-kairos-700 text-white flex items-center justify-center text-sm font-semibold shrink-0">
            {task.assigned_to.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{task.assigned_to.name}</p>
            <p className="text-xs text-gray-500 truncate">{task.assigned_to.email}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-3">No assignee yet.</p>
      )}

      {isCreator && (
        <div className="relative" ref={ref}>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => setDropdown(!dropdown)}>
            {isAssigned ? "Reassign" : "Assign"}
          </Button>
          {dropdown && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 max-h-48 overflow-y-auto">
              {(users || []).filter((u: any) => !isAssigned || u.id !== task.assigned_to?.id).map((u: any) => (
                <button key={u.id} onClick={() => handleAssign(u.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-kairos-500 to-kairos-700 text-white flex items-center justify-center text-[10px] font-semibold shrink-0">{u.name?.charAt(0).toUpperCase()}</div>
                  <span className="truncate">{u.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {canUnassign && (
        <button onClick={handleUnassign} className="w-full mt-2 text-center text-xs text-gray-400 hover:text-coral-600 transition-colors">Remove assignee</button>
      )}

      {canClaim && (
        <Button size="sm" className="w-full" variant="primary" onClick={handleClaim}>Claim Task</Button>
      )}

      {showReason && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReason(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reassignment reason</h3>
            <p className="text-xs text-gray-500 mb-3">Required for In Progress tasks.</p>
            <textarea value={reason} onChange={e => setReason(e.target.value.slice(0, 1000))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-kairos-500 focus:ring-4 focus:ring-kairos-500/10 outline-none resize-none" rows={3} placeholder="Why is this task being reassigned?" />
            <div className="flex justify-end gap-2 mt-3">
              <Button size="sm" variant="ghost" onClick={() => { setShowReason(false); setReason(""); }}>Cancel</Button>
              <Button size="sm" onClick={handleReassignWithReason} disabled={!reason.trim()}>Reassign</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowCard({ task, user, isCreator }: { task: any; user: any; isCreator: boolean }) {
  const [modal, setModal] = useState<{ type: string } | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const { changeStatus } = useTaskMutations();
  const { toast } = useToast();

  const isAssignee = task.assigned_to?.id === user?.id;
  const status = optimisticStatus || task.status;

  type Action = { label: string; variant: "primary" | "secondary" | "danger"; modal?: string | null; disabled?: boolean; disabledReason?: string };
  const actions: Action[] = [];

  if (isAssignee && status === "pending") actions.push({ label: "Start Work", variant: "primary", modal: null });
  if (isAssignee && status === "in_progress") actions.push({ label: "Submit for Review", variant: "primary", modal: "review" });
  if (isCreator && status === "ready_for_review") {
    actions.push({ label: "Approve & Complete", variant: "primary", modal: null });
    actions.push({ label: "Request Changes", variant: "secondary", modal: "changes" });
  }
  if (isCreator && ["pending", "in_progress", "ready_for_review"].includes(status)) {
    actions.push({ label: "Cancel Task", variant: "danger", modal: "cancel" });
  }
  if (isCreator && status === "cancelled") actions.push({ label: "Reopen Task", variant: "secondary", modal: "reopen" });
  if (status === "completed") actions.push({ label: "Completed", variant: "primary", disabled: true, disabledReason: "This task is complete and cannot be modified" });

  const getStatusFromType = (modalType: string | null): string | null => {
    if (!modalType) {
      if (status === "pending") return "in_progress";
      if (status === "ready_for_review") return "completed";
      return null;
    }
    if (modalType === "review") return "ready_for_review";
    if (modalType === "changes") return "in_progress";
    if (modalType === "cancel") return "cancelled";
    if (modalType === "reopen") return "pending";
    return null;
  };

  const execute = async (type: string | null) => {
    if (!type) {
      const newStatus = getStatusFromType(null);
      if (!newStatus) return;
      setOptimisticStatus(newStatus);
      setSaving(true);
      const result = await changeStatus(task.id, { status: newStatus });
      if (result) toast("success", `Status changed to ${newStatus.replace(/_/g, " ")}`);
      else { toast("error", "Failed to change status"); setOptimisticStatus(null); }
      setSaving(false);
      return;
    }
    setModal({ type });
  };

  const submitModal = async () => {
    if (!modal) return;
    const newStatus = getStatusFromType(modal.type);
    setOptimisticStatus(newStatus);
    setSaving(true);
    let body: any = {};
    if (modal.type === "review") body = { status: "ready_for_review", completion_note: note };
    else if (modal.type === "changes") body = { status: "in_progress", review_feedback: note };
    else if (modal.type === "cancel") body = { status: "cancelled", cancellation_reason: note || "Cancelled" };
    else if (modal.type === "reopen") body = { status: "pending", reopen_reason: note || undefined };

    const result = await changeStatus(task.id, body);
    setSaving(false);
    if (result) { toast("success", "Status updated"); setModal(null); setNote(""); }
    else { toast("error", "Failed to update status"); setOptimisticStatus(null); }
  };

  const modalTitle = modal?.type === "review" ? "Submit for Review" : modal?.type === "changes" ? "Request Changes" : modal?.type === "cancel" ? "Cancel Task" : modal?.type === "reopen" ? "Reopen Task" : "";
  const modalPlaceholder = modal?.type === "review" ? "Describe what you've completed..." : modal?.type === "changes" ? "Provide feedback on what needs to change..." : modal?.type === "cancel" ? "Explain why this task is being cancelled..." : modal?.type === "reopen" ? "Reason for reopening (optional)..." : "";
  const requireNote = modal?.type !== "reopen";
  const maxChars = modal?.type === "cancel" || modal?.type === "reopen" ? 1000 : 2000;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Workflow</h3>

      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2.5 h-2.5 rounded-full ${status === "completed" ? "bg-teal-500" : status === "cancelled" ? "bg-coral-500" : status === "ready_for_review" ? "bg-amber-500" : status === "in_progress" ? "bg-kairos-500" : "bg-gray-400"}`} />
        <span className="text-sm font-medium text-gray-700">{status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
      </div>

      {status === "completed" && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-center">
          <p className="text-sm font-medium text-teal-700">✓ Completed</p>
          <p className="text-xs text-teal-600 mt-0.5">This task is done and cannot be modified.</p>
        </div>
      )}

      {actions.length > 0 && (
        <div className="space-y-2">
          {actions.map((a) => (
            <Button key={a.label} variant={a.disabled ? "secondary" : a.variant} size="sm" className="w-full" disabled={a.disabled || saving} onClick={() => execute(a.modal ?? null)} title={a.disabledReason}>
              {a.label}
            </Button>
          ))}
        </div>
      )}

      {!isCreator && !isAssignee && status !== "completed" && !task.assigned_to && (
        <p className="text-xs text-gray-400 text-center">Claim this task to start working on it.</p>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setModal(null); setNote(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{modalTitle}</h3>
            {requireNote && <p className="text-xs text-gray-500 mb-3">This field is required.</p>}
            <textarea value={note} onChange={e => setNote(e.target.value.slice(0, maxChars))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-kairos-500 focus:ring-4 focus:ring-kairos-500/10 outline-none resize-none" rows={4} placeholder={modalPlaceholder} />
            <p className={`text-xs text-right mt-1 ${note.length > maxChars * 0.9 ? "text-coral-500" : "text-gray-400"}`}>{note.length} / {maxChars}</p>
            <div className="flex justify-end gap-2 mt-3">
              <Button size="sm" variant="ghost" onClick={() => { setModal(null); setNote(""); }}>Cancel</Button>
              <Button size="sm" onClick={submitModal} loading={saving} disabled={requireNote && !note.trim()}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: task, loading, error, refetch } = useTask(id);

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Skeleton width="120px" height="20px" />
            </div>
            <Skeleton width="70%" height="40px" className="mb-4" />
            <div className="flex items-center gap-3 mb-8">
              <Skeleton width="80px" height="28px" rounded="full" />
              <Skeleton width="80px" height="28px" rounded="full" />
              <Skeleton width="80px" height="28px" rounded="full" />
              <Skeleton width="100px" height="28px" rounded="full" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton width="100%" height="120px" rounded="xl" />
                <Skeleton width="100%" height="200px" rounded="xl" />
              </div>
              <div className="space-y-4">
                <Skeleton width="100%" height="140px" rounded="xl" />
                <Skeleton width="100%" height="180px" rounded="xl" />
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !task) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)] px-6">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-coral-50 to-coral-100 shadow-lg ring-8 ring-coral-50/50 mb-6">
                <FileSearch size={44} className="text-coral-400" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Task not found
              </h2>

              <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-sm">
                This task doesn&apos;t exist or you don&apos;t have access to it.
              </p>

              <div className="flex items-center gap-3">
                {error && (
                  <button
                    onClick={refetch}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    <RefreshCw size={15} />
                    Try Again
                  </button>
                )}
                <button
                  onClick={() => router.push("/tasks")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kairos-600 text-sm font-medium text-white hover:bg-kairos-700 transition-all duration-200 shadow-lg"
                >
                  <ListTodo size={15} />
                  Go to Tasks
                </button>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const isCreator = task.created_by?.id === user?.id;
  const canModify = isCreator && task.status !== "completed";

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <button
              onClick={() => router.push("/tasks")}
              className="flex items-center gap-1 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft size={16} />
              Tasks
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium truncate max-w-[300px]">{task.title}</span>
          </nav>

          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 mr-4">
              <EditableTitle title={task.title} taskId={task.id} canEdit={isCreator} />
            </div>
            {isCreator && (
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0"
                onClick={() => router.push(`/tasks/${task.id}/edit`)}
              >
                <Edit size={15} />
                Edit Details
              </Button>
            )}
          </div>

          {/* Meta Bar */}
          <div className="flex items-center gap-2.5 mb-8 flex-wrap">
            <StatusBadge status={task.status as any} />
            <div className="w-px h-5 bg-gray-200" />
            <PriorityBadge priority={task.priority as any} />
            <div className="w-px h-5 bg-gray-200" />
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
              task.visibility === "private"
                ? "bg-gray-50 text-gray-600 border-gray-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {task.visibility === "private" ? <Lock size={11} /> : <Globe size={11} />}
              {task.visibility === "private" ? "Private" : "Public"}
            </span>
            <div className="w-px h-5 bg-gray-200" />
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500" title={task.created_at}>
              <Clock size={11} />
              {formatDate(task.created_at)}
            </span>
            {task.completed_at && (
              <>
                <div className="w-px h-5 bg-gray-200" />
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200" title={task.completed_at}>
                  <CalendarCheck size={11} />
                  Completed {formatDate(task.completed_at)}
                </span>
              </>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <DescriptionSection task={task} isCreator={isCreator} canModify={canModify} />

              {/* Labels */}
              <LabelsSection task={task} canModify={canModify} />

              {/* Comments */}
              <CommentsSection taskId={task.id} user={user} isCreator={isCreator} />

              {/* History */}
              <TaskHistorySection taskId={task.id} />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Assignee Card */}
              <AssigneeCard task={task} user={user} isCreator={isCreator} onUpdate={refetch} />

              {/* Workflow Card */}
              <WorkflowCard task={task} user={user} isCreator={isCreator} />

              {/* Labels Card — sidebar */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Labels</h3>
                {task.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map((l) => (
                      <span key={l.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                        {l.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">None</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

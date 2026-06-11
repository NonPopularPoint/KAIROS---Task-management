import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export function useTaskMutations() {
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    try {
      return await fn();
    } catch (err: any) {
      console.error("[useTaskMutations] error:", err?.status, err?.message, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = (data: Record<string, any>) =>
    mutate(() => api.post("/tasks", data));

  const updateTask = (id: string, data: Record<string, any>) =>
    mutate(() => api.put(`/tasks/${id}`, data));

  const changeStatus = (id: string, data: Record<string, any>) =>
    mutate(() => api.patch(`/tasks/${id}/status`, data));

  const assignTask = (id: string, assigneeId: string) =>
    mutate(() => api.patch(`/tasks/${id}/assign`, { assignee_id: assigneeId }));

  const reassignTask = (id: string, assigneeId: string, reason?: string) =>
    mutate(() => api.patch(`/tasks/${id}/reassign`, { assignee_id: assigneeId, reassignment_reason: reason }));

  const unassignTask = (id: string) =>
    mutate(() => api.patch(`/tasks/${id}/unassign`, {}));

  const claimTask = (id: string) =>
    mutate(() => api.patch(`/tasks/${id}/claim`, {}));

  const changeVisibility = (id: string, visibility: string) =>
    mutate(() => api.patch(`/tasks/${id}/visibility`, { visibility }));

  return { loading, createTask, updateTask, changeStatus, assignTask, reassignTask, unassignTask, claimTask, changeVisibility };
}

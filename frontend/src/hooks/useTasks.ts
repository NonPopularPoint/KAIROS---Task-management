import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

interface TaskFilters {
  status?: string[];
  priority?: string[];
  visibility?: string;
  label_ids?: string[];
  assignee_filter?: string;
  search?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  visibility: string;
  created_by: { id: string; name: string; email: string; avatar_url: string | null };
  assigned_to: { id: string; name: string; email: string; avatar_url: string | null } | null;
  labels: { id: string; name: string }[];
  created_at: string;
  completed_at: string | null;
}

interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

export function useTasks(filters: TaskFilters = {}) {
  const [data, setData] = useState<TasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRef = useRef(0);

  useEffect(() => {
    const id = ++latestRef.current;

    const fetchTasks = async () => {
      setError(null);
      setLoading(true);

      try {
        const params = new URLSearchParams();
        const addList = (key: string, val: any) => {
          if (Array.isArray(val)) val.forEach((v: string) => params.append(key, v));
          else if (val) params.append(key, val);
        };
        addList("status", filters.status);
        addList("priority", filters.priority);
        if (filters.visibility) params.set("visibility", filters.visibility);
        addList("label_ids", filters.label_ids);
        if (filters.assignee_filter) params.set("assignee_filter", filters.assignee_filter);
        if (filters.search) params.set("search", filters.search);
        if (filters.sort) params.set("sort", filters.sort);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.per_page) params.set("per_page", String(filters.per_page));

        const qs = params.toString();
        const result = await api.get<TasksResponse>(`/tasks${qs ? `?${qs}` : ""}`);

        if (id !== latestRef.current) return;

        setError(null);
        setData(result);
      } catch (err: any) {
        if (id !== latestRef.current) return;
        setError(err.message || "Failed to fetch tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [JSON.stringify(filters)]);

  const refetch = useCallback(() => {
    const id = ++latestRef.current;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const result = await api.get<TasksResponse>("/tasks");
        if (id !== latestRef.current) return;
        setData(result);
      } catch (err: any) {
        if (id !== latestRef.current) return;
        setError(err.message || "Failed to fetch tasks");
      } finally {
        if (id === latestRef.current) setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error, refetch };
}

export function useTask(id: string | undefined) {
  const [data, setData] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    const reqId = ++latestRef.current;

    (async () => {
      setError(null);
      setLoading(true);
      try {
        const result = await api.get<Task>(`/tasks/${id}`);
        if (reqId !== latestRef.current) return;
        setError(null);
        setData(result);
      } catch (err: any) {
        if (reqId !== latestRef.current) return;
        setError(err.message || "Failed to fetch task");
      } finally {
        if (reqId === latestRef.current) setLoading(false);
      }
    })();
  }, [id]);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<Task>(`/tasks/${id}`);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch task");
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { data, loading, error, refetch };
}

export function useTaskHistory(taskId: string | undefined) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRef = useRef(0);

  useEffect(() => {
    if (!taskId) return;
    const reqId = ++latestRef.current;

    (async () => {
      setError(null);
      setLoading(true);
      try {
        const result = await api.get<{ history: any[] }>(`/tasks/${taskId}/history`);
        if (reqId !== latestRef.current) return;
        setError(null);
        setData(result.history);
      } catch (err: any) {
        if (reqId !== latestRef.current) return;
        setError(err.message || "Failed to fetch history");
      } finally {
        if (reqId === latestRef.current) setLoading(false);
      }
    })();
  }, [taskId]);

  return { data, loading, error, refetch: () => {} };
}

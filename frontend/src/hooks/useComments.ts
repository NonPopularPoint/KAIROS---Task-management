import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string | null;
  user: { id: string; name: string; email: string; avatar_url: string | null };
}

export function useComments(taskId: string | undefined) {
  const [data, setData] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const fetch = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<{ comments: Comment[] }>(`/tasks/${taskId}/comments`);
      setData(result.comments);
    } catch (err: any) {
      setError(err.message || "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addComment = async (message: string) => {
    if (!taskId) return null;
    setPosting(true);
    try {
      const result = await api.post<Comment>(`/tasks/${taskId}/comments`, { message });
      setData((prev) => [...prev, result]);
      return result;
    } catch {
      return null;
    } finally {
      setPosting(false);
    }
  };

  const editComment = async (commentId: string, message: string) => {
    try {
      const result = await api.put<Comment>(`/comments/${commentId}`, { message });
      setData((prev) => prev.map((c) => (c.id === commentId ? result : c)));
      return result;
    } catch {
      return null;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setData((prev) => prev.filter((c) => c.id !== commentId));
      return true;
    } catch {
      return false;
    }
  };

  return { data, loading, posting, error, addComment, editComment, deleteComment, refetch: fetch };
}

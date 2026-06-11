import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface Metrics {
  total: number;
  pending: number;
  in_progress: number;
  ready_for_review: number;
  completed: number;
  cancelled: number;
  assigned_to_me: number;
  created_by_me: number;
  unassigned_public: number;
}

interface ChartDay {
  day: string;
  count: number;
}

interface ActivityItem {
  id: string;
  task_id: string;
  event_type: string;
  user_id: string;
  details: any;
  created_at: string;
  user: { id: string; name: string; email: string; avatar_url: string | null };
}

export function useDashboardMetrics() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<{ metrics: Metrics }>("/dashboard/metrics");
      setData(result.metrics);
    } catch (err: any) {
      setError(err.message || "Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useRecentActivity() {
  const [data, setData] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<{ activity: ActivityItem[] }>("/dashboard/recent-activity");
      setData(result.activity);
    } catch (err: any) {
      setError(err.message || "Failed to fetch activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useWeeklyChart() {
  const [data, setData] = useState<ChartDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<{ chart: ChartDay[] }>("/dashboard/weekly-chart");
      setData(result.chart);
    } catch (err: any) {
      setError(err.message || "Failed to fetch chart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface Label {
  id: string;
  name: string;
}

export function useLabels() {
  const [data, setData] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<{ labels: Label[] }>("/labels");
      setData(result.labels);
    } catch (err: any) {
      setError(err.message || "Failed to fetch labels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

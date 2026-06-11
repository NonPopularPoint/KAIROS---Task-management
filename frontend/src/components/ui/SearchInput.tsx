"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
}

export function SearchInput({ value, onChange, placeholder = "Search tasks...", debounceMs = 300, loading }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), debounceMs);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="relative w-full">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-10 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-kairos-500 focus:ring-4 focus:ring-kairos-500/10 transition-all duration-200 outline-none"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2 size={16} className="animate-spin text-gray-400" />
        ) : local ? (
          <button onClick={() => { setLocal(""); onChange(""); }} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";

interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ label, options, values, onChange, placeholder = "Select..." }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (val: string) => {
    if (values.includes(val)) onChange(values.filter((v) => v !== val));
    else onChange([...values, val]);
  };

  const selectedLabels = options.filter((o) => values.includes(o.value)).map((o) => o.label);

  return (
    <div className="relative" ref={ref}>
      {label && <p className="block text-sm font-medium text-gray-700 mb-1.5">{label}</p>}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-left hover:border-gray-400 transition-colors min-h-[42px]"
      >
        <span className={selectedLabels.length ? "text-gray-900" : "text-gray-400"}>
          {selectedLabels.length ? selectedLabels.join(", ") : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.map((l) => (
            <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-kairos-100 text-kairos-700 text-xs font-medium">
              {l}
              <button onClick={() => toggle(options.find((o) => o.label === l)?.value || "")} className="hover:text-kairos-900">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-kairos-50 transition-colors"
              >
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  values.includes(opt.value) ? "bg-kairos-500 border-kairos-500" : "border-gray-300"
                }`}>
                  {values.includes(opt.value) && <span className="text-white text-xs">✓</span>}
                </span>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

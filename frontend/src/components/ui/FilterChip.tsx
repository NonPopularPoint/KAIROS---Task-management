import { X } from "lucide-react";

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-kairos-100 text-kairos-700 text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-kairos-900">
        <X size={12} />
      </button>
    </span>
  );
}

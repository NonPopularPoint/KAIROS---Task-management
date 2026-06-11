"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterChip } from "@/components/ui/FilterChip";
import { useLabels } from "@/hooks/useLabels";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready_for_review", label: "Ready For Review" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const visibilityOptions = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
];

const sortOptions = [
  { value: "newest_first", label: "Newest First" },
  { value: "oldest_first", label: "Oldest First" },
  { value: "priority_high_to_low", label: "Priority: High to Low" },
  { value: "priority_low_to_high", label: "Priority: Low to High" },
];

const assigneeFilters = [
  { key: "assigned_to_me", label: "Assigned to Me" },
  { key: "created_by_me", label: "Created by Me" },
  { key: "unassigned", label: "Unassigned" },
];

interface TaskFiltersProps {
  onChange: (filters: Record<string, any>) => void;
}

export function TaskFilters({ onChange }: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: labels } = useLabels();

  const labelOptions = useMemo(
    () => (labels || []).map((l) => ({ value: l.id, label: l.name })),
    [labels]
  );

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statuses, setStatuses] = useState<string[]>(searchParams.getAll("status"));
  const [priority, setPriority] = useState(searchParams.get("priority") || "");
  const [visibility, setVisibility] = useState(searchParams.get("visibility") || "");
  const [selectedLabels, setSelectedLabels] = useState<string[]>(searchParams.getAll("label_ids"));
  const [assigneeFilter, setAssigneeFilter] = useState(searchParams.get("assignee_filter") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest_first");

  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const updateURL = useCallback(
    (updates: Record<string, any>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        params.delete(key);
        if (Array.isArray(val)) val.forEach((v: string) => params.append(key, v));
        else if (val) params.set(key, val);
      });
      router.replace(`/tasks?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (v: string) => {
      setSearch(v);
      updateURL({ search: v || null });
    },
    [updateURL]
  );

  const toggleStatus = (s: string) => {
    const next = statuses.includes(s) ? statuses.filter((v) => v !== s) : [...statuses, s];
    setStatuses(next);
    updateURL({ status: next });
  };

  const setPriorityFn = (p: string) => {
    setPriority(p);
    setPriorityOpen(false);
    updateURL({ priority: p || null });
  };

  const setVisibilityFn = (v: string) => {
    setVisibility(v === visibility ? "" : v);
    updateURL({ visibility: v === visibility ? null : v });
  };

  const toggleLabel = (id: string) => {
    const next = selectedLabels.includes(id) ? selectedLabels.filter((l) => l !== id) : [...selectedLabels, id];
    setSelectedLabels(next);
    updateURL({ label_ids: next });
  };

  const setAssigneeFilterFn = (key: string) => {
    const next = assigneeFilter === key ? "" : key;
    setAssigneeFilter(next);
    updateURL({ assignee_filter: next || null });
  };

  const setSortFn = (s: string) => {
    setSort(s);
    setSortOpen(false);
    updateURL({ sort: s });
  };

  const clearAll = () => {
    setSearch("");
    setStatuses([]);
    setPriority("");
    setVisibility("");
    setSelectedLabels([]);
    setAssigneeFilter("");
    router.replace("/tasks", { scroll: false });
  };

  useEffect(() => {
    onChange({ search, status: statuses, priority, visibility, label_ids: selectedLabels, assignee_filter: assigneeFilter, sort });
  }, [search, statuses, priority, visibility, selectedLabels, assigneeFilter, sort, onChange]);

  const activeChips: { label: string; onRemove: () => void }[] = [];
  statuses.forEach((s) => activeChips.push({ label: `Status: ${statusOptions.find((o) => o.value === s)?.label || s}`, onRemove: () => toggleStatus(s) }));
  if (priority) activeChips.push({ label: `Priority: ${priorityOptions.find((o) => o.value === priority)?.label || priority}`, onRemove: () => setPriorityFn("") });
  if (visibility) activeChips.push({ label: `Visibility: ${visibility}`, onRemove: () => setVisibilityFn(visibility) });
  selectedLabels.forEach((id) => {
    const lbl = labelOptions.find((l) => l.value === id);
    if (lbl) activeChips.push({ label: `Label: ${lbl.label}`, onRemove: () => toggleLabel(id) });
  });
  if (assigneeFilter) {
    const af = assigneeFilters.find((f) => f.key === assigneeFilter);
    if (af) activeChips.push({ label: af.label, onRemove: () => setAssigneeFilterFn(assigneeFilter) });
  }

  const Dropdown = ({
    open,
    setOpen,
    label,
    options,
    selected,
    onSelect,
    multi,
  }: {
    open: boolean; setOpen: (v: boolean) => void; label: string;
    options: { value: string; label: string }[]; selected: string[]; onSelect: (v: string) => void; multi?: boolean;
  }) => (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors shrink-0"
      >
        {open ? null : <SlidersHorizontal size={14} />}
        {label}
        {selected.length > 0 && (
          <span className="w-2 h-2 rounded-full bg-kairos-500" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 max-h-64 overflow-y-auto">
            {multi && selected.length > 0 && (
              <button onClick={() => options.forEach((o) => onSelect(o.value))} className="w-full text-left px-3 py-1.5 text-xs text-kairos-600 hover:bg-kairos-50">
                Clear
              </button>
            )}
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSelect(opt.value)}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  selected.includes(opt.value) ? "text-kairos-700 bg-kairos-50 font-medium" : "text-gray-700"
                }`}
              >
                {opt.label}
                {selected.includes(opt.value) && <span className="text-kairos-500">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-3 mb-6">
      {/* Search + Filter Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-md">
          <SearchInput value={search} onChange={handleSearch} placeholder="Search by title or description..." />
        </div>

        <Dropdown open={statusOpen} setOpen={setStatusOpen} label="Status" options={statusOptions} selected={statuses} onSelect={toggleStatus} multi />
        <Dropdown open={priorityOpen} setOpen={setPriorityOpen} label="Priority" options={priorityOptions} selected={priority ? [priority] : []} onSelect={setPriorityFn} />
        <Dropdown open={labelOpen} setOpen={setLabelOpen} label="Labels" options={labelOptions} selected={selectedLabels} onSelect={toggleLabel} multi />
        <Dropdown open={sortOpen} setOpen={setSortOpen} label="Sort" options={sortOptions} selected={[sort]} onSelect={setSortFn} />

        <div className="h-8 w-px bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-1">
          {assigneeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setAssigneeFilterFn(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 ${
                assigneeFilter === f.key
                  ? "bg-kairos-100 text-kairos-700 border border-kairos-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visibilityOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setVisibilityFn(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize shrink-0 border ${
              visibility === opt.value
                ? "bg-kairos-100 text-kairos-700 border-kairos-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeChips.map((chip, i) => (
            <FilterChip key={i} label={chip.label} onRemove={chip.onRemove} />
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors ml-1"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

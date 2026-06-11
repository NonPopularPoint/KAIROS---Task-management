"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ChevronDown, User, LogOut, LayoutDashboard, ListTodo, Columns3, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTask } from "@/hooks/useTasks";

interface HeaderProps {
  onMenuClick: () => void;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: ListTodo, label: "Tasks" },
  { href: "/board", icon: Columns3, label: "Board" },
  { href: "/employees", icon: Users, label: "Team" },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Tasks",
  "/board": "Board",
  "/employees": "Team",
  "/profile": "Profile",
};

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const taskIdMatch = pathname.match(/^\/tasks\/([a-f0-9-]+)$/);
  const { data: task } = useTask(taskIdMatch?.[1]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const currentPage = task ? task.title : (pageTitles[pathname] || "KAIROS");

  const hoveredItem = navItems.find((i) => i.href === hoveredNav);
  const displayTitle = hoveredItem ? hoveredItem.label : currentPage;
  const isHovering = !!hoveredItem;

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-30">
      <div className="rounded-2xl shadow-xl border flex items-center" style={{ backgroundColor: "#F5F0EB", borderColor: "#D8D4CF" }}>
        {/* Title + Nav section */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 rounded-xl hover:bg-white/50 transition-colors shrink-0"
            style={{ color: "#8a857f" }}
          >
            <Menu size={18} />
          </button>

          <div className="w-2.5 h-2.5 rounded-full shrink-0 hidden sm:block" style={{ backgroundColor: "#B8C86B" }} />

          <div className="min-w-0 w-28">
            <motion.h1
              className="text-sm font-semibold truncate"
              style={{ color: "#2C2C2C" }}
              animate={{ opacity: isHovering ? 0.6 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {displayTitle}
            </motion.h1>
          </div>

          <div className="w-px h-6" style={{ backgroundColor: "#D8D4CF" }} />

          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  onMouseEnter={() => setHoveredNav(item.href)}
                  onMouseLeave={() => setHoveredNav(null)}
                  className={`p-2 rounded-xl transition-all duration-200 ${active ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
                  style={{ color: active ? "#2C2C2C" : "#8a857f" }}
                  title={item.label}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-7" style={{ backgroundColor: "#D8D4CF" }} />

        {/* Avatar section */}
        <div className="px-3 py-2.5">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/50 transition-all duration-200"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-7 h-7 rounded-full border-2 border-white/80 object-cover shadow-sm" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-kairos-500 to-kairos-700 text-white flex items-center justify-center text-[10px] font-semibold border-2 border-white/80 shadow-sm">
                  {initials}
                </div>
              )}
              <span className="text-xs font-medium hidden sm:block" style={{ color: "#2C2C2C" }}>{user?.name?.split(" ")[0]}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} style={{ color: "#8a857f" }} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border py-1.5 z-50"
                  style={{ backgroundColor: "#FFFFFF", borderColor: "#D8D4CF" }}
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="px-4 py-2.5 border-b" style={{ borderColor: "#EBE5DE" }}>
                    <p className="text-sm font-medium" style={{ color: "#2C2C2C" }}>{user?.name}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "#8a857f" }}>{user?.email}</p>
                  </div>
                  <button onClick={() => { router.push("/profile"); setDropdownOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors" style={{ color: "#6b6660" }}>
                    <User size={16} />
                    Profile
                  </button>
                  <button onClick={() => { logout(); setDropdownOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:!text-red-500 hover:!bg-red-50 rounded-b-2xl" style={{ color: "#6b6660" }}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

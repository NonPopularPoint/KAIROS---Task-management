"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ListTodo, Columns3, Users, User, LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/board", label: "Board", icon: Columns3 },
  { href: "/employees", label: "Team", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navigate = (href: string) => { router.push(href); onClose(); };
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl border backdrop-blur-xl"
            style={{ backgroundColor: "rgba(245, 240, 235, 0.95)", borderColor: "#D8D4CF" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#B8C86B" }}>
                <Image src="/logo.png" alt="KAIROS" width={32} height={32} className="w-8 h-8" />
                </div>
                <span className="text-sm font-semibold" style={{ color: "#2C2C2C" }}>KAIROS</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#8a857f" }}>
                <X size={18} />
              </button>
            </div>

            <div className="px-4 pb-6 pt-2">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: active ? "#FFFFFF" : "transparent",
                      color: active ? "#2C2C2C" : "#6b6660",
                      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
              <div className="mt-2 pt-3 border-t" style={{ borderColor: "#D8D4CF" }}>
                <div className="flex items-center justify-between px-3.5 py-2">
                  <div className="flex items-center gap-2.5">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kairos-500 to-kairos-700 text-white flex items-center justify-center text-xs font-semibold">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#2C2C2C" }}>{user?.name}</p>
                      <p className="text-xs" style={{ color: "#8a857f" }}>{user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { logout(); }} className="p-2 rounded-lg hover:bg-white/50 transition-colors" style={{ color: "#8a857f" }}>
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

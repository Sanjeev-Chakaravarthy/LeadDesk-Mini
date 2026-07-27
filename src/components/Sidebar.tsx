"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/utils/auth-client";
import Brand from "@/components/Brand";
import DigitalHeroesFooter from "@/components/DigitalHeroesFooter";

interface SidebarProps {
  workspaceName?: string;
}

export default function Sidebar({ workspaceName = "Loading..." }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeWorkspace, setActiveWorkspace] = useState(workspaceName);

  useEffect(() => {
    fetch("/api/workspace/stats")
      .then((res) => {
        if (res.status === 401) {
          fetch("/api/workspace/accept-invite", { method: "POST" })
            .then((r) => r.json())
            .then((d) => {
              if (d.joined) {
                window.location.reload();
              } else {
                router.push("/complete-setup");
              }
            })
            .catch(() => router.push("/complete-setup"));
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.workspaceName) {
          setActiveWorkspace(data.workspaceName);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "grid_view" },
    { name: "Leads", path: "/leads", icon: "contacts" },
    { name: "Analytics", path: "/analytics", icon: "analytics" },
    { name: "Settings", path: "/settings", icon: "settings" },
    { name: "Activity Log", path: "/activity-log", icon: "history" },
    { name: "How It Works", path: "/how-it-works", icon: "help_outline" },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-low py-lg px-md gap-xs border-r border-outline-variant fixed left-0 top-0 z-50">
      {/* Brand Header */}
      <div className="flex flex-col gap-base mb-xl px-xs">
        <Brand theme="light" showTagline={false} />
        <div className="mt-sm pt-xs border-t border-outline-variant/40">
          <p className="font-sans text-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">
            Agency Workspace
          </p>
          <p className="font-mono text-mono-data text-primary text-[13px] font-semibold truncate">
            {activeWorkspace}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-base">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-md px-sm py-xs transition-all duration-200 ${
                isActive
                  ? "bg-secondary-container text-primary font-semibold translate-x-1"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? "filled" : ""}`}>
                {item.icon}
              </span>
              <span className="font-sans text-label-sm text-[12px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto pt-lg border-t border-outline-variant/30 space-y-base">
        <Link
          href="/profile"
          className={`flex items-center gap-md px-sm py-xs text-on-surface-variant hover:bg-surface-container-highest transition-all ${
            pathname === "/profile" ? "bg-secondary-container text-primary font-semibold" : ""
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
          <span className="font-sans text-label-sm text-[12px]">Profile</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-md px-sm py-xs text-on-surface-variant hover:bg-surface-container-highest text-left transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-sans text-label-sm text-[12px]">Logout</span>
        </button>

        {/* Digital Heroes Attribution */}
        <DigitalHeroesFooter variant="sidebar" />
      </div>
    </aside>
  );
}

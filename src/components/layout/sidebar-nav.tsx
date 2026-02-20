"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  Upload,
  Calculator,
  BarChart3,
  Target,
  Users,
  Map,
  Building2,
  Shield,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { SessionUser } from "@/lib/types";

interface SidebarNavProps {
  user: SessionUser;
}

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/upload", label: "Upload CSV", icon: Upload },
  { href: "/budget", label: "Budget", icon: Calculator },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/goals", label: "Goals", icon: Target },
];

const adviserNavItems = [
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/mappings", label: "Mappings", icon: Map },
  { href: "/organisation", label: "Organisation", icon: Building2 },
];

const adminNavItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
];

export function SidebarNav({ user }: SidebarNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isAdviser = user.role === "ADVISER" || user.role === "OWNER";
  const isOwner = user.role === "OWNER";

  return (
    <aside
      className={cn(
        "hidden h-screen flex-col border-r bg-slate-900 text-white transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold">CashMap</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        <NavSection items={mainNavItems} pathname={pathname} collapsed={collapsed} />

        {isAdviser && (
          <>
            {!collapsed && (
              <div className="px-3 pt-4 pb-1 text-xs font-semibold uppercase text-slate-500">
                Adviser
              </div>
            )}
            <NavSection items={adviserNavItems} pathname={pathname} collapsed={collapsed} />
          </>
        )}

        {isOwner && (
          <>
            {!collapsed && (
              <div className="px-3 pt-4 pb-1 text-xs font-semibold uppercase text-slate-500">
                Admin
              </div>
            )}
            <NavSection items={adminNavItems} pathname={pathname} collapsed={collapsed} />
          </>
        )}
      </nav>

      {/* User */}
      {!collapsed && (
        <div className="border-t border-slate-700 p-4">
          <div className="text-sm font-medium truncate">{user.name ?? user.email}</div>
          <div className="text-xs text-slate-400 capitalize">{user.role.toLowerCase()}</div>
        </div>
      )}
    </aside>
  );
}

function NavSection({
  items,
  pathname,
  collapsed,
}: {
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
              collapsed && "justify-center"
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </>
  );
}

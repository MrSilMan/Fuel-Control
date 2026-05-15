"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Car,
  Users,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Fuel,
  X,
  KeyRound,
} from "lucide-react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useSidebar } from "./SidebarContext";

const navMain = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/logs",      label: "Registos",  icon: ClipboardList  },
];

const navAdmin = [
  { href: "/vehicles", label: "Viaturas",   icon: Car         },
  { href: "/drivers",  label: "Condutores", icon: Users       },
  { href: "/audit",    label: "Auditoria",  icon: ShieldCheck },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavItem({ href, label, icon: Icon, isActive, collapsed, onNavigate }: NavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-150",
        collapsed ? "justify-center w-10 h-10 mx-auto px-0" : "px-3 py-2.5",
        isActive
          ? "bg-white/8 text-white"
          : "text-white/40 hover:bg-white/5 hover:text-white/75"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#C44020]" />
      )}
      <Icon
        className={cn(
          "shrink-0 transition-colors",
          collapsed ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]",
          isActive ? "text-[#C44020]" : "text-white/35"
        )}
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-1 pt-4 pb-1.5 text-[9px] font-semibold tracking-[0.2em] uppercase text-white/20 select-none">
      {label}
    </p>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { data: session } = useSession();
  const { mobileOpen, setMobileOpen } = useSidebar();

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const userName = (session?.user as { name?: string })?.name ?? "";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex flex-col shrink-0 select-none",
          "bg-linear-to-b from-[#0D1526] via-[#101B2E] to-[#0B1020]",
          // Mobile: fixed overlay sliding in from left
          "fixed inset-y-0 left-0 z-50 w-57",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: in-flow, translate reset, width animation
          "lg:relative lg:inset-auto lg:z-auto lg:translate-x-0",
          "lg:transition-[width] lg:duration-300 lg:ease-in-out",
          collapsed ? "lg:w-15" : "lg:w-57"
        )}
      >
        {/* TAAG top accent bar */}
        <div className="h-0.75 shrink-0 bg-linear-to-r from-[#C44020] via-[#E55535] to-[#C44020]/30" />

        {/* Logo row */}
        <div
          className={cn(
            "flex items-center shrink-0 border-b border-white/5",
            collapsed ? "justify-center py-4" : "justify-between px-4 py-4"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="bg-[#C44020] rounded-xl p-1.75 shadow-lg shadow-[#C44020]/30">
                  <Fuel className="h-4 w-4 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.25 w-2.25 rounded-full bg-emerald-400 border-2 border-[#0D1526]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[13px] tracking-wide text-white leading-none truncate">
                  FuelControl
                </p>
                <p className="text-[8.5px] text-white/28 leading-none mt-0.75 tracking-[0.22em] uppercase">
                  TAAG Angola
                </p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="relative">
              <div className="bg-[#C44020] rounded-xl p-1.75 shadow-lg shadow-[#C44020]/30">
                <Fuel className="h-4 w-4 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.25 w-2.25 rounded-full bg-emerald-400 border-2 border-[#0D1526]" />
            </div>
          )}

          {!collapsed && (
            <>
              {/* Desktop collapse button */}
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="hidden lg:block rounded-lg p-1.5 text-white/20 hover:text-white/55 hover:bg-white/5 transition-colors shrink-0"
                aria-label="Colapsar menu"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>

              {/* Mobile close button */}
              <button
                type="button"
                onClick={closeMobile}
                className="lg:hidden rounded-lg p-1.5 text-white/20 hover:text-white/55 hover:bg-white/5 transition-colors shrink-0"
                aria-label="Fechar menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Expand button (collapsed, desktop only) */}
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-3 mb-1 rounded-lg p-1.5 text-white/20 hover:text-white/55 hover:bg-white/5 transition-colors"
            aria-label="Expandir menu"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto py-3", collapsed ? "px-2" : "px-3")}>
          {!collapsed && <SectionLabel label="Menu" />}

          <div className="space-y-0.5">
            {navMain.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={isActive(item.href)}
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            ))}
          </div>

          {isAdmin && (
            <>
              {!collapsed && <div className="mx-1 my-3 h-px bg-white/5" />}
              {!collapsed && <SectionLabel label="Gestão" />}
              <div className="space-y-0.5 mt-1">
                {navAdmin.map((item) => (
                  <NavItem
                    key={item.href}
                    {...item}
                    isActive={isActive(item.href)}
                    collapsed={collapsed}
                    onNavigate={closeMobile}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User profile footer */}
        <div
          className={cn(
            "shrink-0 border-t border-white/5",
            collapsed ? "py-3 flex justify-center" : "px-4 py-3"
          )}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white",
                  isAdmin
                    ? "bg-linear-to-br from-[#C44020] to-[#8A2D15]"
                    : "bg-linear-to-br from-[#334155] to-[#1E293B]"
                )}
              >
                {initials}
              </div>
              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                title="Alterar palavra-passe"
                className="rounded-lg p-1.5 text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors"
              >
                <KeyRound className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0",
                    isAdmin
                      ? "bg-linear-to-br from-[#C44020] to-[#8A2D15]"
                      : "bg-linear-to-br from-[#334155] to-[#1E293B]"
                  )}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-white/65 truncate leading-none">
                    {userName || "Utilizador"}
                  </p>
                  <p
                    className={cn(
                      "text-[9px] font-semibold uppercase tracking-widest mt-0.75 leading-none",
                      isAdmin ? "text-[#C44020]" : "text-white/30"
                    )}
                  >
                    {isAdmin ? "Administrador" : "Operador"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordOpen(true)}
                  title="Alterar palavra-passe"
                  className="rounded-lg p-1.5 text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors shrink-0"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[8px] text-white/14 tracking-widest uppercase mt-3">
                Combustível · v1.0
              </p>
            </>
          )}
        </div>
      </aside>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}

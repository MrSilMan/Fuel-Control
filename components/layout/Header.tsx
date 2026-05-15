"use client";

import { signOut, useSession } from "next-auth/react";
import { Moon, Sun, LogOut, Bell, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { setMobileOpen } = useSidebar();

  const userSession = session?.user as
    | { name?: string; email?: string; role?: string }
    | undefined;

  const initials = userSession?.name
    ? userSession.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const isAdmin = userSession?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-30 flex h-14.5 items-center justify-between border-b border-border/50 bg-card/95 backdrop-blur-md px-4 sm:px-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      {/* Left: hamburger (mobile) + page title */}
      <div className="min-w-0 flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        {isAdmin && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#C44020] bg-[#C44020]/8 border border-[#C44020]/20 rounded-full px-2.5 py-1 shrink-0">
            Admin
          </span>
        )}
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-foreground leading-none">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Alternar tema"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notification bell (admin) */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificações"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
          >
            <Bell className="h-4 w-4" />
          </Button>
        )}

        {userSession && (
          <>
            <div className="h-5 w-px bg-border mx-1" />

            {/* User info */}
            <div className="hidden sm:flex items-center gap-2.5 pl-1">
              <div
                className={cn(
                  "relative h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  "ring-[1.5px] shadow-sm",
                  isAdmin
                    ? "bg-linear-to-br from-[#C44020] to-[#8A2D15] ring-[#C44020]/30"
                    : "bg-linear-to-br from-[#334155] to-[#1E293B] ring-slate-400/20"
                )}
              >
                <span className="text-[11px] font-bold text-white leading-none select-none">
                  {initials}
                </span>
              </div>

              <div className="flex flex-col leading-none min-w-0">
                <span className="text-[13px] font-medium text-foreground leading-tight truncate max-w-32.5">
                  {userSession.name}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider mt-0.75",
                    isAdmin ? "text-[#C44020]" : "text-muted-foreground"
                  )}
                >
                  {isAdmin ? "Administrador" : "Operador"}
                </span>
              </div>
            </div>

            {/* Sign out */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Terminar sessão"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-lg ml-0.5"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface SidebarCtx {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarCtx>({
  mobileOpen: false,
  setMobileOpen: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

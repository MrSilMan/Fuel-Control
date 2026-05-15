"use client";

import { Header } from "@/components/layout/Header";
import { LogFilters } from "@/components/logs/LogFilters";
import { LogsTable } from "@/components/logs/LogsTable";
import { ExportButtons } from "@/components/logs/ExportButtons";
import { Button } from "@/components/ui/button";
import { useLogs } from "@/hooks/useLogs";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function LogsPage() {
  const { data: session } = useSession();
  const { logs, total, totalPages, loading, error, refetch } = useLogs();

  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === "ADMIN";
  const canDelete = isAdmin;
  const canEdit = isAdmin;

  async function handleDelete(id: string) {
    if (!confirm("Tem a certeza que pretende eliminar este registo?")) return;

    try {
      const res = await fetch(`/api/logs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao eliminar");
      toast({ variant: "success", title: "Registo eliminado" });
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Erro ao eliminar registo" });
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Registos de Combustível" />
      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm text-[var(--muted-foreground)]">
              Mapa de Controlo de Combustível
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons />
            <Link href="/logs/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Novo Registo
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <LogFilters />

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Table */}
        <LogsTable
          logs={logs}
          total={total}
          totalPages={totalPages}
          loading={loading}
          onDelete={handleDelete}
          canDelete={canDelete}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}

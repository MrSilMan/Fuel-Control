"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, ChevronLeft, ChevronRight, FilePlus, FilePen, FileX } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actorName: string | null;
  actorEmail: string | null;
  detail: string | null;
  createdAt: string;
}

const ACTION_META: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  CREATE: {
    label:     "Criação",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-700",
    icon:      FilePlus,
  },
  UPDATE: {
    label:     "Edição",
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700",
    icon:      FilePen,
  },
  DELETE: {
    label:     "Eliminação",
    className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/25 dark:text-red-300 dark:border-red-700",
    icon:      FileX,
  },
};

const ENTITY_LABELS: Record<string, string> = {
  FuelLog: "Registo",
  Vehicle: "Viatura",
  Driver:  "Condutor",
};

export default function AuditPage() {
  const [entries, setEntries]       = useState<AuditEntry[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search)       params.set("search", search);
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);

      const res  = await fetch(`/api/audit?${params}`);
      const json = await res.json();
      setEntries(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, entityFilter, actionFilter]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);
  useEffect(() => { setPage(1); }, [search, entityFilter, actionFilter]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Auditoria" />

      <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto">

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <Input
            className="max-w-xs h-9 rounded-xl text-sm"
            placeholder="Pesquisar utilizador ou detalhe…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FilterSelect
            value={entityFilter}
            onChange={setEntityFilter}
            title="Filtrar por entidade"
          >
            <option value="">Todas as entidades</option>
            <option value="FuelLog">Registos</option>
            <option value="Vehicle">Viaturas</option>
            <option value="Driver">Condutores</option>
          </FilterSelect>
          <FilterSelect
            value={actionFilter}
            onChange={setActionFilter}
            title="Filtrar por ação"
          >
            <option value="">Todas as ações</option>
            <option value="CREATE">Criação</option>
            <option value="UPDATE">Edição</option>
            <option value="DELETE">Eliminação</option>
          </FilterSelect>
          <span className="text-sm text-muted-foreground sm:ml-auto whitespace-nowrap">
            {total} evento{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-[#C44020]" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 opacity-30" />
            </div>
            <p className="font-medium">Nenhum evento encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl border border-border/60 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Data / Hora
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Utilizador
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Ação
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Entidade
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Detalhe
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border/40">
                  {entries.map((e) => {
                    const meta = ACTION_META[e.action];
                    const ActionIcon = meta?.icon ?? ShieldCheck;
                    return (
                      <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(e.createdAt), "dd/MM/yyyy", { locale: pt })}
                          <span className="ml-2 text-muted-foreground/60">
                            {format(new Date(e.createdAt), "HH:mm:ss")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground leading-none text-[13px]">
                            {e.actorName ?? "—"}
                          </p>
                          {e.actorEmail && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{e.actorEmail}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-2.5 py-1",
                              meta?.className ?? "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            <ActionIcon className="h-3 w-3" />
                            {meta?.label ?? e.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {ENTITY_LABELS[e.entity] ?? e.entity}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {e.detail ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-3">
              {entries.map((e) => {
                const meta = ACTION_META[e.action];
                const ActionIcon = meta?.icon ?? ShieldCheck;
                return (
                  <div
                    key={e.id}
                    className="bg-card rounded-2xl border border-border/60 p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-2.5 py-1",
                          meta?.className ?? "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        <ActionIcon className="h-3 w-3" />
                        {meta?.label ?? e.action}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                        {format(new Date(e.createdAt), "dd/MM HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {e.actorName ?? "—"}
                      <span className="text-xs text-muted-foreground font-normal ml-1.5">
                        · {ENTITY_LABELS[e.entity] ?? e.entity}
                      </span>
                    </p>
                    {e.detail && (
                      <p className="text-xs text-muted-foreground">{e.detail}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 w-8 p-0 rounded-xl"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  title,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <select
      title={title}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-xl border border-input bg-card text-foreground px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
    >
      {children}
    </select>
  );
}

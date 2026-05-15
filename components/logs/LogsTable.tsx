"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { useFilterStore } from "@/store/filterStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatLitres, cn } from "@/lib/utils";
import type { FuelLogWithRelations } from "@/hooks/useLogs";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Loader2,
  Fuel,
} from "lucide-react";
import Link from "next/link";

interface LogsTableProps {
  logs: FuelLogWithRelations[];
  total: number;
  totalPages: number;
  loading: boolean;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  canEdit?: boolean;
}

export function LogsTable({
  logs,
  total,
  totalPages,
  loading,
  onDelete,
  canDelete = false,
  canEdit = false,
}: LogsTableProps) {
  const { page, limit, setFilter } = useFilterStore();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<FuelLogWithRelations>[] = [
    {
      accessorKey: "vehicle.matricula",
      id: "matricula",
      header: "Matrícula",
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm text-foreground">
          {row.original.vehicle.matricula}
        </span>
      ),
    },
    {
      accessorKey: "vehicle.tipo",
      id: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-medium">
          {row.original.vehicle.tipo}
        </Badge>
      ),
    },
    {
      accessorKey: "driver.nome",
      id: "nome",
      header: "Condutor",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.driver.nome}</span>
      ),
    },
    {
      accessorKey: "driver.nMec",
      id: "nMec",
      header: "Nº Mec",
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground">{row.original.driver.nMec}</span>
      ),
    },
    {
      accessorKey: "driver.area",
      id: "area",
      header: "Área",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.driver.area}</span>
      ),
    },
    {
      accessorKey: "gasolina",
      header: "Gasolina",
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return val ? (
          <Badge variant="gasolina" className="font-mono">{formatLitres(val)}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      accessorKey: "gasoleo",
      header: "Gasóleo",
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return val ? (
          <Badge variant="gasoleo" className="font-mono">{formatLitres(val)}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      accessorKey: "data",
      header: "Data",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap text-foreground">
          {formatDate(row.original.data)}
          {row.original.hora && (
            <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">
              {row.original.hora}
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "observacao",
      header: "Observação",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground max-w-45 truncate block">
          {getValue<string>() ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          {canEdit && (
            <Link href={`/logs/${row.original.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-md"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: logs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-border/60 bg-muted/50"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap",
                        header.column.getCanSort() ? "cursor-pointer select-none" : "cursor-default"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-muted-foreground/50">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-[#CC1422]" />
                    <p className="text-sm">A carregar registos...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Fuel className="h-8 w-8 opacity-20" />
                      <p className="text-sm font-medium">Nenhum registo encontrado</p>
                      <p className="text-xs">Tente ajustar os filtros de pesquisa</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors hover:bg-muted/40 group",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span className="text-xs">
          {total > 0
            ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} de ${total} registos`
            : "Sem registos"}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setFilter("page", page - 1)}
            className="h-8 w-8 p-0 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs px-2 tabular-nums">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setFilter("page", page + 1)}
            className="h-8 w-8 p-0 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

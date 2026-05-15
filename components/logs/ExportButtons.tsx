"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useFilterStore } from "@/store/filterStore";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export function ExportButtons() {
  const { data: session, status } = useSession();
  const isOperator = status === "loading" || (session?.user as { role?: string })?.role === "OPERATOR";
  const filters = useFilterStore();
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  function buildQueryString() {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.vehicleType) params.set("vehicleType", filters.vehicleType);
    if (filters.area) params.set("area", filters.area);
    if (filters.fuelType !== "all") params.set("fuelType", filters.fuelType);
    if (filters.driverName) params.set("driverName", filters.driverName);
    if (filters.matricula) params.set("matricula", filters.matricula);
    if (filters.nMec) params.set("nMec", filters.nMec);
    return params.toString();
  }

  function requirePeriod() {
    if (!filters.dateFrom || !filters.dateTo) {
      toast({
        title: "Período obrigatório",
        description: "Selecione uma data de início e uma data de fim antes de exportar o relatório.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  }

  async function handleExcelExport() {
    if (!requirePeriod()) return;
    setExportingExcel(true);
    try {
      const qs = buildQueryString();
      const res = await fetch(`/api/exports/excel?${qs}`);
      if (!res.ok) throw new Error("Erro ao exportar Excel");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mapa-combustivel-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExportingExcel(false);
    }
  }

  async function handlePdfExport() {
    if (!requirePeriod()) return;
    setExportingPdf(true);
    try {
      const qs = buildQueryString();
      const res = await fetch(`/api/exports/pdf?${qs}`);
      if (!res.ok) throw new Error("Erro ao exportar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mapa-combustivel-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="flex gap-2">
      {!isOperator && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExcelExport}
          disabled={exportingExcel}
          className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
        >
          <FileSpreadsheet className="h-4 w-4 mr-1" />
          {exportingExcel ? (
            <>
              <Download className="h-3 w-3 animate-bounce mr-1" />
              A exportar...
            </>
          ) : (
            "Excel"
          )}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePdfExport}
        disabled={exportingPdf}
        className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
      >
        <FileText className="h-4 w-4 mr-1" />
        {exportingPdf ? (
          <>
            <Download className="h-3 w-3 animate-bounce mr-1" />
            A exportar...
          </>
        ) : (
          "PDF"
        )}
      </Button>
    </div>
  );
}

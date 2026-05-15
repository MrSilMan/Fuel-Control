"use client";

import { useCallback, useEffect, useState } from "react";
import { useFilterStore } from "@/store/filterStore";
import type { FuelLog, Vehicle, Driver } from "@/app/generated/prisma/client";

export type FuelLogWithRelations = FuelLog & {
  vehicle: Vehicle;
  driver: Driver;
};

interface LogsResponse {
  data: FuelLogWithRelations[];
  total: number;
  page: number;
  totalPages: number;
}

export function useLogs() {
  const filters = useFilterStore();
  const [logs, setLogs] = useState<FuelLogWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

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
    params.set("page", filters.page.toString());
    params.set("limit", filters.limit.toString());

    try {
      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar registos");
      const json: LogsResponse = await res.json();
      setLogs(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.dateFrom,
    filters.dateTo,
    filters.vehicleType,
    filters.area,
    filters.fuelType,
    filters.driverName,
    filters.matricula,
    filters.nMec,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, total, totalPages, loading, error, refetch: fetchLogs };
}

"use client";

import { useFilterStore } from "@/store/filterStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const VEHICLE_TYPES = ["HIACE", "Coaster", "Foton", "Pickup", "Sedan", "SUV", "Outro"];
const AREAS = ["DAS", "Eurost", "DMC", "DGAS", "TIC", "RH", "Financeiro", "Outro"];

export function LogFilters() {
  const {
    search,
    dateFrom,
    dateTo,
    vehicleType,
    area,
    fuelType,
    matricula,
    driverName,
    setFilter,
    resetFilters,
  } = useFilterStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeCount = [
    search,
    dateFrom,
    dateTo,
    vehicleType,
    area,
    fuelType !== "all" ? fuelType : "",
    matricula,
    driverName,
  ].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Primary filter row */}
      <div className="flex flex-wrap gap-2.5 items-center p-3.5">
        {/* Search */}
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Matrícula, condutor, área..."
            value={search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="pl-8 h-8 text-sm rounded-lg bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background"
          />
        </div>

        {/* Date from */}
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setFilter("dateFrom", e.target.value)}
          className="h-8 text-sm w-36 rounded-lg bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background"
        />

        {/* Date to */}
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setFilter("dateTo", e.target.value)}
          className="h-8 text-sm w-36 rounded-lg bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background"
        />

        {/* Fuel type */}
        <Select
          value={fuelType}
          onValueChange={(v) => setFilter("fuelType", v as "gasolina" | "gasoleo" | "all")}
        >
          <SelectTrigger className="h-8 text-sm w-36 rounded-lg bg-muted/40 border-transparent focus:border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="gasolina">Gasolina</SelectItem>
            <SelectItem value="gasoleo">Gasóleo</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced + Clear */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "h-8 gap-1.5 rounded-lg text-xs font-medium border-border/60",
              showAdvanced && "bg-muted border-transparent"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            {activeCount > 0 && (
              <span className="ml-0.5 bg-[#CC1422] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                {activeCount}
              </span>
            )}
          </Button>

          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 gap-1 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/8"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-2.5 items-center px-3.5 pb-3.5 pt-0 border-t border-border/40">
          <p className="w-full text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-0.5">
            Filtros avançados
          </p>

          <Select
            value={vehicleType || "all"}
            onValueChange={(v) => setFilter("vehicleType", v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-8 text-sm w-40 rounded-lg bg-muted/40 border-transparent focus:border-border">
              <SelectValue placeholder="Tipo de viatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {VEHICLE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={area || "all"}
            onValueChange={(v) => setFilter("area", v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-8 text-sm w-40 rounded-lg bg-muted/40 border-transparent focus:border-border">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {AREAS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Matrícula (AA-12-BB)"
            value={matricula}
            onChange={(e) => setFilter("matricula", e.target.value)}
            className="h-8 text-sm w-44 rounded-lg bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background"
          />

          <Input
            placeholder="Nome do condutor"
            value={driverName}
            onChange={(e) => setFilter("driverName", e.target.value)}
            className="h-8 text-sm w-44 rounded-lg bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background"
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Fuel,
  Calendar,
  User,
  Car,
  Loader2,
  TrendingUp,
  Droplets,
  Plus,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardData {
  totalGasolinaMonth: number;
  totalGasoleoMonth: number;
  todayCount: number;
  topDriver: { nome: string; nMec: string; area: string; count: number } | null;
  topVehicle: { matricula: string; tipo: string; count: number } | null;
  chartData: Array<{ date: string; gasolina: number; gasoleo: number }>;
}

/* ── KPI variant lookup tables ──────────────────────────────────────────── */
type KpiVariant = "orange" | "gold" | "blue" | "green";

const kpiBorderLeft: Record<KpiVariant, string> = {
  orange: "stat-accent-orange",
  gold:   "stat-accent-gold",
  blue:   "stat-accent-blue",
  green:  "stat-accent-green",
};

const kpiBorderTop: Record<KpiVariant, string> = {
  orange: "stat-top-orange",
  gold:   "stat-top-gold",
  blue:   "stat-top-blue",
  green:  "stat-top-green",
};

const kpiIconBg: Record<KpiVariant, string> = {
  orange: "icon-bg-orange",
  gold:   "icon-bg-gold",
  blue:   "icon-bg-blue",
  green:  "icon-bg-green",
};

/* Pie legend dot classes (only 2 series) */
const pieColorClass: Record<string, string> = {
  Gasolina: "bg-amber-400",
  Gasóleo:  "bg-blue-500",
};

/* ── Shared loading / error states ─────────────────────────────────────── */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="h-7 w-7 animate-spin text-[#C44020]" />
      <p className="text-sm text-muted-foreground">A carregar dados…</p>
    </div>
  );
}

function ErrorState() {
  return (
    <p className="text-muted-foreground text-center py-16 text-sm">
      Erro ao carregar dados do dashboard.
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */

interface AdminKpiProps {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  variant: KpiVariant;
}

function AdminKpi({ label, value, unit, sub, icon, iconBg, variant }: AdminKpiProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl border border-border/60 p-5 card-hover",
        kpiBorderLeft[variant]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {label}
          </p>
          <p className="text-[26px] font-bold text-foreground leading-none tabular-nums">
            {value}
            {unit && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {unit}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
        </div>
        <div className={cn("rounded-xl p-2.5 shrink-0", iconBg)}>{icon}</div>
      </div>
    </div>
  );
}

function AdminDashboard({ data }: { data: DashboardData }) {
  const totalMonth = data.totalGasolinaMonth + data.totalGasoleoMonth;
  const gasolinaPct = totalMonth > 0 ? (data.totalGasolinaMonth / totalMonth) * 100 : 0;
  const gasoleoP   = totalMonth > 0 ? (data.totalGasoleoMonth  / totalMonth) * 100 : 0;

  const now = new Date();
  const dayOfMonth   = now.getDate();
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyAvg     = dayOfMonth > 0 ? totalMonth / dayOfMonth : 0;
  const projected    = Math.round(dailyAvg * daysInMonth);

  const pieData = [
    { name: "Gasolina", value: data.totalGasolinaMonth, fill: "#D4870A" },
    { name: "Gasóleo",  value: data.totalGasoleoMonth,  fill: "#3B82F6" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="admin-hero rounded-2xl p-4 sm:p-6 text-white overflow-hidden relative">
        <div className="absolute inset-0 login-stripes opacity-60" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C44020]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">
              Centro de Operações
            </p>
            <h2 className="text-lg sm:text-xl font-bold leading-tight text-white">
              Visão Geral da Frota
            </h2>
            <p className="text-white/45 text-sm mt-1">
              {now.toLocaleDateString("pt-PT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4 sm:gap-5 sm:shrink-0">
            <div>
              <p className="text-[10px] sm:text-[11px] text-white/35 uppercase tracking-wider">Consumo diário médio</p>
              <p className="text-xl sm:text-2xl font-bold tabular-nums">
                {dailyAvg.toFixed(0)}
                <span className="text-sm font-normal text-white/50 ml-1">L</span>
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-[10px] sm:text-[11px] text-white/35 uppercase tracking-wider">Projeção mês</p>
              <p className="text-xl sm:text-2xl font-bold tabular-nums">
                {projected.toLocaleString()}
                <span className="text-sm font-normal text-white/50 ml-1">L</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpi
          label="Gasolina este mês"
          value={data.totalGasolinaMonth.toFixed(1)}
          unit="L"
          sub={totalMonth > 0 ? `${gasolinaPct.toFixed(0)}% do total` : "Sem dados"}
          icon={<Fuel className="h-4 w-4 text-amber-700 dark:text-amber-300" />}
          iconBg="icon-bg-gold"
          variant="gold"
        />
        <AdminKpi
          label="Gasóleo este mês"
          value={data.totalGasoleoMonth.toFixed(1)}
          unit="L"
          sub={totalMonth > 0 ? `${gasoleoP.toFixed(0)}% do total` : "Sem dados"}
          icon={<Droplets className="h-4 w-4 text-blue-700 dark:text-blue-300" />}
          iconBg="icon-bg-blue"
          variant="blue"
        />
        <AdminKpi
          label="Registos hoje"
          value={String(data.todayCount)}
          sub="abastecimentos registados"
          icon={<Calendar className="h-4 w-4 text-[#C44020] dark:text-[#E86040]" />}
          iconBg="icon-bg-orange"
          variant="orange"
        />
        <AdminKpi
          label="Total este mês"
          value={totalMonth.toFixed(1)}
          unit="L"
          sub="gasolina + gasóleo"
          icon={<TrendingUp className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />}
          iconBg="icon-bg-green"
          variant="green"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart (2/3 width) */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Consumo — últimos 30 dias</p>
              <p className="text-xs text-muted-foreground mt-0.5">Evolução diária por tipo de combustível</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Gasolina
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                Gasóleo
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gGasolina" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D4870A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#D4870A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gGasoleo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval={4}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                unit=" L"
                axisLine={false}
                tickLine={false}
                width={46}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  padding: "8px 12px",
                }}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)} L`]}
              />
              <Area
                type="monotone"
                dataKey="gasolina"
                name="Gasolina"
                stroke="#D4870A"
                strokeWidth={2}
                fill="url(#gGasolina)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#D4870A" }}
              />
              <Area
                type="monotone"
                dataKey="gasoleo"
                name="Gasóleo"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#gGasoleo)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#3B82F6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart (1/3 width) */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 flex flex-col">
          <div className="mb-3">
            <p className="text-sm font-semibold text-foreground">Distribuição</p>
            <p className="text-xs text-muted-foreground mt-0.5">Combustível este mês</p>
          </div>
          {totalMonth > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[11px] text-muted-foreground font-medium">Total</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {totalMonth.toFixed(0)}
                    <span className="text-xs font-normal ml-0.5">L</span>
                  </p>
                </div>
              </div>
              <div className="space-y-2 w-full">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground text-xs">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full inline-block shrink-0",
                          pieColorClass[d.name] ?? "bg-gray-400"
                        )}
                      />
                      {d.name}
                    </span>
                    <span className="font-semibold tabular-nums text-xs text-foreground">
                      {((d.value / totalMonth) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Sem dados
            </div>
          )}
        </div>
      </div>

      {/* Highlights row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top driver */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 card-hover">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-[#C44020]/10 flex items-center justify-center shrink-0">
              <User className="h-[18px] w-[18px] text-[#C44020]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Condutor mais ativo
              </p>
              <p className="text-[11px] text-muted-foreground/70">Este mês</p>
            </div>
          </div>
          {data.topDriver ? (
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-foreground leading-tight">{data.topDriver.nome}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Nº {data.topDriver.nMec} · {data.topDriver.area}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-black text-[#C44020] tabular-nums leading-none">
                  {data.topDriver.count}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">abastecimentos</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
          )}
          <Link
            href="/drivers"
            className="mt-4 flex items-center gap-1.5 text-xs text-[#C44020] hover:text-[#A53518] font-medium transition-colors"
          >
            Ver todos os condutores <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Top vehicle */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 card-hover">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-[#C44020]/10 flex items-center justify-center shrink-0">
              <Car className="h-[18px] w-[18px] text-[#C44020]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Viatura mais ativa
              </p>
              <p className="text-[11px] text-muted-foreground/70">Este mês</p>
            </div>
          </div>
          {data.topVehicle ? (
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-lg font-bold font-mono text-foreground leading-tight">
                  {data.topVehicle.matricula}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{data.topVehicle.tipo}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-black text-[#C44020] tabular-nums leading-none">
                  {data.topVehicle.count}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">abastecimentos</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
          )}
          <Link
            href="/vehicles"
            className="mt-4 flex items-center gap-1.5 text-xs text-[#C44020] hover:text-[#A53518] font-medium transition-colors"
          >
            Ver todas as viaturas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OPERATOR DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */

interface OperatorKpiProps {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  icon: React.ReactNode;
  variant: KpiVariant;
}

function OperatorKpi({ label, value, unit, sub, icon, variant }: OperatorKpiProps) {
  return (
    <div className={cn("bg-card rounded-2xl border border-border/60 p-5", kpiBorderTop[variant])}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            kpiIconBg[variant]
          )}
        >
          {icon}
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-[28px] font-bold text-foreground leading-none tabular-nums">
        {value}
        {unit && (
          <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        )}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
    </div>
  );
}

function OperatorDashboard({
  data,
  session,
}: {
  data: DashboardData;
  session: ReturnType<typeof useSession>["data"];
}) {
  const user = session?.user as { name?: string; mecNumber?: string } | undefined;

  const totalMonth = data.totalGasolinaMonth + data.totalGasoleoMonth;
  const driverArea = data.topDriver?.area ?? "";
  const driverMec  = user?.mecNumber ?? data.topDriver?.nMec ?? "";

  return (
    <div className="space-y-6">
      {/* Personal welcome */}
      <div className="bg-card rounded-2xl border border-border/60 p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
            Bem-vindo
          </p>
          <h2 className="text-xl font-bold text-foreground leading-tight">
            {user?.name ?? "Operador"}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            {driverMec && (
              <span className="text-xs bg-muted text-muted-foreground font-mono px-2.5 py-1 rounded-full">
                Nº {driverMec}
              </span>
            )}
            {driverArea && (
              <span className="text-xs bg-[#C44020]/8 text-[#C44020] border border-[#C44020]/20 px-2.5 py-1 rounded-full font-medium">
                {driverArea}
              </span>
            )}
          </div>
        </div>
        <Link href="/logs/new">
          <Button className="bg-[#C44020] hover:bg-[#A53518] text-white border-0 shadow-md shadow-[#C44020]/25 rounded-xl h-10 px-5 font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Novo Registo
          </Button>
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OperatorKpi
          label="Gasolina este mês"
          value={data.totalGasolinaMonth.toFixed(1)}
          unit="L"
          sub={totalMonth > 0 ? `${((data.totalGasolinaMonth / totalMonth) * 100).toFixed(0)}% do total` : "Sem dados"}
          icon={<Fuel className="h-4 w-4 text-amber-700 dark:text-amber-300" />}
          variant="gold"
        />
        <OperatorKpi
          label="Gasóleo este mês"
          value={data.totalGasoleoMonth.toFixed(1)}
          unit="L"
          sub={totalMonth > 0 ? `${((data.totalGasoleoMonth / totalMonth) * 100).toFixed(0)}% do total` : "Sem dados"}
          icon={<Droplets className="h-4 w-4 text-blue-700 dark:text-blue-300" />}
          variant="blue"
        />
        <OperatorKpi
          label="Registos hoje"
          value={String(data.todayCount)}
          sub="abastecimentos registados"
          icon={<Calendar className="h-4 w-4 text-[#C44020] dark:text-[#E86040]" />}
          variant="orange"
        />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border/60 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-foreground">O meu consumo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Últimos 30 dias</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Gasolina
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Gasóleo
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="opGasolina" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#D4870A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#D4870A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="opGasoleo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              interval={4}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              unit=" L"
              axisLine={false}
              tickLine={false}
              width={46}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                padding: "8px 12px",
              }}
              formatter={(value) => [`${Number(value ?? 0).toFixed(1)} L`]}
            />
            <Area
              type="monotone"
              dataKey="gasolina"
              name="Gasolina"
              stroke="#D4870A"
              strokeWidth={2}
              fill="url(#opGasolina)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "#D4870A" }}
            />
            <Area
              type="monotone"
              dataKey="gasoleo"
              name="Gasóleo"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#opGasoleo)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "#3B82F6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions */}
      <div className="bg-card rounded-2xl border border-border/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Acções rápidas
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/logs/new">
            <Button
              size="sm"
              className="bg-[#C44020] hover:bg-[#A53518] text-white border-0 rounded-xl h-9"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Novo abastecimento
            </Button>
          </Link>
          <Link href="/logs">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-9 border-border/60 hover:bg-muted"
            >
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Ver os meus registos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export function DashboardClient() {
  const { data: session } = useSession();
  const [data, setData]   = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <LoadingState />;
  if (!data)   return <ErrorState />;

  return isAdmin
    ? <AdminDashboard data={data} />
    : <OperatorDashboard data={data} session={session} />;
}

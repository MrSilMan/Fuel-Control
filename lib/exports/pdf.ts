import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { FuelLog, Vehicle, Driver } from "@/app/generated/prisma/client";
import { format } from "date-fns";

type FuelLogWithRelations = FuelLog & {
  vehicle: Vehicle;
  driver: Driver;
};

const C = {
  BLUE:      "#1D4ED8",
  SLATE_900: "#0F172A",
  SLATE_700: "#334155",
  SLATE_500: "#64748B",
  SLATE_400: "#94A3B8",
  SLATE_100: "#F1F5F9",
  SLATE_50:  "#F8FAFC",
  BLUE_50:   "#EFF6FF",
  WHITE:     "#FFFFFF",
  AMBER_900: "#92400E",
  BLUE_800:  "#1E40AF",
  YELLOW_100:"#FFFFF9C4",
  CYAN_100:  "#EFF6FF",
  YELLOW_BG: "#FFFDE7",
  CYAN_BG:   "#E3F2FD",
} as const;

const s = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
    backgroundColor: C.WHITE,
  },
  header: {
    backgroundColor: C.BLUE,
    padding: 10,
    alignItems: "center",
  },
  headerTitle: {
    color: C.WHITE,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  periodSub: {
    backgroundColor: C.BLUE_50,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  periodText: {
    color: C.SLATE_500,
    fontSize: 8,
    fontFamily: "Helvetica-Oblique",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.SLATE_700,
  },
  th: {
    color: C.WHITE,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  td: {
    fontSize: 7,
    color: C.SLATE_700,
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: C.SLATE_700,
    marginTop: 1,
  },
  totalText: {
    color: C.WHITE,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
  },
  spacer: {
    height: 10,
  },
  summaryHeader: {
    backgroundColor: C.SLATE_900,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 0,
    alignItems: "center",
  },
  summaryHeaderText: {
    color: C.WHITE,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  statRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 8,
    color: C.SLATE_700,
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
    backgroundColor: C.SLATE_100,
    flex: 3,
  },
  statLabelSub: {
    fontSize: 8,
    color: C.SLATE_500,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: C.WHITE,
    flex: 3,
  },
  statValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.BLUE,
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: C.BLUE_50,
    flex: 2,
    textAlign: "center",
  },
  statNote: {
    fontSize: 7,
    color: C.SLATE_400,
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Oblique",
    backgroundColor: C.SLATE_50,
    flex: 4,
  },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 20,
    right: 20,
    textAlign: "center",
    color: C.SLATE_400,
    fontSize: 7,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 4,
  },
});

const W = {
  matricula:  72,
  tipo:       60,
  nome:      135,
  nMec:       50,
  area:       70,
  gasolina:   75,
  gasoleo:    75,
  data:       72,
  hora:       50,
  observacao: 143,
} as const;

type PdfRow = ReturnType<typeof preparePdfData>[number];
type Totals = ReturnType<typeof calculateTotals>;

const ce = React.createElement;

function cell(
  content: string | null | undefined,
  width: number,
  opts?: { color?: string; bg?: string; align?: "left" | "center" | "right" },
) {
  return ce(
    View,
    { style: { width, backgroundColor: opts?.bg ?? undefined, paddingVertical: 4, paddingHorizontal: 3 } },
    ce(Text, { style: { ...s.td, color: opts?.color ?? C.SLATE_700, textAlign: opts?.align ?? "left" } },
      content ?? "—"),
  );
}

function headerCell(label: string, width: number) {
  return ce(
    View,
    { style: { width, paddingVertical: 5, paddingHorizontal: 3 } },
    ce(Text, { style: s.th }, label),
  );
}

function DataRow({ row, index }: { row: PdfRow; index: number }) {
  const even = index % 2 === 0;
  const neutral = even ? C.SLATE_50 : C.WHITE;
  const gasoBg  = even ? "#FFFDE7" : "#FFFBEB";
  const gaslBg  = even ? "#E3F2FD" : "#EFF6FF";

  return ce(
    View,
    { style: { ...s.tableRow, backgroundColor: neutral, paddingVertical: 0, paddingHorizontal: 0 } },
    cell(row.matricula, W.matricula),
    cell(row.tipo,      W.tipo),
    cell(row.nome,      W.nome),
    cell(row.nMec,      W.nMec),
    cell(row.area,      W.area),
    cell(
      row.gasolina !== null ? `${row.gasolina.toFixed(1)} L` : null,
      W.gasolina,
      { bg: row.gasolina !== null ? gasoBg : neutral,
        color: row.gasolina !== null ? C.AMBER_900 : C.SLATE_400,
        align: "center" },
    ),
    cell(
      row.gasoleo !== null ? `${row.gasoleo.toFixed(1)} L` : null,
      W.gasoleo,
      { bg: row.gasoleo !== null ? gaslBg : neutral,
        color: row.gasoleo !== null ? C.BLUE_800 : C.SLATE_400,
        align: "center" },
    ),
    cell(row.data,       W.data,       { align: "center" }),
    cell(row.hora,       W.hora,       { align: "center" }),
    cell(row.observacao, W.observacao),
  );
}

function StatRow({
  label,
  value,
  note,
  sub = false,
}: {
  label: string;
  value: string;
  note: string;
  sub?: boolean;
}) {
  return ce(
    View,
    { style: s.statRow },
    ce(Text, { style: sub ? s.statLabelSub : s.statLabel }, label),
    ce(Text, { style: s.statValue }, value),
    ce(Text, { style: s.statNote }, note),
  );
}

function PdfDocument({
  rows,
  totals,
  dateStr,
  periodLabel,
  daysInPeriod,
  peakDay,
  peakAmt,
}: {
  rows: PdfRow[];
  totals: Totals;
  dateStr: string;
  periodLabel: string;
  daysInPeriod: number;
  peakDay: string;
  peakAmt: number;
}) {
  const totalAll = totals.totalGasolina + totals.totalGasoleo;
  const dailyAvg = daysInPeriod > 0 ? totalAll / daysInPeriod : 0;

  return ce(
    Document,
    { title: "Mapa de Controlo de Combustível", creator: "FuelControl" },
    ce(
      Page,
      { size: "A4", orientation: "landscape", style: s.page },

      // Title
      ce(
        View,
        { style: s.header },
        ce(Text, { style: s.headerTitle }, "MAPA DE CONTROLO DE COMBUSTÍVEL"),
      ),

      // Period subtitle
      ce(
        View,
        { style: s.periodSub },
        ce(Text, { style: s.periodText }, `Período: ${periodLabel}`),
      ),

      // Table header
      ce(
        View,
        { style: s.tableHeader },
        headerCell("MATRÍCULA",   W.matricula),
        headerCell("TIPO",        W.tipo),
        headerCell("NOME",        W.nome),
        headerCell("Nº MEC",      W.nMec),
        headerCell("ÁREA",        W.area),
        headerCell("GASOLINA (L)",W.gasolina),
        headerCell("GASÓLEO (L)", W.gasoleo),
        headerCell("DATA",        W.data),
        headerCell("HORA",        W.hora),
        headerCell("OBSERVAÇÃO",  W.observacao),
      ),

      // Data rows
      ...rows.map((row, i) => ce(DataRow, { key: i, row, index: i })),

      // Total row
      ce(
        View,
        { style: s.totalRow },
        ce(View, { style: { width: W.matricula + W.tipo + W.nome + W.nMec + W.area, paddingVertical: 5, paddingHorizontal: 3 } },
          ce(Text, { style: s.totalText }, "TOTAL")),
        ce(View, { style: { width: W.gasolina, paddingVertical: 5, paddingHorizontal: 3 } },
          ce(Text, { style: { ...s.totalText, textAlign: "center" } }, `${totals.totalGasolina.toFixed(1)} L`)),
        ce(View, { style: { width: W.gasoleo, paddingVertical: 5, paddingHorizontal: 3 } },
          ce(Text, { style: { ...s.totalText, textAlign: "center" } }, `${totals.totalGasoleo.toFixed(1)} L`)),
      ),

      // Spacer
      ce(View, { style: s.spacer }),

      // RESUMO MENSAL header
      ce(
        View,
        { style: s.summaryHeader },
        ce(Text, { style: s.summaryHeaderText }, "RESUMO MENSAL"),
      ),

      // Stat rows
      ce(StatRow, {
        label: "Consumo Total Mensal (Gasolina + Gasóleo)",
        value: `${totalAll.toFixed(1)}`,
        note: "Total de litros consumidos no período",
      }),
      ce(StatRow, {
        label: "Gasolina",
        value: `${totals.totalGasolina.toFixed(1)}`,
        note: "Litros de gasolina consumidos",
        sub: true,
      }),
      ce(StatRow, {
        label: "Gasóleo",
        value: `${totals.totalGasoleo.toFixed(1)}`,
        note: "Litros de gasóleo consumidos",
        sub: true,
      }),
      ce(StatRow, {
        label: `Consumo Médio Diário (÷ ${daysInPeriod} dias)`,
        value: `${dailyAvg.toFixed(1)}`,
        note: "Consumo total ÷ dias do mês",
      }),
      ce(StatRow, {
        label: "Dia com Maior Consumo",
        value: peakDay,
        note: `${peakAmt.toFixed(1)} L consumidos nesse dia`,
      }),

      // Footer
      ce(Text, {
        style: s.footer,
        fixed: true,
        render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `FuelControl — Mapa de Controlo de Combustível  •  ${dateStr}  •  Pág. ${pageNumber} / ${totalPages}`,
      }),
    ),
  );
}

export function preparePdfData(logs: FuelLogWithRelations[]) {
  return logs.map((log) => ({
    matricula:  log.vehicle.matricula,
    tipo:       log.vehicle.tipo,
    nome:       log.driver.nome,
    nMec:       log.driver.nMec,
    area:       log.driver.area,
    gasolina:   log.gasolina,
    gasoleo:    log.gasoleo,
    data:       log.data ? new Date(log.data).toLocaleDateString("pt-PT") : "",
    hora:       log.hora,
    observacao: log.observacao,
  }));
}

export function calculateTotals(logs: FuelLogWithRelations[]) {
  return {
    totalGasolina: logs.reduce((sum, l) => sum + (l.gasolina ?? 0), 0),
    totalGasoleo:  logs.reduce((sum, l) => sum + (l.gasoleo  ?? 0), 0),
    count:         logs.length,
  };
}

export async function generatePdfReport(
  logs: FuelLogWithRelations[],
  period?: { dateFrom: string; dateTo: string },
): Promise<Buffer> {
  const rows   = preparePdfData(logs);
  const totals = calculateTotals(logs);
  const dateStr = format(new Date(), "dd/MM/yyyy");

  const timestamps = logs.filter((l) => l.data).map((l) => new Date(l.data!).getTime());
  const byDay: Record<string, number> = {};
  for (const log of logs) {
    if (log.data) {
      const key = new Date(log.data).toLocaleDateString("pt-PT");
      byDay[key] = (byDay[key] ?? 0) + (log.gasolina ?? 0) + (log.gasoleo ?? 0);
    }
  }

  let periodLabel = "—";
  let daysInPeriod = 1;

  if (period) {
    const minD = new Date(period.dateFrom);
    const maxD = new Date(period.dateTo);
    daysInPeriod = Math.round((maxD.getTime() - minD.getTime()) / 86_400_000) + 1;
    periodLabel  = `${minD.toLocaleDateString("pt-PT")} a ${maxD.toLocaleDateString("pt-PT")}`;
  } else if (timestamps.length > 0) {
    const minD = new Date(Math.min(...timestamps));
    const maxD = new Date(Math.max(...timestamps));
    daysInPeriod = Math.round((maxD.getTime() - minD.getTime()) / 86_400_000) + 1;
    periodLabel  = `${minD.toLocaleDateString("pt-PT")} a ${maxD.toLocaleDateString("pt-PT")}`;
  }

  let peakDay = "—";
  let peakAmt = 0;
  for (const [day, amt] of Object.entries(byDay)) {
    if (amt > peakAmt) { peakAmt = amt; peakDay = day; }
  }

  return renderToBuffer(
    ce(PdfDocument, { rows, totals, dateStr, periodLabel, daysInPeriod, peakDay, peakAmt }) as React.ReactElement,
  );
}

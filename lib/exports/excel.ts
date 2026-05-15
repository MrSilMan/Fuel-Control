import ExcelJS from "exceljs";
import type { FuelLog, Vehicle, Driver } from "@/app/generated/prisma/client";

type FuelLogWithRelations = FuelLog & {
  vehicle: Vehicle;
  driver: Driver;
};

const C = {
  BLUE:      "FF1D4ED8",
  SLATE_900: "FF0F172A",
  SLATE_700: "FF334155",
  SLATE_500: "FF64748B",
  SLATE_400: "FF94A3B8",
  SLATE_100: "FFF1F5F9",
  SLATE_50:  "FFF8FAFC",
  BLUE_50:   "FFEFF6FF",
  WHITE:     "FFFFFFFF",
  YELLOW_100:"FFFFF9C4",
  YELLOW_200:"FFFFF3B0",
  CYAN_100:  "FFE3F2FD",
  CYAN_200:  "FFB3E5FC",
} as const;

function makeFill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function makeBorder(argb = "FFE2E8F0"): ExcelJS.Borders {
  const s = { style: "thin" as const, color: { argb } };
  return { top: s, left: s, bottom: s, right: s, diagonal: {} };
}


export async function generateExcelReport(
  logs: FuelLogWithRelations[],
  period?: { dateFrom: string; dateTo: string }
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FuelControl";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Mapa de Combustível", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  // ── Statistics ────────────────────────────────────────────────
  let totalGasolina = 0;
  let totalGasoleo = 0;
  const byDay: Record<string, number> = {};
  const timestamps: number[] = [];

  for (const log of logs) {
    if (log.gasolina) totalGasolina += log.gasolina;
    if (log.gasoleo)  totalGasoleo  += log.gasoleo;
    if (log.data) {
      const d = new Date(log.data);
      timestamps.push(d.getTime());
      const key = d.toLocaleDateString("pt-PT");
      byDay[key] = (byDay[key] ?? 0) + (log.gasolina ?? 0) + (log.gasoleo ?? 0);
    }
  }

  const totalConsumption = totalGasolina + totalGasoleo;

  let periodLabel = "";
  let daysInPeriod = 1;

  if (period) {
    const minD = new Date(period.dateFrom);
    const maxD = new Date(period.dateTo);
    daysInPeriod = Math.round((maxD.getTime() - minD.getTime()) / 86_400_000) + 1;
    periodLabel = `${minD.toLocaleDateString("pt-PT")} a ${maxD.toLocaleDateString("pt-PT")}`;
  } else if (timestamps.length > 0) {
    const minD = new Date(Math.min(...timestamps));
    const maxD = new Date(Math.max(...timestamps));
    daysInPeriod = Math.round((maxD.getTime() - minD.getTime()) / 86_400_000) + 1;
    periodLabel = `${minD.toLocaleDateString("pt-PT")} a ${maxD.toLocaleDateString("pt-PT")}`;
  }

  const dailyAvg = daysInPeriod > 0 ? totalConsumption / daysInPeriod : 0;

  let peakDay = "—";
  let peakAmt = 0;
  for (const [day, amt] of Object.entries(byDay)) {
    if (amt > peakAmt) { peakAmt = amt; peakDay = day; }
  }

  // ── Title ─────────────────────────────────────────────────────
  sheet.mergeCells("A1:J1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "MAPA DE CONTROLO DE COMBUSTÍVEL";
  titleCell.font = { bold: true, size: 14, color: { argb: C.WHITE }, name: "Calibri" };
  titleCell.fill = makeFill(C.BLUE);
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 36;

  // ── Subtitle ──────────────────────────────────────────────────
  sheet.mergeCells("A2:J2");
  const subCell = sheet.getCell("A2");
  subCell.value = periodLabel ? `Período: ${periodLabel}` : "Relatório de Consumo de Combustível";
  subCell.font = { italic: true, size: 10, color: { argb: C.SLATE_500 } };
  subCell.fill = makeFill(C.BLUE_50);
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(2).height = 18;

  // ── Column headers ────────────────────────────────────────────
  const COL_HEADERS = [
    "MATRÍCULA", "TIPO", "NOME", "Nº MEC", "ÁREA",
    "GASOLINA (L)", "GASÓLEO (L)", "DATA", "HORA", "OBSERVAÇÃO",
  ];
  const hdrRow = sheet.addRow(COL_HEADERS);
  hdrRow.height = 24;
  hdrRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: C.WHITE }, size: 10 };
    cell.fill = makeFill(C.SLATE_700);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = makeBorder("FF475569");
  });

  // ── Data rows ─────────────────────────────────────────────────
  for (const [i, log] of logs.entries()) {
    const even = i % 2 === 0;
    const row = sheet.addRow([
      log.vehicle.matricula,
      log.vehicle.tipo,
      log.driver.nome,
      log.driver.nMec,
      log.driver.area,
      log.gasolina ?? "",
      log.gasoleo  ?? "",
      log.data ? new Date(log.data).toLocaleDateString("pt-PT") : "",
      log.hora ?? "",
      log.observacao ?? "",
    ]);
    row.height = 18;
    row.eachCell((cell, col) => {
      let bg: string = even ? C.SLATE_50 : C.WHITE;
      if (col === 6 && log.gasolina !== null) bg = even ? C.YELLOW_200 : C.YELLOW_100;
      if (col === 7 && log.gasoleo  !== null) bg = even ? C.CYAN_200   : C.CYAN_100;

      cell.fill = makeFill(bg);
      cell.font = { size: 10 };
      cell.border = makeBorder();

      if (col === 6 || col === 7) {
        cell.numFmt = "#,##0.0";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if (col === 8 || col === 9) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });
  }

  // ── Totals row ────────────────────────────────────────────────
  const totIdx = sheet.lastRow!.number + 1;
  sheet.addRow(["TOTAL", "", "", "", "", totalGasolina, totalGasoleo, "", "", ""]);
  sheet.mergeCells(`A${totIdx}:E${totIdx}`);
  const totRow = sheet.getRow(totIdx);
  totRow.height = 24;
  totRow.eachCell((cell, col) => {
    cell.font = { bold: true, color: { argb: C.WHITE }, size: 10 };
    cell.fill = makeFill(C.SLATE_700);
    cell.border = makeBorder("FF475569");
    if (col === 6 || col === 7) {
      cell.numFmt = "#,##0.0";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  // ── Separator ─────────────────────────────────────────────────
  sheet.addRow([]);

  // ── Summary section header ────────────────────────────────────
  const sHdrIdx = sheet.lastRow!.number + 1;
  sheet.addRow(["RESUMO MENSAL", "", "", "", "", "", "", "", "", ""]);
  sheet.mergeCells(`A${sHdrIdx}:J${sHdrIdx}`);
  sheet.getRow(sHdrIdx).height = 24;
  const sHdrCell = sheet.getCell(`A${sHdrIdx}`);
  sHdrCell.value = "RESUMO MENSAL";
  sHdrCell.font = { bold: true, size: 11, color: { argb: C.WHITE } };
  sHdrCell.fill = makeFill(C.SLATE_900);
  sHdrCell.alignment = { horizontal: "center", vertical: "middle" };

  // ── Stat rows ─────────────────────────────────────────────────
  const addStat = (
    label: string,
    value: string | number,
    note: string,
    sub = false
  ) => {
    const rn = sheet.lastRow!.number + 1;
    sheet.addRow([label, "", "", "", value, "", "", note, "", ""]);
    sheet.mergeCells(`A${rn}:D${rn}`);
    sheet.mergeCells(`E${rn}:G${rn}`);
    sheet.mergeCells(`H${rn}:J${rn}`);
    sheet.getRow(rn).height = sub ? 18 : 22;

    const labelCell = sheet.getCell(`A${rn}`);
    labelCell.value = label;
    labelCell.font = { bold: !sub, size: 10, color: { argb: sub ? C.SLATE_500 : C.SLATE_700 } };
    labelCell.fill = makeFill(sub ? C.WHITE : C.SLATE_100);
    labelCell.alignment = { horizontal: "left", vertical: "middle", indent: sub ? 3 : 1 };
    labelCell.border = makeBorder();

    const valCell = sheet.getCell(`E${rn}`);
    valCell.value = value;
    valCell.font = { bold: true, size: sub ? 10 : 12, color: { argb: C.BLUE } };
    valCell.fill = makeFill(C.BLUE_50);
    valCell.alignment = { horizontal: "center", vertical: "middle" };
    valCell.border = makeBorder();
    if (typeof value === "number") valCell.numFmt = "#,##0.0";

    const noteCell = sheet.getCell(`H${rn}`);
    noteCell.value = note;
    noteCell.font = { italic: true, size: 9, color: { argb: C.SLATE_400 } };
    noteCell.fill = makeFill(C.SLATE_50);
    noteCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    noteCell.border = makeBorder();
  };

  addStat("Consumo Total Mensal (Gasolina + Gasóleo)", totalConsumption, "Total de litros consumidos no período");
  addStat("Gasolina", totalGasolina, "Litros de gasolina consumidos", true);
  addStat("Gasóleo", totalGasoleo, "Litros de gasóleo consumidos", true);
  addStat(`Consumo Médio Diário (÷ ${daysInPeriod} dias)`, parseFloat(dailyAvg.toFixed(1)), "Consumo total ÷ dias do mês");
  addStat("Dia com Maior Consumo", peakDay, `${peakAmt.toFixed(1)} L consumidos nesse dia`);

  // ── Column widths ─────────────────────────────────────────────
  [15, 12, 22, 10, 12, 14, 14, 13, 9, 28].forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

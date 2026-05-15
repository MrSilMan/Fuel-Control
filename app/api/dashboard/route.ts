import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const isOperator = (session.user as { role?: string })?.role === "OPERATOR";
  const userMecNumber = (session.user as { mecNumber?: string })?.mecNumber;

  // For operators, scope all queries to their own driver record
  let operatorDriverId: string | undefined;
  if (isOperator && userMecNumber) {
    const driver = await prisma.driver.findUnique({ where: { nMec: userMecNumber } });
    operatorDriverId = driver?.id ?? undefined;
  }

  const driverFilter = operatorDriverId ? { driverId: operatorDriverId } : {};

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    monthLogs,
    todayCount,
    allDriverActivity,
    allVehicleActivity,
    last30DaysLogs,
  ] = await Promise.all([
    // Month totals
    prisma.fuelLog.findMany({
      where: { data: { gte: monthStart, lte: monthEnd }, ...driverFilter },
      select: { gasolina: true, gasoleo: true },
    }),
    // Today count
    prisma.fuelLog.count({
      where: { data: { gte: todayStart, lte: todayEnd }, ...driverFilter },
    }),
    // Most active driver this month
    prisma.fuelLog.groupBy({
      by: ["driverId"],
      where: { data: { gte: monthStart, lte: monthEnd }, ...driverFilter },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
    // Most active vehicle this month
    prisma.fuelLog.groupBy({
      by: ["vehicleId"],
      where: { data: { gte: monthStart, lte: monthEnd }, ...driverFilter },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
    // Last 30 days chart data
    prisma.fuelLog.findMany({
      where: { data: { gte: subDays(now, 30) }, ...driverFilter },
      select: { data: true, gasolina: true, gasoleo: true },
      orderBy: { data: "asc" },
    }),
  ]);

  const totalGasolinaMonth = monthLogs.reduce(
    (s: number, l: { gasolina: number | null }) => s + (l.gasolina ?? 0),
    0
  );
  const totalGasoleoMonth = monthLogs.reduce(
    (s: number, l: { gasoleo: number | null }) => s + (l.gasoleo ?? 0),
    0
  );

  // Top driver info
  let topDriver = null;
  if (allDriverActivity.length > 0) {
    const driver = await prisma.driver.findUnique({
      where: { id: allDriverActivity[0].driverId },
    });
    topDriver = { ...driver, count: allDriverActivity[0]._count.id };
  }

  // Top vehicle info
  let topVehicle = null;
  if (allVehicleActivity.length > 0) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: allVehicleActivity[0].vehicleId },
    });
    topVehicle = { ...vehicle, count: allVehicleActivity[0]._count.id };
  }

  // Build chart data (group by day)
  const chartMap = new Map<string, { gasolina: number; gasoleo: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = subDays(now, i);
    const key = d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
    chartMap.set(key, { gasolina: 0, gasoleo: 0 });
  }

  last30DaysLogs.forEach((log: { data: Date; gasolina: number | null; gasoleo: number | null }) => {
    const key = new Date(log.data).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
    });
    const existing = chartMap.get(key);
    if (existing) {
      existing.gasolina += log.gasolina ?? 0;
      existing.gasoleo += log.gasoleo ?? 0;
    }
  });

  const chartData = Array.from(chartMap.entries()).map(([date, values]) => ({
    date,
    ...values,
  }));

  return NextResponse.json({
    totalGasolinaMonth,
    totalGasoleoMonth,
    todayCount,
    topDriver,
    topVehicle,
    chartData,
  });
}

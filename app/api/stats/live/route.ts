import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subHours } from "date-fns";

export async function GET() {
  const now = new Date();

  const [todayCount, lastHourCount] = await Promise.all([
    prisma.fuelLog.count({
      where: { data: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    prisma.fuelLog.count({
      where: { data: { gte: subHours(now, 1), lte: now } },
    }),
  ]);

  return NextResponse.json({ todayCount, lastHourCount });
}

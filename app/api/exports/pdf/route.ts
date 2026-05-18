import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logFiltersSchema } from "@/lib/validations/log.schema";
import { generatePdfReport } from "@/lib/exports/pdf";
import { format } from "date-fns";
import type { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const filters = logFiltersSchema.parse(Object.fromEntries(searchParams));

  const isOperator = (session.user as { role?: string })?.role === "OPERATOR";
  const userMecNumber = (session.user as { mecNumber?: string })?.mecNumber;

  const where: Prisma.FuelLogWhereInput = {};

  if (filters.dateFrom || filters.dateTo) {
    where.data = {};
    if (filters.dateFrom) {
      (where.data as Prisma.DateTimeFilter).gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      (where.data as Prisma.DateTimeFilter).lte = end;
    }
  }

  if (filters.vehicleType) {
    where.vehicle = { tipo: { contains: filters.vehicleType, mode: "insensitive" } };
  }

  if (filters.matricula) {
    where.vehicle = {
      ...((where.vehicle as object) || {}),
      matricula: { contains: filters.matricula, mode: "insensitive" },
    };
  }

  if (filters.area) {
    where.driver = { area: { contains: filters.area, mode: "insensitive" } };
  }

  if (filters.driverName) {
    where.driver = {
      ...((where.driver as object) || {}),
      nome: { contains: filters.driverName, mode: "insensitive" },
    };
  }

  if (filters.nMec) {
    where.driver = {
      ...((where.driver as object) || {}),
      nMec: { contains: filters.nMec, mode: "insensitive" },
    };
  }

  if (filters.fuelType === "gasolina") {
    where.gasolina = { not: null };
  } else if (filters.fuelType === "gasoleo") {
    where.gasoleo = { not: null };
  }

  if (filters.search) {
    where.OR = [
      { vehicle: { matricula: { contains: filters.search, mode: "insensitive" } } },
      { driver: { nome: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  if (isOperator && userMecNumber) {
    where.driver = { nMec: userMecNumber };
  }

  const logs = await prisma.fuelLog.findMany({
    where,
    include: { vehicle: true, driver: true },
    orderBy: { data: "desc" },
  });

  const buffer = await generatePdfReport(logs, filters.dateFrom && filters.dateTo
    ? { dateFrom: filters.dateFrom, dateTo: filters.dateTo }
    : undefined,
  );
  const filename = `mapa-combustivel-${format(new Date(), "yyyy-MM-dd")}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

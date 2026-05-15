import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createFuelLogSchema, logFiltersSchema } from "@/lib/validations/log.schema";
import { writeAudit } from "@/lib/audit";
import type { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const isOperator = (session.user as { role?: string })?.role === "OPERATOR";
  const userMecNumber = (session.user as { mecNumber?: string })?.mecNumber;

  const { searchParams } = request.nextUrl;
  const filters = logFiltersSchema.parse(Object.fromEntries(searchParams));

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
      { vehicle: { tipo: { contains: filters.search, mode: "insensitive" } } },
      { driver: { nome: { contains: filters.search, mode: "insensitive" } } },
      { driver: { area: { contains: filters.search, mode: "insensitive" } } },
      { driver: { nMec: { contains: filters.search, mode: "insensitive" } } },
      { observacao: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // Operators can only see their own logs — override any driver filters
  if (isOperator && userMecNumber) {
    where.driver = { nMec: userMecNumber };
  }

  const skip = (filters.page - 1) * filters.limit;

  const [data, total] = await Promise.all([
    prisma.fuelLog.findMany({
      where,
      include: { vehicle: true, driver: true },
      orderBy: { data: "desc" },
      skip,
      take: filters.limit,
    }),
    prisma.fuelLog.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page: filters.page,
    totalPages: Math.ceil(total / filters.limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createFuelLogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const log = await prisma.fuelLog.create({
    data: parsed.data,
    include: { vehicle: true, driver: true },
  });

  await writeAudit({
    action: "CREATE",
    entity: "FuelLog",
    entityId: log.id,
    session,
    detail: `Registo criado: ${log.vehicle.matricula} — ${log.driver.nome}`,
  });

  return NextResponse.json({ data: log }, { status: 201 });
}

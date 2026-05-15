import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mecNumber, vehicleId, fuelType, litros, observacao } = body ?? {};

  if (!mecNumber || !vehicleId || !fuelType || litros == null) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  if (!["gasolina", "gasoleo"].includes(fuelType)) {
    return NextResponse.json({ error: "Tipo de combustível inválido" }, { status: 400 });
  }

  const qty = parseFloat(String(litros));
  if (isNaN(qty) || qty <= 0) {
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
  }

  const driver = await prisma.driver.findUnique({
    where: { nMec: String(mecNumber).trim().toUpperCase() },
  });
  if (!driver) {
    return NextResponse.json({ error: "Operador não encontrado" }, { status: 404 });
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    return NextResponse.json({ error: "Viatura não encontrada" }, { status: 404 });
  }

  const now = new Date();

  const log = await prisma.fuelLog.create({
    data: {
      vehicleId: vehicle.id,
      driverId: driver.id,
      gasolina: fuelType === "gasolina" ? qty : null,
      gasoleo: fuelType === "gasoleo" ? qty : null,
      data: now,
      hora: format(now, "HH:mm"),
      observacao: observacao ?? null,
    },
    include: { vehicle: true, driver: true },
  });

  await writeAudit({
    action: "CREATE",
    entity: "FuelLog",
    entityId: log.id,
    session: null,
    detail: `[Quiosque] ${log.vehicle.matricula} — ${log.driver.nome}`,
  });

  return NextResponse.json({ data: log }, { status: 201 });
}

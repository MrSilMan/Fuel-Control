import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mecNumber, vehicleId, fuelType, litros, km, observacao } = body ?? {};

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

  const kmValue = km != null && !isNaN(parseInt(String(km), 10)) ? parseInt(String(km), 10) : null;

  const log = await prisma.fuelLog.create({
    data: {
      vehicleId: vehicle.id,
      driverId: driver.id,
      gasolina: fuelType === "gasolina" ? qty : null,
      gasoleo: fuelType === "gasoleo" ? qty : null,
      km: kmValue,
      data: now,
      hora: format(now, "HH:mm"),
      observacao: observacao ?? null,
    },
    include: { vehicle: true, driver: true },
  });

  let maintenanceAlert: { status: "warning" | "due"; message: string } | null = null;
  if (kmValue != null) {
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { km: kmValue },
    });

    if (updatedVehicle.nextMaintenanceKm != null) {
      const remaining = updatedVehicle.nextMaintenanceKm - kmValue;
      if (remaining <= 0) {
        maintenanceAlert = {
          status: "due",
          message: `Manutenção em atraso! A viatura ${vehicle.matricula} atingiu o limite de ${updatedVehicle.nextMaintenanceKm.toLocaleString("pt-PT")} km.`,
        };
      } else if (remaining <= 500) {
        maintenanceAlert = {
          status: "warning",
          message: `Manutenção próxima! Faltam ${remaining.toLocaleString("pt-PT")} km para a manutenção da viatura ${vehicle.matricula}.`,
        };
      }
    }
  }

  await writeAudit({
    action: "CREATE",
    entity: "FuelLog",
    entityId: log.id,
    session: null,
    detail: `[Quiosque] ${log.vehicle.matricula} — ${log.driver.nome}${kmValue != null ? ` (${kmValue} km)` : ""}`,
  });

  return NextResponse.json({ data: log, maintenanceAlert }, { status: 201 });
}

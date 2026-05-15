import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateFuelLogSchema } from "@/lib/validations/log.schema";
import { writeAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const log = await prisma.fuelLog.findUnique({
    where: { id },
    include: { vehicle: true, driver: true },
  });

  if (!log) {
    return NextResponse.json({ error: "Registo não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: log });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateFuelLogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const log = await prisma.fuelLog.update({
    where: { id },
    data: parsed.data,
    include: { vehicle: true, driver: true },
  });

  await writeAudit({
    action: "UPDATE",
    entity: "FuelLog",
    entityId: log.id,
    session,
    detail: `Registo atualizado: ${log.vehicle.matricula} — ${log.driver.nome}`,
  });

  return NextResponse.json({ data: log });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const deleted = await prisma.fuelLog.findUnique({
    where: { id },
    include: { vehicle: true, driver: true },
  });

  await prisma.fuelLog.delete({ where: { id } });

  await writeAudit({
    action: "DELETE",
    entity: "FuelLog",
    entityId: id,
    session,
    detail: deleted
      ? `Registo eliminado: ${deleted.vehicle.matricula} — ${deleted.driver.nome}`
      : `Registo eliminado: ${id}`,
  });

  return NextResponse.json({ success: true });
}

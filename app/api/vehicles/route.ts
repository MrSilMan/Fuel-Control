import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const createVehicleSchema = z.object({
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
});

const updateVehicleSchema = z.object({
  matricula: z.string().min(1, "Matrícula é obrigatória").optional(),
  tipo: z.string().min(1, "Tipo é obrigatório").optional(),
});

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { matricula: "asc" },
  });

  return NextResponse.json({ data: vehicles });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createVehicleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.create({ data: parsed.data });

  await writeAudit({
    action: "CREATE",
    entity: "Vehicle",
    entityId: vehicle.id,
    session,
    detail: `Viatura criada: ${vehicle.matricula} (${vehicle.tipo})`,
  });

  return NextResponse.json({ data: vehicle }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID necessário" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = updateVehicleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: parsed.data,
    });

    await writeAudit({
      action: "UPDATE",
      entity: "Vehicle",
      entityId: vehicle.id,
      session,
      detail: `Viatura editada: ${vehicle.matricula} (${vehicle.tipo})`,
    });

    return NextResponse.json({ data: vehicle });
  } catch {
    return NextResponse.json({ error: "Erro interno ao editar viatura" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID necessário" }, { status: 400 });
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { _count: { select: { logs: true } } },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Viatura não encontrada" }, { status: 404 });
    }

    if (vehicle._count.logs > 0) {
      return NextResponse.json(
        { error: `Esta viatura tem ${vehicle._count.logs} registo(s) associado(s) e não pode ser eliminada.` },
        { status: 409 }
      );
    }

    await prisma.vehicle.delete({ where: { id } });

    await writeAudit({
      action: "DELETE",
      entity: "Vehicle",
      entityId: id,
      session,
      detail: `Viatura eliminada: ${vehicle.matricula} (${vehicle.tipo})`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno ao eliminar viatura" }, { status: 500 });
  }
}

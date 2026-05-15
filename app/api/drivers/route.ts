import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const createDriverSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  nMec: z.string().min(1, "Nº Mecânico é obrigatório"),
  area: z.string().min(1, "Área é obrigatória"),
});

const updateDriverSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  nMec: z.string().min(1, "Nº Mecânico é obrigatório").optional(),
  area: z.string().min(1, "Área é obrigatória").optional(),
});

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const drivers = await prisma.driver.findMany({
    orderBy: { nome: "asc" },
  });

  return NextResponse.json({ data: drivers });
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
  const parsed = createDriverSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const driver = await prisma.driver.create({ data: parsed.data });

  await writeAudit({
    action: "CREATE",
    entity: "Driver",
    entityId: driver.id,
    session,
    detail: `Condutor criado: ${driver.nome} (${driver.nMec}) — ${driver.area}`,
  });

  return NextResponse.json({ data: driver }, { status: 201 });
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
  const parsed = updateDriverSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const driver = await prisma.driver.update({
      where: { id },
      data: parsed.data,
    });

    await writeAudit({
      action: "UPDATE",
      entity: "Driver",
      entityId: driver.id,
      session,
      detail: `Condutor editado: ${driver.nome} (${driver.nMec}) — ${driver.area}`,
    });

    return NextResponse.json({ data: driver });
  } catch {
    return NextResponse.json({ error: "Erro interno ao editar condutor" }, { status: 500 });
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
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { _count: { select: { logs: true } } },
    });

    if (!driver) {
      return NextResponse.json({ error: "Condutor não encontrado" }, { status: 404 });
    }

    if (driver._count.logs > 0) {
      return NextResponse.json(
        { error: `Este condutor tem ${driver._count.logs} registo(s) associado(s) e não pode ser eliminado.` },
        { status: 409 }
      );
    }

    await prisma.driver.delete({ where: { id } });

    await writeAudit({
      action: "DELETE",
      entity: "Driver",
      entityId: id,
      session,
      detail: `Condutor eliminado: ${driver.nome} (${driver.nMec}) — ${driver.area}`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno ao eliminar condutor" }, { status: 500 });
  }
}

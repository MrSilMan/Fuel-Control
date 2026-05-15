import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const mecNumber: string | undefined = body?.mecNumber;

  if (!mecNumber?.trim()) {
    return NextResponse.json({ error: "Número de mec é obrigatório" }, { status: 400 });
  }

  const driver = await prisma.driver.findUnique({
    where: { nMec: mecNumber.trim().toUpperCase() },
  });

  if (!driver) {
    return NextResponse.json({ error: "Número de mec não encontrado" }, { status: 404 });
  }

  const vehicles = await prisma.vehicle.findMany({ orderBy: { matricula: "asc" } });

  return NextResponse.json({
    driver: {
      id: driver.id,
      nome: driver.nome,
      nMec: driver.nMec,
      area: driver.area,
    },
    vehicles,
  });
}

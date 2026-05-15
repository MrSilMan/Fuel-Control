import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const filtersSchema = z.object({
  page:   z.coerce.number().default(1),
  limit:  z.coerce.number().default(50),
  entity: z.string().optional(),
  action: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const filters = filtersSchema.parse(Object.fromEntries(searchParams));

  const where: Record<string, unknown> = {};
  if (filters.entity) where.entity = filters.entity;
  if (filters.action) where.action = filters.action;
  if (filters.search) {
    where.OR = [
      { actorName:  { contains: filters.search, mode: "insensitive" } },
      { actorEmail: { contains: filters.search, mode: "insensitive" } },
      { detail:     { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const skip = (filters.page - 1) * filters.limit;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: filters.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page: filters.page,
    totalPages: Math.ceil(total / filters.limit),
  });
}

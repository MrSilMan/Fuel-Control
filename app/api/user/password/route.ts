import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "A nova palavra-passe deve ter pelo menos 6 caracteres"),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const userId = (session.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ message: "Utilizador não encontrado" }, { status: 404 });
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) {
    return NextResponse.json({ message: "Palavra-passe atual incorreta" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return NextResponse.json({ message: "Palavra-passe alterada com sucesso" });
}

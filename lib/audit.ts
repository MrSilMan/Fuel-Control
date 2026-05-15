import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";
type AuditEntity = "FuelLog" | "Vehicle" | "Driver";

export async function writeAudit(params: {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  session: Session | null;
  detail?: string;
}) {
  const user = params.session?.user as
    | { id?: string; email?: string; name?: string }
    | undefined;

  await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
      actorName: user?.name ?? null,
      detail: params.detail ?? null,
    },
  });
}

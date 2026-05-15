import { Header } from "@/components/layout/Header";
import { LogForm } from "@/components/logs/LogForm";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

interface EditLogPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLogPage({ params }: EditLogPageProps) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role === "OPERATOR") redirect("/logs");

  const { id } = await params;

  const [log, vehicles, drivers] = await Promise.all([
    prisma.fuelLog.findUnique({
      where: { id },
      include: { vehicle: true, driver: true },
    }),
    prisma.vehicle.findMany({ orderBy: { matricula: "asc" } }),
    prisma.driver.findMany({ orderBy: { nome: "asc" } }),
  ]);

  if (!log) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Editar Registo" />
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/logs"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar aos registos
          </Link>
          <Card>
            <CardHeader>
              <CardTitle>
                Editar Registo —{" "}
                <span className="font-mono">{log.vehicle.matricula}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LogForm log={log} vehicles={vehicles} drivers={drivers} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

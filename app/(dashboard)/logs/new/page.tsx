import { Header } from "@/components/layout/Header";
import { LogForm } from "@/components/logs/LogForm";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewLogPage() {
  const session = await auth();
  const sessionUser = session?.user as { mecNumber?: string; role?: string } | undefined;
  const mecNumber = sessionUser?.mecNumber;
  const isOperator = sessionUser?.role === "OPERATOR";

  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { matricula: "asc" } }),
    prisma.driver.findMany({ orderBy: { nome: "asc" } }),
  ]);

  const operatorDriver = mecNumber
    ? drivers.find((d) => d.nMec === mecNumber) ?? null
    : null;

  return (
    <div className="flex flex-col h-full">
      <Header title="Novo Registo de Combustível" />
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
              <CardTitle>Registo de Abastecimento</CardTitle>
            </CardHeader>
            <CardContent>
              <LogForm vehicles={vehicles} drivers={drivers} operatorDriverId={operatorDriver?.id} isOperator={isOperator} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

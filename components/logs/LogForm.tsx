"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import type { Vehicle, Driver, FuelLog } from "@/app/generated/prisma/client";
import { format } from "date-fns";

const logFormSchema = z.object({
  vehicleId: z.string().min(1, "Viatura é obrigatória"),
  driverId: z.string().min(1, "Condutor é obrigatório"),
  fuelType: z.enum(["gasolina", "gasoleo"], { required_error: "Selecione o tipo de combustível" }),
  litros: z.string().min(1, "Quantidade é obrigatória").refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Quantidade deve ser maior que 0"
  ),
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().optional(),
  observacao: z.string().optional(),
});

type LogFormValues = z.infer<typeof logFormSchema>;

interface LogFormProps {
  log?: FuelLog & { vehicle: Vehicle; driver: Driver };
  vehicles: Vehicle[];
  drivers: Driver[];
  operatorDriverId?: string;
  isOperator?: boolean;
}

export function LogForm({ log, vehicles, drivers, operatorDriverId, isOperator }: LogFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!log;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      vehicleId: log?.vehicleId ?? "",
      driverId: log?.driverId ?? operatorDriverId ?? "",
      fuelType: log?.gasoleo != null && log.gasoleo > 0 ? "gasoleo" : "gasolina",
      litros: log?.gasoleo != null && log.gasoleo > 0
        ? String(log.gasoleo)
        : log?.gasolina != null && log.gasolina > 0
          ? String(log.gasolina)
          : "",
      data: log ? format(new Date(log.data), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      hora: log?.hora ?? (isOperator ? format(new Date(), "HH:mm") : ""),
      observacao: log?.observacao ?? "",
    },
  });

  const selectedVehicleId = watch("vehicleId");
  const selectedDriverId = watch("driverId");
  const fuelType = watch("fuelType");

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  async function onSubmit(data: LogFormValues) {
    setSubmitting(true);
    try {
      const url = isEditing ? `/api/logs/${log.id}` : "/api/logs";
      const method = isEditing ? "PUT" : "POST";

      const qty = parseFloat(data.litros);
      const payload = {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        gasolina: data.fuelType === "gasolina" ? qty : null,
        gasoleo: data.fuelType === "gasoleo" ? qty : null,
        data: new Date(data.data),
        hora: data.hora || null,
        observacao: data.observacao || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao guardar registo");
      }

      toast({
        variant: "success",
        title: isEditing ? "Registo atualizado" : "Registo criado",
        description: isEditing
          ? "O registo foi atualizado com sucesso."
          : "Novo registo de combustível criado.",
      });

      router.push("/logs");
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle */}
        <div className="space-y-2">
          <Label htmlFor="vehicleId">
            Viatura <span className="text-[var(--destructive)]">*</span>
          </Label>
          <Select
            value={selectedVehicleId}
            onValueChange={(v) => setValue("vehicleId", v, { shouldValidate: true })}
          >
            <SelectTrigger id="vehicleId">
              <SelectValue placeholder="Selecionar viatura..." />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.matricula} — {v.tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vehicleId && (
            <p className="text-xs text-[var(--destructive)]">
              {errors.vehicleId.message}
            </p>
          )}
          {selectedVehicle && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Tipo: <strong>{selectedVehicle.tipo}</strong>
            </p>
          )}
        </div>

        {/* Driver */}
        <div className="space-y-2">
          <Label htmlFor="driverId">
            Condutor <span className="text-[var(--destructive)]">*</span>
          </Label>
          <Select
            value={selectedDriverId}
            onValueChange={(v) => setValue("driverId", v, { shouldValidate: true })}
            disabled={!!operatorDriverId}
          >
            <SelectTrigger id="driverId">
              <SelectValue placeholder="Selecionar condutor..." />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nMec} — {d.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.driverId && (
            <p className="text-xs text-[var(--destructive)]">
              {errors.driverId.message}
            </p>
          )}
          {selectedDriver && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Área: <strong>{selectedDriver.area}</strong>
            </p>
          )}
        </div>

        {/* Fuel type + quantity — spans both columns */}
        <div className="md:col-span-2 space-y-3">
          <Label>
            Combustível <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue("fuelType", "gasolina", { shouldValidate: true })}
              className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                fuelType === "gasolina"
                  ? "bg-primary text-white border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground"
              }`}
            >
              Gasolina
            </button>
            <button
              type="button"
              onClick={() => setValue("fuelType", "gasoleo", { shouldValidate: true })}
              className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                fuelType === "gasoleo"
                  ? "bg-primary text-white border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground"
              }`}
            >
              Gasóleo
            </button>
          </div>
          {errors.fuelType && (
            <p className="text-xs text-destructive">{errors.fuelType.message}</p>
          )}
          <div className="space-y-1">
            <Label htmlFor="litros">
              Litros <span className="text-destructive">*</span>
            </Label>
            <Input
              id="litros"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register("litros")}
            />
            {errors.litros && (
              <p className="text-xs text-destructive">{errors.litros.message}</p>
            )}
          </div>
        </div>

        {/* Data */}
        <div className="space-y-2">
          <Label htmlFor="data">
            Data <span className="text-[var(--destructive)]">*</span>
          </Label>
          <Input
            id="data"
            type="date"
            disabled={isOperator}
            {...register("data")}
          />
          {errors.data && (
            <p className="text-xs text-[var(--destructive)]">
              {errors.data.message}
            </p>
          )}
        </div>

        {/* Hora */}
        <div className="space-y-2">
          <Label htmlFor="hora">Hora</Label>
          <Input
            id="hora"
            type="time"
            disabled={isOperator}
            {...register("hora")}
          />
        </div>

        {/* Observação */}
        <div className="space-y-2">
          <Label htmlFor="observacao">Observação</Label>
          <Input
            id="observacao"
            placeholder="Notas adicionais..."
            {...register("observacao")}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isEditing ? "Atualizar Registo" : "Criar Registo"}
        </Button>
      </div>
    </form>
  );
}

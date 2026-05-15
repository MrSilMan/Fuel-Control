"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Fuel, CheckCircle2, ChevronLeft, AlertCircle, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Vehicle } from "@/app/generated/prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────
type Step = "idle" | "form" | "success";

interface DriverInfo {
  id: string;
  nome: string;
  nMec: string;
  area: string;
}

interface SuccessInfo {
  driverName: string;
  vehiclePlate: string;
  vehicleTipo: string;
  fuelType: "gasolina" | "gasoleo";
  litros: string;
}

// ── Form schema ────────────────────────────────────────────────────────────
const kioskFormSchema = z.object({
  vehicleId: z.string().min(1, "Selecione uma viatura"),
  fuelType: z.enum(["gasolina", "gasoleo"], {
    error: "Selecione o tipo de combustível",
  }),
  litros: z
    .string()
    .min(1, "Insira a quantidade")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Deve ser maior que 0"),
  observacao: z.string().optional(),
});

type KioskFormValues = z.infer<typeof kioskFormSchema>;

// ── Component ──────────────────────────────────────────────────────────────
export default function KioskPage() {
  const [step, setStep] = useState<Step>("idle");
  const [mecInput, setMecInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [countdown, setCountdown] = useState(10);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset: formReset,
    formState: { errors, isSubmitting },
  } = useForm<KioskFormValues>({
    resolver: zodResolver(kioskFormSchema),
  });

  const selectedVehicleId = watch("vehicleId");
  const fuelType = watch("fuelType");
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Auto-reset countdown on success
  useEffect(() => {
    if (step !== "success") return;
    setCountdown(10);
    const timer = setTimeout(resetAll, 10_000);
    const interval = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1_000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
    // resetAll captures only stable setState/formReset refs — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function resetAll() {
    setStep("idle");
    setMecInput("");
    setLookupError("");
    setDriver(null);
    setVehicles([]);
    setSuccessInfo(null);
    setSubmitError("");
    formReset();
  }

  // ── Mec lookup ─────────────────────────────────────────────────────────
  async function handleLookup() {
    const mec = mecInput.trim();
    if (!mec) { setLookupError("Insira o número de mec"); return; }
    setLookingUp(true);
    setLookupError("");
    try {
      const res = await fetch("/api/kiosk/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mecNumber: mec }),
      });
      if (!res.ok) {
        const err = await res.json();
        setLookupError(err.error ?? "Número não encontrado");
        return;
      }
      const { driver: d, vehicles: v } = await res.json();
      setDriver(d);
      setVehicles(v);
      setStep("form");
    } catch {
      setLookupError("Erro de ligação. Tente novamente.");
    } finally {
      setLookingUp(false);
    }
  }

  // ── Form submit ────────────────────────────────────────────────────────
  async function onFormSubmit(data: KioskFormValues) {
    if (!driver) return;
    setSubmitError("");
    try {
      const res = await fetch("/api/kiosk/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mecNumber: driver.nMec,
          vehicleId: data.vehicleId,
          fuelType: data.fuelType,
          litros: data.litros,
          observacao: data.observacao || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error ?? "Erro ao guardar. Tente novamente.");
        return;
      }
      setSuccessInfo({
        driverName: driver.nome,
        vehiclePlate: selectedVehicle?.matricula ?? "",
        vehicleTipo: selectedVehicle?.tipo ?? "",
        fuelType: data.fuelType,
        litros: data.litros,
      });
      setStep("success");
    } catch {
      setSubmitError("Erro de ligação. Tente novamente.");
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // IDLE SCREEN
  // ══════════════════════════════════════════════════════════════════════
  if (step === "idle") {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0D1526] px-4 py-10 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 login-dot-grid opacity-30 pointer-events-none" />
        <div className="absolute inset-0 login-stripes opacity-60 pointer-events-none" />

        {/* Ambient orbs */}
        <div className="login-orb-1 absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#C44020]/10 blur-3xl pointer-events-none" />
        <div className="login-orb-2 absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-[#C44020]/8 blur-3xl pointer-events-none" />

        {/* Branding */}
        <div className="relative z-10 flex flex-col items-center mb-10">
          <div className="login-float-1 w-20 h-20 rounded-2xl bg-[#C44020] flex items-center justify-center mb-5 shadow-xl shadow-[#C44020]/40">
            <Fuel className="w-10 h-10 text-white" strokeWidth={1.75} />
          </div>
          <p className="text-white text-3xl font-bold tracking-tight">FuelControl</p>
          <p className="text-white/40 text-sm mt-1 tracking-wide uppercase">
            TAAG Angola &middot; Posto de Abastecimento
          </p>
        </div>

        {/* Main card */}
        <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-black/40 px-8 py-9">
          <h1 className="text-2xl font-bold text-[#0F1117] text-center mb-1">
            Bem-vindo
          </h1>
          <p className="text-[#4B5563] text-sm text-center mb-8 leading-relaxed">
            Introduza o seu número de mec para registar um abastecimento.
          </p>

          <div className="space-y-2 mb-5">
            <Label htmlFor="mec-input" className="text-sm font-semibold text-[#0F1117]">
              Número de Mec
            </Label>
            <Input
              id="mec-input"
              type="text"
              placeholder="ex: M001"
              value={mecInput}
              onChange={(e) => {
                setMecInput(e.target.value);
                setLookupError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && !lookingUp && handleLookup()}
              className="h-14 text-xl font-mono tracking-widest text-center uppercase bg-[#F2F4F8] border-[#E0E2E9] focus:border-[#C44020]"
              autoComplete="off"
              autoFocus
              disabled={lookingUp}
            />
            {lookupError && (
              <div className="flex items-center gap-2 text-sm text-[#C44020] pt-0.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleLookup}
            disabled={lookingUp}
            className="w-full h-14 rounded-2xl bg-[#C44020] text-white text-lg font-semibold flex items-center justify-center gap-2.5 hover:bg-[#A53518] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 shadow-lg shadow-[#C44020]/30"
          >
            {lookingUp && <Loader2 className="w-5 h-5 animate-spin" />}
            {lookingUp ? "A verificar..." : "Continuar"}
          </button>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/25 text-xs mt-10 tracking-wide">
          Dispositivo de acesso exclusivo ao posto de abastecimento
        </p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // FORM SCREEN
  // ══════════════════════════════════════════════════════════════════════
  if (step === "form") {
    return (
      <div className="min-h-screen bg-[#F2F4F8] flex flex-col">
        {/* Driver banner */}
        <div className="bg-[#0D1526] px-5 py-4 flex items-center gap-3 shadow-lg">
          <button
            onClick={resetAll}
            className="text-white/50 hover:text-white transition-colors rounded-lg p-1 -ml-1"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#C44020] flex items-center justify-center font-bold text-white text-sm shrink-0 uppercase">
            {driver?.nome.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">
              {driver?.nome}
            </p>
            <p className="text-white/45 text-xs font-mono truncate">
              {driver?.nMec} &middot; {driver?.area}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <Fuel className="w-4 h-4 text-[#C44020]" />
            <span className="text-white/50 text-xs">FuelControl</span>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E0E2E9] px-6 py-7">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#0F1117]">
                  Registo de Abastecimento
                </h2>
                <p className="text-[#4B5563] text-sm mt-0.5">
                  Preencha os dados do abastecimento
                </p>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                {/* Vehicle */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Viatura <span className="text-[#C44020]">*</span>
                  </Label>
                  <Select
                    value={selectedVehicleId ?? ""}
                    onValueChange={(v) => setValue("vehicleId", v, { shouldValidate: true })}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecionar viatura..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="py-3 text-base">
                          {v.matricula} &mdash; {v.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vehicleId && (
                    <p className="text-xs text-[#C44020]">{errors.vehicleId.message}</p>
                  )}
                  {selectedVehicle && (
                    <p className="text-xs text-[#4B5563]">
                      Tipo: <strong>{selectedVehicle.tipo}</strong>
                    </p>
                  )}
                </div>

                {/* Fuel type */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Tipo de Combustível <span className="text-[#C44020]">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue("fuelType", "gasolina", { shouldValidate: true })}
                      className={`h-14 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
                        fuelType === "gasolina"
                          ? "bg-amber-50 border-amber-400 text-amber-800"
                          : "bg-white border-[#E0E2E9] text-[#4B5563] hover:border-amber-300"
                      }`}
                    >
                      Gasolina
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("fuelType", "gasoleo", { shouldValidate: true })}
                      className={`h-14 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
                        fuelType === "gasoleo"
                          ? "bg-blue-50 border-blue-400 text-blue-800"
                          : "bg-white border-[#E0E2E9] text-[#4B5563] hover:border-blue-300"
                      }`}
                    >
                      Gas&oacute;leo
                    </button>
                  </div>
                  {errors.fuelType && (
                    <p className="text-xs text-[#C44020]">{errors.fuelType.message}</p>
                  )}
                </div>

                {/* Litros */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Quantidade (Litros) <span className="text-[#C44020]">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="h-12 text-xl font-mono text-center"
                    {...register("litros")}
                  />
                  {errors.litros && (
                    <p className="text-xs text-[#C44020]">{errors.litros.message}</p>
                  )}
                </div>

                {/* Observação */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#4B5563]">
                    Observa&ccedil;&atilde;o <span className="font-normal text-[#9CA3AF]">(opcional)</span>
                  </Label>
                  <Input
                    placeholder="Notas adicionais..."
                    className="h-12"
                    {...register("observacao")}
                  />
                </div>

                {/* Submit error */}
                {submitError && (
                  <div className="flex items-start gap-2 text-sm text-[#C44020] bg-red-50 border border-red-100 rounded-xl p-3.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetAll}
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-xl border-2 border-[#E0E2E9] text-[#4B5563] font-medium hover:border-[#0D1526] hover:text-[#0D1526] transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] h-12 rounded-xl bg-[#C44020] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#A53518] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 shadow-md shadow-[#C44020]/20"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? "A guardar..." : "Registar Abastecimento"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0D1526] px-4 py-10 overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 login-dot-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 login-stripes opacity-60 pointer-events-none" />

      {/* Ambient orbs */}
      <div className="login-orb-3 absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />
      <div className="login-orb-1 absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#C44020]/8 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center page-enter">
        {/* Success icon */}
        <div className="login-float-1 w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-7 shadow-xl shadow-emerald-500/40">
          <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2} />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Registo Guardado!</h1>
        <p className="text-white/55 text-base mb-8">
          O abastecimento foi registado com sucesso.
        </p>

        {/* Summary card */}
        <div className="w-full rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm px-6 py-5 text-left space-y-3.5 mb-8">
          <SummaryRow label="Condutor" value={successInfo?.driverName ?? ""} />
          <div className="border-t border-white/10" />
          <SummaryRow
            label="Viatura"
            value={`${successInfo?.vehiclePlate ?? ""} — ${successInfo?.vehicleTipo ?? ""}`}
            mono
          />
          <div className="border-t border-white/10" />
          <SummaryRow
            label="Combustível"
            value={successInfo?.fuelType === "gasolina" ? "Gasolina" : "Gasóleo"}
            accent={successInfo?.fuelType === "gasolina" ? "amber" : "blue"}
          />
          <div className="border-t border-white/10" />
          <SummaryRow
            label="Quantidade"
            value={`${successInfo?.litros ?? ""} L`}
            large
          />
        </div>

        {/* Reset button */}
        <button
          onClick={resetAll}
          className="w-full h-14 rounded-2xl bg-[#C44020] text-white text-lg font-semibold hover:bg-[#A53518] active:scale-[0.97] transition-all duration-150 shadow-lg shadow-[#C44020]/30"
        >
          Nova Entrada
        </button>

        <p className="text-white/25 text-sm mt-5">
          Regresso autom&aacute;tico em {countdown}s
        </p>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function SummaryRow({
  label,
  value,
  mono,
  large,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  large?: boolean;
  accent?: "amber" | "blue";
}) {
  const valueClass = [
    accent === "amber" ? "text-amber-300" : "",
    accent === "blue" ? "text-blue-300" : "",
    !accent ? "text-white" : "",
    mono ? "font-mono" : "font-medium",
    large ? "text-lg font-semibold" : "text-sm",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/45 text-sm">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

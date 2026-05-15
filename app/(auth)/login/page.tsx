"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fuel, Loader2, Lock, Mail, Hash, AlertCircle, Plane } from "lucide-react";

const adminSchema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const operatorSchema = z.object({
  mecNumber: z.string().min(1, "Número mecânico é obrigatório"),
  password:  z.string().min(6, "Mínimo 6 caracteres"),
});

type AdminForm    = z.infer<typeof adminSchema>;
type OperatorForm = z.infer<typeof operatorSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode]       = useState<"operator" | "admin">("operator");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveStats, setLiveStats] = useState<{ todayCount: number; lastHourCount: number } | null>(null);
  const [liveError, setLiveError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch("/api/stats/live");
        if (!cancelled) {
          if (res.ok) { setLiveStats(await res.json()); setLiveError(false); }
          else setLiveError(true);
        }
      } catch { if (!cancelled) setLiveError(true); }
    }

    fetchStats();
    const id = setInterval(fetchStats, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const adminForm = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
  });

  const operatorForm = useForm<OperatorForm>({
    resolver: zodResolver(operatorSchema),
  });

  async function handleOperatorSubmit(data: OperatorForm) {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        mecNumber: data.mecNumber,
        password:  data.password,
        redirect:  false,
      });
      if (result?.error) {
        setError("Número mecânico ou palavra-passe incorretos.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erro ao tentar iniciar sessão.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminSubmit(data: AdminForm) {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email:    data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Credenciais inválidas. Verifique o email e palavra-passe.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erro ao tentar iniciar sessão.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: "operator" | "admin") {
    setMode(next);
    setError(null);
    adminForm.reset();
    operatorForm.reset();
  }

  return (
    <div className="min-h-screen flex bg-[#080C14]">

      {/* ── Left panel (branding) ───────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-105 shrink-0 relative overflow-hidden bg-[#C44020]">
        {/* Stripe texture */}
        <div className="login-stripes absolute inset-0" />
        {/* Dot grid */}
        <div className="login-dot-grid absolute inset-0 opacity-40" />
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-56 bg-linear-to-t from-black/25 to-transparent" />
        {/* Right edge shadow */}
        <div className="absolute top-0 right-0 bottom-0 w-px bg-black/10" />

        {/* Logo */}
        <div className="relative flex items-center gap-3.5 p-10">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20 shadow-xl">
            <Fuel className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-none tracking-tight">
              FuelControl
            </p>
            <p className="text-white/55 text-[10px] tracking-[0.2em] uppercase mt-1">
              TAAG Angola
            </p>
          </div>
        </div>

        {/* Centre content */}
        <div className="relative px-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/20" />
            <Plane className="h-4 w-4 text-white/40 rotate-45" />
            <div className="h-px flex-1 bg-white/20" />
          </div>

          <h2 className="text-white text-4xl font-extrabold leading-[1.1] tracking-tight">
            Gestão de<br />Combustível
          </h2>
          <p className="text-white/55 text-sm mt-4 leading-relaxed max-w-72">
            Controlo centralizado de abastecimentos, viaturas e condutores da frota TAAG.
          </p>

          {/* Feature tags */}
          <div className="flex flex-wrap gap-2 mt-7">
            {["Abastecimentos", "Viaturas", "Condutores", "Auditoria"].map((f) => (
              <span
                key={f}
                className="text-xs text-white/70 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 font-medium"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-white/25 text-xs px-10 pb-8 tracking-wide">
          © {new Date().getFullYear()} TAAG · Linhas Aéreas de Angola
        </p>
      </div>

      {/* ── Right panel (form) ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">

        {/* Ambient glow orbs */}
        <div className="login-orb-1 absolute top-[-120px] right-[-100px] w-[400px] h-[400px] rounded-full bg-[#C44020]/18 blur-[90px] pointer-events-none" />
        <div className="login-orb-2 absolute bottom-[-100px] left-[-80px] w-[320px] h-[320px] rounded-full bg-[#D4870A]/14 blur-[80px] pointer-events-none" />
        <div className="login-orb-3 absolute top-[35%] left-[6%] w-[240px] h-[240px] rounded-full bg-[#C44020]/9 blur-[65px] pointer-events-none" />

        {/* Subtle dot grid */}
        <div className="login-dot-grid-right absolute inset-0 pointer-events-none" />

        {/* Ghost card — top right (live data) */}
        <div className="login-float-1 hidden xl:block absolute top-8 right-10 pointer-events-none select-none">
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-4 w-48">
            <div className="flex items-center gap-2 mb-3">
              <span className="login-blink inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-[10px] text-white/25 uppercase tracking-widest font-medium">Ao Vivo</span>
            </div>
            <p className="text-white/[0.28] text-[11px] leading-none mb-1.5">Abastecimentos hoje</p>
            <p className="text-white/50 text-[2rem] font-bold leading-none tracking-tight">
              {liveStats != null ? liveStats.todayCount : "–"}
            </p>
            {liveStats == null ? (
              <p className="text-white/15 text-[10px] mt-2.5">
                {liveError ? "Indisponível" : "A carregar…"}
              </p>
            ) : liveStats.lastHourCount > 0 ? (
              <p className="text-emerald-400/50 text-[10px] mt-2.5 font-medium">
                ↑ {liveStats.lastHourCount} na última hora
              </p>
            ) : (
              <p className="text-white/20 text-[10px] mt-2.5">0 na última hora</p>
            )}
          </div>
        </div>

        {/* Status badge — bottom right */}
        <div className="hidden lg:flex absolute bottom-8 right-10 items-center gap-1.5 pointer-events-none select-none">
          <span className="login-blink inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/50 shrink-0" />
          <span className="text-[10px] text-white/15 tracking-wide">Sistema operacional</span>
        </div>

        <div className="w-full max-w-90 relative z-10">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="bg-[#C44020] rounded-xl p-2 shadow-lg shadow-[#C44020]/30">
              <Fuel className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold leading-none">FuelControl</p>
              <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase mt-0.5">TAAG Angola</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[26px] font-bold text-white tracking-tight leading-none">
              Bem-vindo
            </h1>
            <p className="text-white/35 text-sm mt-1.5">Inicie sessão para continuar</p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-white/4 border border-white/7 p-1 mb-7 gap-1">
            {(["operator", "admin"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 text-sm py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  mode === m
                    ? "bg-[#C44020] text-white shadow-md shadow-[#C44020]/30"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                {m === "operator" ? "Operador" : "Administrador"}
              </button>
            ))}
          </div>

          {/* Operator form */}
          {mode === "operator" && (
            <form
              onSubmit={operatorForm.handleSubmit(handleOperatorSubmit)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="mecNumber"
                  className="text-white/45 text-[11px] font-semibold uppercase tracking-wider"
                >
                  Número Mecânico
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    id="mecNumber"
                    type="text"
                    placeholder="Ex: M001"
                    autoComplete="username"
                    className="pl-10 h-11 bg-white/5 border-white/8 text-white placeholder:text-white/18 focus-visible:ring-[#C44020] focus-visible:border-[#C44020]/40 rounded-xl text-sm"
                    {...operatorForm.register("mecNumber")}
                  />
                </div>
                {operatorForm.formState.errors.mecNumber && (
                  <p className="text-xs text-red-400 mt-1">
                    {operatorForm.formState.errors.mecNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="op-password"
                  className="text-white/45 text-[11px] font-semibold uppercase tracking-wider"
                >
                  Palavra-passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    id="op-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pl-10 h-11 bg-white/5 border-white/8 text-white placeholder:text-white/18 focus-visible:ring-[#C44020] focus-visible:border-[#C44020]/40 rounded-xl text-sm"
                    {...operatorForm.register("password")}
                  />
                </div>
                {operatorForm.formState.errors.password && (
                  <p className="text-xs text-red-400 mt-1">
                    {operatorForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {error && <ErrorAlert message={error} />}

              <Button
                type="submit"
                className="w-full h-11 bg-[#C44020] hover:bg-[#A53518] text-white border-0 rounded-xl font-semibold mt-1 shadow-lg shadow-[#C44020]/25 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />A entrar…</>
                ) : "Entrar"}
              </Button>
            </form>
          )}

          {/* Admin form */}
          {mode === "admin" && (
            <form
              onSubmit={adminForm.handleSubmit(handleAdminSubmit)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-white/45 text-[11px] font-semibold uppercase tracking-wider"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    autoComplete="email"
                    className="pl-10 h-11 bg-white/5 border-white/8 text-white placeholder:text-white/18 focus-visible:ring-[#C44020] focus-visible:border-[#C44020]/40 rounded-xl text-sm"
                    {...adminForm.register("email")}
                  />
                </div>
                {adminForm.formState.errors.email && (
                  <p className="text-xs text-red-400 mt-1">
                    {adminForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="adm-password"
                  className="text-white/45 text-[11px] font-semibold uppercase tracking-wider"
                >
                  Palavra-passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    id="adm-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pl-10 h-11 bg-white/5 border-white/8 text-white placeholder:text-white/18 focus-visible:ring-[#C44020] focus-visible:border-[#C44020]/40 rounded-xl text-sm"
                    {...adminForm.register("password")}
                  />
                </div>
                {adminForm.formState.errors.password && (
                  <p className="text-xs text-red-400 mt-1">
                    {adminForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {error && <ErrorAlert message={error} />}

              <Button
                type="submit"
                className="w-full h-11 bg-[#C44020] hover:bg-[#A53518] text-white border-0 rounded-xl font-semibold mt-1 shadow-lg shadow-[#C44020]/25 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />A entrar…</>
                ) : "Entrar"}
              </Button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/18 p-3.5">
      <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}

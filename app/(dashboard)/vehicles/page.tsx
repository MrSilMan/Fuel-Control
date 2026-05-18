"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Car, Loader2, AlertTriangle, Wrench } from "lucide-react";

interface Vehicle {
  id: string;
  matricula: string;
  tipo: string;
  km: number | null;
  nextMaintenanceKm: number | null;
  createdAt: string;
}

const MAINTENANCE_WARNING_THRESHOLD = 500;

function getMaintenanceStatus(vehicle: Vehicle) {
  if (vehicle.km == null || vehicle.nextMaintenanceKm == null) return null;
  const remaining = vehicle.nextMaintenanceKm - vehicle.km;
  if (remaining <= 0) return { status: "due" as const, remaining: 0 };
  if (remaining <= MAINTENANCE_WARNING_THRESHOLD) return { status: "warning" as const, remaining };
  return { status: "ok" as const, remaining };
}

const VEHICLE_TYPES = ["HIACE", "Coaster", "Foton", "Pickup", "Sedan", "SUV", "Outro"];

const TIPO_COLORS: Record<string, string> = {
  HIACE:   "bg-blue-600 text-white border-blue-600",
  Coaster: "bg-indigo-500 text-white border-indigo-500",
  Foton:   "bg-amber-500 text-white border-amber-500",
  Pickup:  "bg-emerald-600 text-white border-emerald-600",
  Sedan:   "bg-purple-600 text-white border-purple-600",
  SUV:     "bg-[#C44020] text-white border-[#C44020]",
  Outro:   "bg-zinc-500 text-white border-zinc-500",
};

function VehicleTypeSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  const [customTypes, setCustomTypes] = useState<string[]>(() =>
    value && !VEHICLE_TYPES.includes(value) ? [value] : []
  );
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const knownTypes = [...VEHICLE_TYPES.filter((t) => t !== "Outro"), ...customTypes];

  function handleSelectChange(val: string) {
    if (val === "Outro") {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      onChange(val);
    }
  }

  function handleAddCustomType() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!VEHICLE_TYPES.includes(trimmed) && !customTypes.includes(trimmed)) {
      setCustomTypes((prev) => [...prev, trimmed]);
    }
    onChange(trimmed);
    setCustomInput("");
    setShowCustomInput(false);
  }

  return (
    <div className="space-y-2">
      <select
        id={id}
        title="Tipo de viatura"
        className="flex h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
        value={showCustomInput ? "Outro" : value}
        onChange={(e) => handleSelectChange(e.target.value)}
      >
        <option value="">Selecionar tipo…</option>
        {knownTypes.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
        <option value="Outro">Outro…</option>
      </select>
      {showCustomInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Novo tipo de viatura…"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleAddCustomType(); }
              if (e.key === "Escape") { setShowCustomInput(false); setCustomInput(""); }
            }}
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustomType}
            disabled={!customInput.trim()}
          >
            Adicionar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => { setShowCustomInput(false); setCustomInput(""); }}
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
}

export default function VehiclesPage() {
  const { data: session } = useSession();
  const [vehicles, setVehicles]       = useState<Vehicle[]>([]);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ matricula: "", tipo: "", km: "", nextMaintenanceKm: "" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [editTarget, setEditTarget]   = useState<Vehicle | null>(null);
  const [editForm, setEditForm]       = useState({ matricula: "", tipo: "", km: "", nextMaintenanceKm: "" });
  const [saving, setSaving]           = useState(false);

  const router  = useRouter();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    if (session && !isAdmin) router.replace("/dashboard");
  }, [session, isAdmin, router]);

  async function fetchVehicles() {
    setLoading(true);
    try {
      const res  = await fetch("/api/vehicles");
      const json = await res.json();
      setVehicles(json.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchVehicles(); }, []);

  async function handleAdd() {
    if (!form.matricula || !form.tipo) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/vehicles", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ variant: "success", title: "Viatura adicionada" });
      setForm({ matricula: "", tipo: "", km: "", nextMaintenanceKm: "" });
      setShowForm(false);
      fetchVehicles();
    } catch (err) {
      toast({
        variant:     "destructive",
        title:       "Erro",
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setAdding(false);
    }
  }

  function openEdit(v: Vehicle) {
    setEditTarget(v);
    setEditForm({
      matricula: v.matricula,
      tipo: v.tipo,
      km: v.km != null ? String(v.km) : "",
      nextMaintenanceKm: v.nextMaintenanceKm != null ? String(v.nextMaintenanceKm) : "",
    });
  }

  async function handleSaveEdit() {
    if (!editTarget || !editForm.matricula || !editForm.tipo) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles?id=${editTarget.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ variant: "success", title: "Viatura atualizada" });
      setEditTarget(null);
      fetchVehicles();
    } catch (err) {
      toast({
        variant:     "destructive",
        title:       "Erro ao guardar",
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/vehicles?id=${deleteTarget}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao eliminar");
      toast({ variant: "success", title: "Viatura eliminada" });
      setDeleteTarget(null);
      fetchVehicles();
    } catch (err) {
      toast({
        variant:     "destructive",
        title:       "Erro ao eliminar",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <Header title="Viaturas" />

        <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground font-medium">
              {vehicles.length} viatura{vehicles.length !== 1 ? "s" : ""} registada{vehicles.length !== 1 ? "s" : ""}
            </p>
            {isAdmin && (
              <Button
                size="sm"
                className="bg-[#C44020] hover:bg-[#A53518] text-white border-0 rounded-xl h-9 shadow-sm"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nova Viatura
              </Button>
            )}
          </div>


          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-[#C44020]" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                <Car className="h-8 w-8 opacity-30" />
              </div>
              <p className="font-medium">Nenhuma viatura registada</p>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl mt-1"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Adicionar primeira viatura
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {vehicles.map((v) => {
                const ms = getMaintenanceStatus(v);
                return (
                  <div
                    key={v.id}
                    className="group bg-card rounded-2xl border border-border/60 p-4 card-hover flex flex-col gap-0"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="icon-bg-orange rounded-xl p-2.5 shrink-0">
                          <Car className="h-5 w-5 text-[#C44020] dark:text-orange-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold font-mono text-foreground text-sm leading-none truncate">
                            {v.matricula}
                          </p>
                          <span
                            className={`inline-block mt-2 text-xs font-bold border rounded-full px-2 py-0.5 ${
                              TIPO_COLORS[v.tipo] ?? TIPO_COLORS.Outro
                            }`}
                          >
                            {v.tipo}
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => openEdit(v)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8"
                            onClick={() => setDeleteTarget(v.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Stats row */}
                    {(v.km != null || v.nextMaintenanceKm != null) && (
                      <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-x-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                            Km atual
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {v.km != null ? v.km.toLocaleString("pt-PT") : "—"} km
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                            Próx. manutenção
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {v.nextMaintenanceKm != null ? v.nextMaintenanceKm.toLocaleString("pt-PT") : "—"} km
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Maintenance alert — only when actionable */}
                    {ms && ms.status !== "ok" && (
                      <div
                        className={`mt-2 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold ${
                          ms.status === "due"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {ms.status === "due" ? (
                          <><Wrench className="h-3 w-3 shrink-0" /> Manutenção necessária</>
                        ) : (
                          <><AlertTriangle className="h-3 w-3 shrink-0" /> {ms.remaining.toLocaleString("pt-PT")} km para manutenção</>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setForm({ matricula: "", tipo: "", km: "", nextMaintenanceKm: "" }); } }}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden gap-0">
          <div className="bg-linear-to-br from-[#C44020] to-[#a03318] px-6 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/15 rounded-xl p-2.5">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-base font-bold leading-none mb-0.5">
                  Nova Viatura
                </DialogTitle>
                <DialogDescription className="text-white/70 text-xs leading-none m-0">
                  Preencha os dados e clique em Guardar.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Matrícula
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                  <Car className="h-4 w-4" />
                </span>
                <Input
                  placeholder="LD-12-45-HY"
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value.toUpperCase() })}
                  className="h-11 pl-9 rounded-xl font-mono font-bold tracking-widest text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </Label>
              <VehicleTypeSelect
                value={form.tipo}
                onChange={(v) => setForm({ ...form, tipo: v })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quilometragem atual
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="45000"
                    value={form.km}
                    onChange={(e) => setForm({ ...form, km: e.target.value })}
                    className="h-11 pr-10 rounded-xl text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/60 pointer-events-none">
                    km
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Próx. manutenção
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="50000"
                    value={form.nextMaintenanceKm}
                    onChange={(e) => setForm({ ...form, nextMaintenanceKm: e.target.value })}
                    className="h-11 pr-10 rounded-xl text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/60 pointer-events-none">
                    km
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-muted/30">
            <Button
              variant="ghost"
              onClick={() => { setShowForm(false); setForm({ matricula: "", tipo: "", km: "", nextMaintenanceKm: "" }); }}
              disabled={adding}
              className="rounded-xl h-9 text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#C44020] hover:bg-[#A53518] text-white border-0 rounded-xl h-9 px-5 shadow-sm"
              onClick={handleAdd}
              disabled={adding}
            >
              {adding && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden gap-0">
          {/* Header strip */}
          <div className="bg-linear-to-br from-[#C44020] to-[#a03318] px-6 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/15 rounded-xl p-2.5">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-base font-bold leading-none mb-0.5">
                  Editar Viatura
                </DialogTitle>
                <DialogDescription className="text-white/70 text-xs leading-none m-0">
                  {editTarget?.matricula ?? ""}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Matrícula */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Matrícula
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                  <Car className="h-4 w-4" />
                </span>
                <Input
                  placeholder="LD-12-45-HY"
                  value={editForm.matricula}
                  onChange={(e) =>
                    setEditForm({ ...editForm, matricula: e.target.value.toUpperCase() })
                  }
                  className="h-11 pl-9 rounded-xl font-mono font-bold tracking-widest text-sm"
                />
              </div>
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </Label>
              <VehicleTypeSelect
                value={editForm.tipo}
                onChange={(v) => setEditForm({ ...editForm, tipo: v })}
              />
            </div>

            {/* KM row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quilometragem atual
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="45000"
                    value={editForm.km}
                    onChange={(e) => setEditForm({ ...editForm, km: e.target.value })}
                    className="h-11 pr-10 rounded-xl text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/60 pointer-events-none">
                    km
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Próx. manutenção
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="50000"
                    value={editForm.nextMaintenanceKm}
                    onChange={(e) => setEditForm({ ...editForm, nextMaintenanceKm: e.target.value })}
                    className="h-11 pr-10 rounded-xl text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/60 pointer-events-none">
                    km
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-muted/30">
            <Button
              variant="ghost"
              onClick={() => setEditTarget(null)}
              disabled={saving}
              className="rounded-xl h-9 text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#C44020] hover:bg-[#A53518] text-white border-0 rounded-xl h-9 px-5 shadow-sm"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar viatura
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser revertida. A viatura será removida permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-xl"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

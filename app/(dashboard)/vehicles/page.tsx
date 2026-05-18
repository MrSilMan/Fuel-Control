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
import { Plus, Trash2, Pencil, Car, Loader2, AlertTriangle } from "lucide-react";

interface Vehicle {
  id: string;
  matricula: string;
  tipo: string;
  createdAt: string;
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
  const [form, setForm]               = useState({ matricula: "", tipo: "" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [editTarget, setEditTarget]   = useState<Vehicle | null>(null);
  const [editForm, setEditForm]       = useState({ matricula: "", tipo: "" });
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
      setForm({ matricula: "", tipo: "" });
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
    setEditForm({ matricula: v.matricula, tipo: v.tipo });
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
                onClick={() => setShowForm((v) => !v)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nova Viatura
              </Button>
            )}
          </div>

          {/* Add form */}
          {showForm && isAdmin && (
            <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
              <p className="text-sm font-semibold text-foreground mb-4">Adicionar Viatura</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Matrícula
                  </Label>
                  <Input
                    placeholder="LD-12-45-HY"
                    value={form.matricula}
                    onChange={(e) => setForm({ ...form, matricula: e.target.value.toUpperCase() })}
                    className="h-10 rounded-xl"
                  />
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
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  className="bg-[#C44020] hover:bg-[#A53518] text-white border-0 rounded-xl"
                  onClick={handleAdd}
                  disabled={adding}
                >
                  {adding && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

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
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="group bg-card rounded-2xl border border-border/60 p-4 card-hover"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Icon + info */}
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

                    {/* Actions */}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar Viatura</DialogTitle>
            <DialogDescription>
              Altere os dados da viatura e clique em Guardar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Matrícula
              </Label>
              <Input
                placeholder="LD-12-45-HY"
                value={editForm.matricula}
                onChange={(e) =>
                  setEditForm({ ...editForm, matricula: e.target.value.toUpperCase() })
                }
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </Label>
              <VehicleTypeSelect
                value={editForm.tipo}
                onChange={(v) => setEditForm({ ...editForm, tipo: v })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={saving} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              className="bg-[#C44020] hover:bg-[#A53518] text-white border-0 rounded-xl"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Guardar
            </Button>
          </DialogFooter>
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

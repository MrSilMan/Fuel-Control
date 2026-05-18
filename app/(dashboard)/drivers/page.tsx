"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Users, Loader2, AlertTriangle } from "lucide-react";

interface Driver {
  id: string;
  nome: string;
  nMec: string;
  area: string;
  createdAt: string;
}

const AREAS = ["DAS", "Eurost", "DMC", "DGAS", "TIC", "RH", "Financeiro", "Outro"];

const AREA_COLORS: Record<string, string> = {
  DAS:        "bg-[#C44020] text-white border-[#C44020]",
  Eurost:     "bg-blue-600 text-white border-blue-600",
  DMC:        "bg-emerald-600 text-white border-emerald-600",
  DGAS:       "bg-amber-500 text-white border-amber-500",
  TIC:        "bg-indigo-500 text-white border-indigo-500",
  RH:         "bg-purple-600 text-white border-purple-600",
  Financeiro: "bg-teal-600 text-white border-teal-600",
  Outro:      "bg-zinc-500 text-white border-zinc-500",
};

function AreaSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      title="Área do condutor"
      className="flex h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Selecionar área…</option>
      {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
    </select>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  "from-[#C44020] to-[#8A2D15]",
  "from-blue-500 to-blue-700",
  "from-emerald-500 to-emerald-700",
  "from-indigo-500 to-indigo-700",
  "from-amber-500 to-amber-700",
  "from-purple-500 to-purple-700",
];

export default function DriversPage() {
  const { data: session } = useSession();
  const [drivers, setDrivers]           = useState<Driver[]>([]);
  const [loading, setLoading]           = useState(true);
  const [adding, setAdding]             = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ nome: "", nMec: "", area: "" });
  const [areaSelect, setAreaSelect]     = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; nome: string }>({ open: false, id: "", nome: "" });
  const [deleting, setDeleting]         = useState(false);
  const [editTarget, setEditTarget]     = useState<Driver | null>(null);
  const [editForm, setEditForm]         = useState({ nome: "", nMec: "", area: "" });
  const [editAreaSelect, setEditAreaSelect] = useState("");
  const [saving, setSaving]             = useState(false);

  const router  = useRouter();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    if (session && !isAdmin) router.replace("/dashboard");
  }, [session, isAdmin, router]);

  async function fetchDrivers() {
    setLoading(true);
    try {
      const res  = await fetch("/api/drivers");
      const json = await res.json();
      setDrivers(json.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDrivers(); }, []);

  async function handleAdd() {
    if (!form.nome || !form.nMec || !form.area) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/drivers", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ variant: "success", title: "Condutor adicionado" });
      setForm({ nome: "", nMec: "", area: "" });
      setAreaSelect("");
      setShowForm(false);
      fetchDrivers();
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

  function openEdit(d: Driver) {
    setEditTarget(d);
    const knownArea = AREAS.includes(d.area) ? d.area : "Outro";
    setEditAreaSelect(knownArea);
    setEditForm({ nome: d.nome, nMec: d.nMec, area: d.area });
  }

  async function handleSaveEdit() {
    if (!editTarget || !editForm.nome || !editForm.nMec || !editForm.area) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/drivers?id=${editTarget.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ variant: "success", title: "Condutor atualizado" });
      setEditTarget(null);
      fetchDrivers();
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

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      const res  = await fetch(`/api/drivers?id=${confirmDelete.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao eliminar");
      toast({ variant: "success", title: "Condutor eliminado" });
      setConfirmDelete({ open: false, id: "", nome: "" });
      fetchDrivers();
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
    <div className="flex flex-col h-full">
      <Header title="Condutores" />

      <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground font-medium">
            {drivers.length} condutor{drivers.length !== 1 ? "es" : ""} registado{drivers.length !== 1 ? "s" : ""}
          </p>
          {isAdmin && (
            <Button
              size="sm"
              className="bg-[#C44020] hover:bg-[#A53518] text-white border-0 rounded-xl h-9 shadow-sm"
              onClick={() => setShowForm((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Novo Condutor
            </Button>
          )}
        </div>

        {/* Add form */}
        {showForm && isAdmin && (
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-4">Adicionar Condutor</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome
                </Label>
                <Input
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nº Mecográfico
                </Label>
                <Input
                  placeholder="M001"
                  value={form.nMec}
                  onChange={(e) => setForm({ ...form, nMec: e.target.value.toUpperCase() })}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Área
                </Label>
                <AreaSelect
                  value={areaSelect}
                  onChange={(v) => {
                    setAreaSelect(v);
                    if (v !== "Outro") setForm({ ...form, area: v });
                    else setForm({ ...form, area: "" });
                  }}
                />
                {areaSelect === "Outro" && (
                  <Input
                    placeholder="Escrever área…"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="h-10 rounded-xl mt-2"
                    autoFocus
                  />
                )}
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
              <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setShowForm(false)}>
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
        ) : drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 opacity-30" />
            </div>
            <p className="font-medium">Nenhum condutor registado</p>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl mt-1"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Adicionar primeiro condutor
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {drivers.map((d, idx) => {
              const avatarGradient = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const areaClass = AREA_COLORS[d.area] ?? AREA_COLORS.Outro;
              return (
                <div
                  key={d.id}
                  className="group bg-card rounded-2xl border border-border/60 p-4 card-hover"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div
                        className={`h-10 w-10 rounded-xl bg-linear-to-br ${avatarGradient} flex items-center justify-center text-[12px] font-bold text-white shrink-0 shadow-sm`}
                      >
                        {getInitials(d.nome)}
                      </div>
                      {/* Info */}
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm leading-tight truncate">
                          {d.nome}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {d.nMec}
                        </p>
                        <span
                          className={`inline-block mt-1.5 text-xs font-bold border rounded-full px-2 py-0.5 ${areaClass}`}
                        >
                          {d.area}
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
                          onClick={() => openEdit(d)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8"
                          onClick={() => setConfirmDelete({ open: true, id: d.id, nome: d.nome })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar Condutor</DialogTitle>
            <DialogDescription>Altere os dados do condutor e clique em Guardar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</Label>
              <Input
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nº Mecográfico</Label>
              <Input
                value={editForm.nMec}
                onChange={(e) => setEditForm({ ...editForm, nMec: e.target.value.toUpperCase() })}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Área</Label>
              <AreaSelect
                value={editAreaSelect}
                onChange={(v) => {
                  setEditAreaSelect(v);
                  if (v !== "Outro") setEditForm({ ...editForm, area: v });
                  else setEditForm({ ...editForm, area: "" });
                }}
              />
              {editAreaSelect === "Outro" && (
                <Input
                  placeholder="Escrever área…"
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                  className="h-10 rounded-xl mt-2"
                  autoFocus
                />
              )}
            </div>
          </div>
          <DialogFooter>
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

      {/* Delete dialog */}
      <Dialog
        open={confirmDelete.open}
        onOpenChange={(open) => !open && setConfirmDelete({ open: false, id: "", nome: "" })}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar Condutor
            </DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja eliminar{" "}
              <strong>{confirmDelete.nome}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" disabled={deleting} className="rounded-xl">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="rounded-xl"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Campo obrigatório"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Campo obrigatório"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: json.message });
        return;
      }

      toast({ variant: "success", title: "Palavra-passe alterada com sucesso" });
      reset();
      onOpenChange(false);
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Erro inesperado" });
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Alterar Palavra-passe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Palavra-passe atual</Label>
            <Input id="currentPassword" type="password" {...register("currentPassword")} />
            {errors.currentPassword && (
              <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nova palavra-passe</Label>
            <Input id="newPassword" type="password" {...register("newPassword")} />
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar nova palavra-passe</Label>
            <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

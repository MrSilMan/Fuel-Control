import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string, hora?: string | null): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dateStr = d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return hora ? `${dateStr} ${hora}` : dateStr;
}

export function formatLitres(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(1)} L`;
}

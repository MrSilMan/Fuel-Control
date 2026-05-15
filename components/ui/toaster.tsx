"use client";

import { CheckCircle2, XCircle, Info } from "lucide-react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

const variantConfig = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    bgClass: "bg-emerald-50 dark:bg-emerald-500/10",
    barClass: "bg-emerald-500",
  },
  destructive: {
    icon: XCircle,
    iconClass: "text-red-500",
    bgClass: "bg-red-50 dark:bg-red-500/10",
    barClass: "bg-red-500",
  },
  default: {
    icon: Info,
    iconClass: "text-blue-500",
    bgClass: "bg-blue-50 dark:bg-blue-500/10",
    barClass: "bg-blue-500",
  },
} as const;

type Variant = keyof typeof variantConfig;

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const key = (variant ?? "default") as Variant;
        const { icon: Icon, iconClass, bgClass, barClass } = variantConfig[key] ?? variantConfig.default;

        return (
          <Toast key={id} variant={variant} {...props}>
            {/* Icon */}
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bgClass}`}>
              <Icon className={`h-4.5 w-4.5 ${iconClass}`} strokeWidth={2} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>

            {action}
            <ToastClose />

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-xl bg-zinc-100 dark:bg-zinc-800">
              <div className={`toast-progress-bar h-full ${barClass} origin-left`} />
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

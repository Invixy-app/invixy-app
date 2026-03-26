"use client";

import { Button } from "@/components/ui/button";
import { useAlertStore } from "@/lib/alert-store";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Loader2,
} from "lucide-react";

const alertIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  confirm: HelpCircle,
};

const alertStyles = {
  success: "text-[var(--brand-teal)]",
  error: "text-red-600",
  warning: "text-[var(--brand-cobalt)]",
  info: "text-[var(--brand-cobalt)]",
  confirm: "text-muted-foreground",
};

export function GlobalAlert() {
  const {
    isOpen,
    type,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "OK",
    cancelText = "Cancel",
    loading,
    hideAlert,
    setLoading,
  } = useAlertStore();

  const Icon = alertIcons[type];
  const iconStyle = alertStyles[type];

  const handleConfirm = async () => {
    if (type === "confirm") {
      // Close the confirm first so any follow-up alert (success/error) is not immediately hidden.
      hideAlert();
    }

    if (onConfirm) {
      try {
        setLoading(true);
        await onConfirm();
      } catch (error) {
        console.error("Error in alert confirm:", error);
      } finally {
        setLoading(false);
      }
    }

    if (type !== "confirm") {
      hideAlert();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    hideAlert();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Icon className={`h-5 w-5 ${iconStyle}`} />
          <span>{title}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {type === "confirm" ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={loading} type="button">
                {cancelText}
              </Button>
              <Button
                variant="default"
                onClick={handleConfirm}
                disabled={loading}
                type="button"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {confirmText}
              </Button>
            </>
          ) : (
            <Button onClick={handleConfirm} disabled={loading} type="button">
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
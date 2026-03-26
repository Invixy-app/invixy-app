"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    hideAlert();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    hideAlert();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && hideAlert()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconStyle}`} />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {type === "confirm" ? (
            <>
              <AlertDialogCancel asChild>
                <Button variant="outline" onClick={handleCancel} disabled={loading}>
                  {cancelText}
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant="default"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {confirmText}
                </Button>
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction asChild>
              <Button onClick={handleConfirm} disabled={loading}>
                {confirmText}
              </Button>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
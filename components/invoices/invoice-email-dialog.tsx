"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail } from "lucide-react";
import { showError, showSuccess } from "@/lib/alert-store";

interface InvoiceEmailDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail?: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InvoiceEmailDialog({
  invoiceId,
  invoiceNumber,
  customerEmail = "",
  customerName,
  open,
  onOpenChange,
  onSuccess,
}: InvoiceEmailDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient: customerEmail,
    subject: `Invoice ${invoiceNumber}`,
    message: `Dear ${customerName},\n\nPlease find attached invoice ${invoiceNumber} for your review and payment.\n\nThank you for your business!\n\nBest regards`,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.recipient) {
      showError("Validation Error", "Please enter recipient email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: formData.recipient,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      const result = await response.json();
      
      showSuccess("Success", `Invoice emailed successfully to ${result.recipient}`);

      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setFormData({
        recipient: customerEmail,
        subject: `Invoice ${invoiceNumber}`,
        message: `Dear ${customerName},\n\nPlease find attached invoice ${invoiceNumber} for your review and payment.\n\nThank you for your business!\n\nBest regards`,
      });
    } catch (error) {
      console.error("Email error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Email Invoice</DialogTitle>
          <DialogDescription>
            Send invoice {invoiceNumber} to customer via email
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">
                Recipient Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recipient"
                type="email"
                placeholder="customer@example.com"
                value={formData.recipient}
                onChange={(e) =>
                  setFormData({ ...formData, recipient: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Invoice subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Email message (optional)"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={8}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This message will be included in the email body along with the
                invoice details. The PDF will be attached automatically.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

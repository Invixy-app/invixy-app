"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Building2, Mail, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS } from "@/lib/business";
import { businessSchema, type BusinessFormValues } from "@/lib/validations/business";
import { z } from "zod";
import { InvoiceTemplateSelector } from "@/components/invoices/invoice-template-selector";

export default function NewBusinessPage() {
  const { refreshBusinesses } = useBusinessContext();
  const [formData, setFormData] = useState<BusinessFormValues>({
    name: "",
    description: "",
    billingAddress: "",
    shippingAddress: "",
    taxRegistrationNumber: "",
    phone: "",
    email: "",
    website: "",
    currency: "USD",
    timezone: "UTC",
    invoiceTemplate: "TEMPLATE_1",
    isActive: true,
    logo: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const validateForm = (): boolean => {
    try {
      businessSchema.parse(formData);
      setFieldErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        for (const err of error.issues) {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        }
        setFieldErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const validatedData = businessSchema.parse(formData);
      const res = await fetch("/api/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh the business list in the context
        await refreshBusinesses();
        router.push("/dashboard");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const copyBillingToShipping = () => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: prev.billingAddress,
    }));
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Business</h1>
            <p className="text-muted-foreground">
              Set up your business profile to start managing invoices
            </p>
          </div>
        </div>

        <Card className="shadow-sm border-border/80">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Provide basic information about your business
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">
                    Business Name<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter business name"
                    value={formData.name}
                    onChange={handleChange}
                    className={fieldErrors.name ? "border-red-500" : ""}
                  />
                  {fieldErrors.name && <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of your business"
                    value={formData.description || ""}
                    onChange={handleChange}
                    rows={3}
                    className={fieldErrors.description ? "border-red-500" : ""}
                  />
                  {fieldErrors.description && <p className="text-sm text-red-500 mt-1">{fieldErrors.description}</p>}
                </div>

                <div>
                  <Label htmlFor="phone">
                    Phone Number<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Business phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className={fieldErrors.phone ? "border-red-500" : ""}
                  />
                  {fieldErrors.phone && <p className="text-sm text-red-500 mt-1">{fieldErrors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="email">
                    Email Address<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Business email address"
                    value={formData.email}
                    onChange={handleChange}
                    className={fieldErrors.email ? "border-red-500" : ""}
                  />
                  {fieldErrors.email && <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={formData.website || ""}
                    onChange={handleChange}
                    className={fieldErrors.website ? "border-red-500" : ""}
                  />
                  {fieldErrors.website && <p className="text-sm text-red-500 mt-1">{fieldErrors.website}</p>}
                </div>

                <div>
                  <Label htmlFor="taxRegistrationNumber">Tax Registration Number</Label>
                  <Input
                    id="taxRegistrationNumber"
                    name="taxRegistrationNumber"
                    placeholder="Tax registration/VAT number"
                    value={formData.taxRegistrationNumber || ""}
                    onChange={handleChange}
                    className={fieldErrors.taxRegistrationNumber ? "border-red-500" : ""}
                  />
                  {fieldErrors.taxRegistrationNumber && <p className="text-sm text-red-500 mt-1">{fieldErrors.taxRegistrationNumber}</p>}
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Address Information
                </h3>

                <div>
                  <Label htmlFor="billingAddress">
                    Billing Address<span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="billingAddress"
                    name="billingAddress"
                    placeholder="Enter complete billing address"
                    value={formData.billingAddress}
                    onChange={handleChange}
                    rows={3}
                    className={fieldErrors.billingAddress ? "border-red-500" : ""}
                  />
                  {fieldErrors.billingAddress && <p className="text-sm text-red-500 mt-1">{fieldErrors.billingAddress}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="shippingAddress">
                      Shipping Address<span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyBillingToShipping}
                    >
                      Copy from billing
                    </Button>
                  </div>
                  <Textarea
                    id="shippingAddress"
                    name="shippingAddress"
                    placeholder="Enter complete shipping address"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    rows={3}
                    className={fieldErrors.shippingAddress ? "border-red-500" : ""}
                  />
                  {fieldErrors.shippingAddress && <p className="text-sm text-red-500 mt-1">{fieldErrors.shippingAddress}</p>}
                </div>
              </div>

              {/* Business Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Business Settings
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleSelectChange("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => handleSelectChange("timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((timezone) => (
                          <SelectItem key={timezone.value} value={timezone.value}>
                            {timezone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <InvoiceTemplateSelector
                      value={formData.invoiceTemplate}
                      onChange={(value) => handleSelectChange("invoiceTemplate", value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Business
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
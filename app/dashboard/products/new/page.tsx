"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showError, showSuccess } from "@/lib/alert-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, DollarSign, Hash, Package } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";

type ProductFormData = ProductFormValues & { businessId: string };

interface TaxSystem {
  id: string;
  name: string;
  taxId: string;
  rate: number;
  taxType: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [taxSystems, setTaxSystems] = useState<TaxSystem[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    businessId: "",
    name: "",
    description: "",
    sku: "",
    price: 0,
    cost: 0,
    category: "",
    unit: "pcs",
    stockQuantity: 0,
    minStockLevel: 0,
    taxSystemId: "none",
    isActive: true,
  });

  useEffect(() => {
    if (currentBusiness?.id) {
      setFormData((prev) => ({ ...prev, businessId: currentBusiness.id }));
      fetchTaxSystems();
    }
  }, [currentBusiness?.id]);

  const fetchTaxSystems = async () => {
    if (!currentBusiness?.id) return;

    try {
      const response = await fetch(`/api/tax-systems?businessId=${currentBusiness.id}`);
      if (response.ok) {
        const data = await response.json();
        setTaxSystems(data);
      }
    } catch (error) {
      console.error("Error fetching tax systems:", error);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getCurrencySymbol = (currency: string) => {
    try {
      return (0)
        .toLocaleString("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        .replaceAll(/\d/g, "")
        .trim();
    } catch {
      return "$";
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currentBusiness?.currency || "USD",
    }).format(amount);
  };

  const validateForm = (): boolean => {
    try {
      productSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        for (const err of error.issues) {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        }
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (!currentBusiness?.id) {
        showError("No Business", "Please select a business first");
        return;
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          businessId: currentBusiness.id,
        }),
      });

      if (response.ok) {
        showSuccess("Success", "Product created successfully");
        router.push("/dashboard/products");
      } else {
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const unitOptions = [
    { value: "pcs", label: "Pieces" },
    { value: "kg", label: "Kilograms" },
    { value: "g", label: "Grams" },
    { value: "lb", label: "Pounds" },
    { value: "oz", label: "Ounces" },
    { value: "l", label: "Liters" },
    { value: "ml", label: "Milliliters" },
    { value: "m", label: "Meters" },
    { value: "cm", label: "Centimeters" },
    { value: "ft", label: "Feet" },
    { value: "in", label: "Inches" },
    { value: "box", label: "Boxes" },
    { value: "pack", label: "Packs" },
    { value: "set", label: "Sets" },
    { value: "hrs", label: "Hours" },
    { value: "days", label: "Days" },
  ];

  if (businessLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[var(--brand-cobalt)]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentBusiness) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold">No Business Selected</h3>
            <p className="mb-4 text-muted-foreground">Please select a business from the top bar or create a new one.</p>
            <Link href="/dashboard/businesses/new">
              <Button>Create Your First Business</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/dashboard/products" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-cobalt)] hover:text-[var(--brand-indigo)]">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Add New Product</h1>
            <p className="max-w-2xl text-muted-foreground">
              Configure your product parameters, pricing strategies, and regional tax systems in one unified interface.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/products">
              <Button variant="outline">Discard Draft</Button>
            </Link>
            <Button type="submit" form="new-product-form" disabled={loading} className="bg-[var(--brand-cobalt)] text-white hover:bg-[var(--brand-indigo)]">
              {loading ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </div>

        <form id="new-product-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <Card className="rounded-3xl border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-cobalt)]/10 text-[var(--brand-cobalt)]">
                    <Package className="h-4 w-4" />
                  </span>
                  <span>Basic Information</span>
                </CardTitle>
                <CardDescription>Essential identification details for your inventory system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      placeholder="e.g. Enterprise Cloud License"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">Item Code</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="sku"
                        placeholder="SKU-8829-X"
                        value={formData.sku}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the product features, inclusions, and technical specifications..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="Software Services"
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                    />
                    {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit of Measure</Label>
                    <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.unit && <p className="text-sm text-red-500">{errors.unit}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-teal)]/12 text-[var(--brand-teal)]">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <span>Pricing & Tax</span>
                </CardTitle>
                <CardDescription>Define your margins and regulatory compliance settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 flex h-4 w-4 items-center justify-center text-sm font-semibold text-muted-foreground">
                        {getCurrencySymbol(currentBusiness?.currency || "USD")}
                      </div>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.price || ""}
                        onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                        className={`pl-10 ${errors.price ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost Price</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 flex h-4 w-4 items-center justify-center text-sm font-semibold text-muted-foreground">
                        {getCurrencySymbol(currentBusiness?.currency || "USD")}
                      </div>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.cost || ""}
                        onChange={(e) => handleInputChange("cost", Number.parseFloat(e.target.value) || 0)}
                        className="pl-10"
                      />
                    </div>
                    {errors.cost && <p className="text-sm text-red-500">{errors.cost}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxSystem">Tax System</Label>
                    <Select value={formData.taxSystemId} onValueChange={(value) => handleInputChange("taxSystemId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tax system" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No tax system</SelectItem>
                        {taxSystems.map((tax) => (
                          <SelectItem key={tax.id} value={tax.id}>
                            {tax.name} ({(tax.rate * 100).toFixed(2)}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.price > 0 && formData.cost !== undefined && formData.cost >= 0 && (
                  <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Estimated Margin</div>
                    <div className="text-3xl font-bold text-[var(--brand-teal)]">
                      {formatPrice(formData.price - formData.cost)}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Hash className="h-4 w-4" />
                  </span>
                  <span>Inventory Management</span>
                </CardTitle>
                <CardDescription>Track stock levels and alert thresholds.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">Current Stock</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      placeholder="Current stock quantity"
                      value={formData.stockQuantity || ""}
                      onChange={(e) => handleInputChange("stockQuantity", Number.parseInt(e.target.value) || 0)}
                    />
                    {errors.stockQuantity && <p className="text-sm text-red-500">{errors.stockQuantity}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      min="0"
                      placeholder="Alert threshold"
                      value={formData.minStockLevel || ""}
                      onChange={(e) => handleInputChange("minStockLevel", Number.parseInt(e.target.value) || 0)}
                    />
                    {errors.minStockLevel && <p className="text-sm text-red-500">{errors.minStockLevel}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

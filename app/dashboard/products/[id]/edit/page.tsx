"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showError, showSuccess } from "@/lib/alert-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormField, FormTextareaField, FormGrid } from "@/components/ui/form-fields";
import { ArrowLeft, Save, Package, DollarSign, Hash, Calculator } from "lucide-react";
import Link from "next/link";

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  price: number;
  cost: number;
  category: string;
  unit: string;
  stockQuantity: number;
  minStockLevel: number;
  taxSystemId: string;
  isActive: boolean;
}

interface TaxSystem {
  id: string;
  name: string;
  rate: number;
  taxType: string;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxSystems, setTaxSystems] = useState<TaxSystem[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    sku: "",
    price: 0,
    cost: 0,
    category: "",
    unit: "pcs",
    stockQuantity: 0,
    minStockLevel: 0,
    taxSystemId: "",
    isActive: true,
  });
  const productId = params.id as string;

  useEffect(() => {
    if (currentBusiness?.id && productId) {
      fetchProduct();
      fetchTaxSystems();
    }
  }, [currentBusiness?.id, productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}?businessId=${currentBusiness?.id}`);
      if (response.ok) {
        const product = await response.json();
        setFormData({
          name: product.name || "",
          description: product.description || "",
          sku: product.sku || "",
          price: product.price || 0,
          cost: product.cost || 0,
          category: product.category || "",
          unit: product.unit || "pcs",
          stockQuantity: product.stockQuantity || 0,
          minStockLevel: product.minStockLevel || 0,
          taxSystemId: product.taxSystemId || "",
          isActive: product.isActive,
        });
      } else {
        showError("Error", "Failed to fetch product details");
        router.push("/dashboard/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      showError("Error", "Error loading product details");
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxSystems = async () => {
    try {
      const response = await fetch(`/api/tax-systems?businessId=${currentBusiness?.id}`);
      if (response.ok) {
        const data = await response.json();
        setTaxSystems(data);
      }
    } catch (error) {
      console.error("Error fetching tax systems:", error);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    try {
      return (0).toLocaleString('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).replaceAll(/\d/g, '').trim();
    } catch {
      return "$";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentBusiness?.id) {
      showError("No Business", "Please select a business first");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          businessId: currentBusiness.id,
        }),
      });

      if (response.ok) {
        showSuccess("Success", "Product updated successfully");
        router.push("/dashboard/products");
      } else {
        const errorData = await response.json();
        showError("Error", errorData.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      showError("Error", "Error updating product");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof ProductFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const unitOptions = [
    { value: "pcs", label: "Pieces" },
    { value: "kg", label: "Kilograms" },
    { value: "g", label: "Grams" },
    { value: "l", label: "Liters" },
    { value: "ml", label: "Milliliters" },
    { value: "m", label: "Meters" },
    { value: "cm", label: "Centimeters" },
    { value: "sqm", label: "Square Meters" },
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentBusiness) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Business Selected</h3>
            <p className="text-muted-foreground mb-4">
              Please select a business from the top bar or create a new one.
            </p>
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-muted-foreground">
              Update product information and settings
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Essential product details and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="Product Name"
                  id="name"
                  value={formData.name}
                  onChange={(value) => handleFieldChange("name", value)}
                  required
                  placeholder="Enter product name"
                />

                <FormTextareaField
                  label="Description"
                  id="description"
                  value={formData.description}
                  onChange={(value) => handleFieldChange("description", value)}
                  placeholder="Product description..."
                  rows={3}
                />

                <FormGrid columns={2}>
                  <FormField
                    label="SKU"
                    id="sku"
                    value={formData.sku}
                    onChange={(value) => handleFieldChange("sku", value)}
                    placeholder="Product SKU"
                  />
                  <FormField
                    label="Category"
                    id="category"
                    value={formData.category}
                    onChange={(value) => handleFieldChange("category", value)}
                    placeholder="Product category"
                  />
                </FormGrid>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Information
                </CardTitle>
                <CardDescription>
                  Set product pricing and cost details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormGrid columns={2}>
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price <span className="text-destructive ml-1">*</span></Label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex items-center justify-center font-semibold text-sm">
                        {getCurrencySymbol(currentBusiness?.currency || 'USD')}
                      </div>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.price.toString()}
                        onChange={(e) => handleFieldChange("price", Number.parseFloat(e.target.value) || 0)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost Price</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex items-center justify-center font-semibold text-sm">
                        {getCurrencySymbol(currentBusiness?.currency || 'USD')}
                      </div>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.cost.toString()}
                        onChange={(e) => handleFieldChange("cost", Number.parseFloat(e.target.value) || 0)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </FormGrid>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measurement</Label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={(value) => handleFieldChange("unit", value)}
                  >
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
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Inventory Management
                </CardTitle>
                <CardDescription>
                  Stock levels and inventory tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormGrid columns={2}>
                  <FormField
                    label="Stock Quantity"
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity.toString()}
                    onChange={(value) => handleFieldChange("stockQuantity", Number.parseInt(value) || 0)}
                    placeholder="0"
                  />
                  <FormField
                    label="Minimum Stock Level"
                    id="minStockLevel"
                    type="number"
                    value={formData.minStockLevel.toString()}
                    onChange={(value) => handleFieldChange("minStockLevel", Number.parseInt(value) || 0)}
                    placeholder="0"
                  />
                </FormGrid>
              </CardContent>
            </Card>

            {/* Tax & Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Tax & Settings
                </CardTitle>
                <CardDescription>
                  Tax configuration and product status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taxSystemId">Tax System</Label>
                  <Select 
                    value={formData.taxSystemId || "none"} 
                    onValueChange={(value) => handleFieldChange("taxSystemId", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax system (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Tax</SelectItem>
                      {taxSystems.map((tax) => (
                        <SelectItem key={tax.id} value={tax.id}>
                          {tax.name} ({(tax.rate * 100).toFixed(2)}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Active Product</Label>
                    <p className="text-sm text-muted-foreground">
                      Inactive products won't appear in product lists
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked: boolean) => handleFieldChange("isActive", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/products">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
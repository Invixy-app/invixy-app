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
import { ArrowLeft, Save, Package, DollarSign, Hash, Calculator } from "lucide-react";
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
    taxSystemId: "none"
  });

  useEffect(() => {
    if (currentBusiness?.id) {
      setFormData(prev => ({ ...prev, businessId: currentBusiness.id }));
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

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const getCurrencySymbol = (currency: string) => {
    try {
      return (0).toLocaleString('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).replace(/\d/g, '').trim();
    } catch {
      return "$";
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentBusiness?.currency || 'USD'
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
      // Get current business ID
      if (!currentBusiness?.id) {
        showError("No Business", "Please select a business first");
        return;
      }
      const businessId = currentBusiness.id;

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          businessId
        }),
      });

      if (response.ok) {
        showSuccess("Success", "Product created successfully");
        router.push("/dashboard/products");
      } else {
        const errorData = await response.json();
        showError("Error", errorData.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      showError("Error", "Error creating product");
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
    { value: "days", label: "Days" }
  ];

  if (businessLoading) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground">
              Create a new product for your catalog
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Essential product details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Product description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="sku"
                        placeholder="Stock keeping unit"
                        value={formData.sku}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="Product category"
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                    />
                  </div>
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
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Tax */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing & Tax
                </CardTitle>
                <CardDescription>
                  Set pricing and tax information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price *</Label>
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
                        value={formData.price || ""}
                        onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                        className={`pl-10 ${errors.price ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-red-500">{errors.price}</p>
                    )}
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
                        value={formData.cost || ""}
                        onChange={(e) => handleInputChange("cost", Number.parseFloat(e.target.value) || 0)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxSystem">Tax System</Label>
                  <Select value={formData.taxSystemId} onValueChange={(value) => handleInputChange("taxSystemId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax system (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No tax system</SelectItem>
                      {taxSystems.map((tax) => (
                        <SelectItem key={tax.id} value={tax.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{tax.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({(tax.rate * 100).toFixed(2)}%)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.price > 0 && formData.cost && formData.cost > 0 && (
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm font-medium">Profit Margin</div>
                    <div className="text-lg font-bold">
                      {formatPrice(formData.price - formData.cost)}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Inventory Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Inventory Management
              </CardTitle>
              <CardDescription>
                Track stock levels and set alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Current Stock</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    placeholder="Leave empty if not tracking stock"
                    value={formData.stockQuantity || ""}
                    onChange={(e) => handleInputChange("stockQuantity", Number.parseInt(e.target.value) || 0)}
                  />
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/products">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
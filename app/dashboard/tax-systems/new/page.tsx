"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Save, 
  Calculator,
  Percent,
  DollarSign,
  Info,
  CheckCircle,
  Calendar,
  FileText,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const taxSystemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  taxId: z.string().min(1, "Tax ID is required"),
  taxType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "COMPOUND", "INCLUSIVE", "EXCLUSIVE"]),
  rate: z.number().min(0, "Rate must be positive").max(1, "Rate must be less than or equal to 100%"),
  isCompound: z.boolean().default(false),
  validFrom: z.date(),
  validTo: z.date().optional()
});

type TaxSystemFormData = {
  name: string;
  description: string;
  taxId: string;
  taxType: string;
  rate: string;
  isCompound: boolean;
  validFrom: string;
  validTo: string;
};

interface Product {
  id: string;
  name: string;
  category?: string | null;
}

const taxTemplates = {
  gst: {
    name: "GST (Goods and Services Tax)",
    taxId: "GST",
    taxType: "PERCENTAGE",
    rates: [
      { name: "GST 5%", rate: 0.05, description: "Essential goods and services" },
      { name: "GST 12%", rate: 0.12, description: "Standard goods" },
      { name: "GST 18%", rate: 0.18, description: "Most goods and services" },
      { name: "GST 28%", rate: 0.28, description: "Luxury items" }
    ]
  },
  vat: {
    name: "VAT (Value Added Tax)",
    taxId: "VAT",
    taxType: "PERCENTAGE",
    rates: [
      { name: "Standard VAT", rate: 0.20, description: "Standard VAT rate" },
      { name: "Reduced VAT", rate: 0.05, description: "Reduced rate for essentials" },
      { name: "Zero VAT", rate: 0.00, description: "Zero-rated goods" }
    ]
  },
  sales_tax: {
    name: "Sales Tax",
    taxId: "SALES_TAX",
    taxType: "PERCENTAGE",
    rates: [
      { name: "State Sales Tax", rate: 0.0625, description: "State level sales tax" },
      { name: "Local Sales Tax", rate: 0.025, description: "Local municipality tax" }
    ]
  }
};

function NewTaxSystemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    searchParams?.get("template") || null
  );
  const [multipleRates, setMultipleRates] = useState(false);
  
  const [formData, setFormData] = useState<TaxSystemFormData>({
    name: "",
    description: "",
    taxId: "",
    taxType: "PERCENTAGE",
    rate: "",
    isCompound: false,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: "",

  });

  useEffect(() => {

    
    // Apply template if selected
    if (selectedTemplate && taxTemplates[selectedTemplate as keyof typeof taxTemplates]) {
      const template = taxTemplates[selectedTemplate as keyof typeof taxTemplates];
      setFormData(prev => ({
        ...prev,
        name: template.name,
        taxId: template.taxId,
        taxType: template.taxType,
        description: `${template.name} system`
      }));
      
      if (template.rates.length > 1) {
        setMultipleRates(true);
      } else if (template.rates.length === 1) {
        setFormData(prev => ({
          ...prev,
          rate: (template.rates[0].rate * 100).toString()
        }));
      }
    }
  }, [selectedTemplate]);



  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.taxId || !formData.rate) {
      setErrors({
        name: !formData.name ? "Name is required" : "",
        taxId: !formData.taxId ? "Tax ID is required" : "",
        rate: !formData.rate ? "Rate is required" : ""
      });
      return;
    }

    const rateValue = parseFloat(formData.rate);
    if (isNaN(rateValue) || rateValue < 0 || rateValue > 100) {
      setErrors({ rate: "Rate must be between 0 and 100" });
      return;
    }

    setLoading(true);
    try {
      const businessId = localStorage.getItem("selectedBusinessId");
      if (!businessId) {
        alert("Please select a business first");
        return;
      }

      const taxSystemData = {
        businessId,
        name: formData.name,
        description: formData.description || undefined,
        taxId: formData.taxId,
        taxType: formData.taxType,
        rate: rateValue / 100, // Convert percentage to decimal
        isCompound: formData.isCompound,
        validFrom: new Date(formData.validFrom),
        validTo: formData.validTo ? new Date(formData.validTo) : undefined,

      };

      const response = await fetch("/api/tax-systems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taxSystemData),
      });

      if (response.ok) {
        router.push("/dashboard/tax-systems");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to create tax system");
      }
    } catch (error) {
      console.error("Error creating tax system:", error);
      alert("Error creating tax system");
    } finally {
      setLoading(false);
    }
  };

  const createMultipleRates = async () => {
    if (!selectedTemplate || !taxTemplates[selectedTemplate as keyof typeof taxTemplates]) return;
    
    const template = taxTemplates[selectedTemplate as keyof typeof taxTemplates];
    setLoading(true);
    
    try {
      const businessId = localStorage.getItem("selectedBusinessId");
      if (!businessId) {
        alert("Please select a business first");
        return;
      }

      const promises = template.rates.map(rate => 
        fetch("/api/tax-systems", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessId,
            name: rate.name,
            description: rate.description,
            taxId: `${template.taxId}_${(rate.rate * 100).toString().replace('.', '_')}`,
            taxType: template.taxType,
            rate: rate.rate,
            isCompound: false,
            validFrom: new Date(formData.validFrom),
            validTo: formData.validTo ? new Date(formData.validTo) : undefined
          }),
        })
      );

      const results = await Promise.all(promises);
      const failures = results.filter(r => !r.ok);
      
      if (failures.length === 0) {
        router.push("/dashboard/tax-systems");
      } else {
        alert(`Failed to create ${failures.length} tax rates`);
      }
    } catch (error) {
      console.error("Error creating multiple tax rates:", error);
      alert("Error creating tax systems");
    } finally {
      setLoading(false);
    }
  };

  const getTemplateInfo = () => {
    if (!selectedTemplate || !taxTemplates[selectedTemplate as keyof typeof taxTemplates]) return null;
    return taxTemplates[selectedTemplate as keyof typeof taxTemplates];
  };

  const templateInfo = getTemplateInfo();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/tax-systems">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tax Systems
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {templateInfo ? `Setup ${templateInfo.name}` : "Create Tax System"}
            </h1>
            <p className="text-muted-foreground">
              {templateInfo 
                ? `Configure ${templateInfo.name} for your business`
                : "Add a new tax system to your business"
              }
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Info */}
            {templateInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    {templateInfo.name} Template
                  </CardTitle>
                  <CardDescription>
                    Pre-configured settings for {templateInfo.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {templateInfo.rates.length > 1 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This template includes multiple tax rates. You can create all of them at once or customize a single rate.
                      </p>
                      <div className="grid gap-2">
                        {templateInfo.rates.map((rate, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{rate.name}</div>
                              <div className="text-sm text-muted-foreground">{rate.description}</div>
                            </div>
                            <Badge variant="outline">
                              {(rate.rate * 100).toFixed(2)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={createMultipleRates} disabled={loading}>
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Create All Tax Rates
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setMultipleRates(false)}
                          disabled={loading}
                        >
                          Customize Single Rate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Tax Rate:</span>
                        <Badge variant="outline">
                          {templateInfo.rates[0] ? (templateInfo.rates[0].rate * 100).toFixed(2) : 0}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {templateInfo.rates[0]?.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tax System Form */}
            {(!multipleRates || !templateInfo || templateInfo.rates.length === 1) && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Tax System Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g., GST 18%, VAT Standard"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxId">Tax ID *</Label>
                        <Input
                          id="taxId"
                          placeholder="e.g., GST, VAT, SALES_TAX"
                          value={formData.taxId}
                          onChange={(e) => handleInputChange("taxId", e.target.value.toUpperCase())}
                          className={errors.taxId ? "border-red-500" : ""}
                        />
                        {errors.taxId && (
                          <p className="text-sm text-red-500">{errors.taxId}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe when this tax applies..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calculator className="h-5 w-5 mr-2" />
                      Tax Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="taxType">Tax Type</Label>
                        <Select value={formData.taxType} onValueChange={(value) => handleInputChange("taxType", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">
                              <div className="flex items-center">
                                <Percent className="h-4 w-4 mr-2" />
                                Percentage
                              </div>
                            </SelectItem>
                            <SelectItem value="FIXED_AMOUNT">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2" />
                                Fixed Amount
                              </div>
                            </SelectItem>
                            <SelectItem value="COMPOUND">Compound Tax</SelectItem>
                            <SelectItem value="INCLUSIVE">Inclusive Tax</SelectItem>
                            <SelectItem value="EXCLUSIVE">Exclusive Tax</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rate">
                          Tax Rate * {formData.taxType === "PERCENTAGE" ? "(%)" : "(Amount)"}
                        </Label>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max={formData.taxType === "PERCENTAGE" ? "100" : undefined}
                          placeholder={formData.taxType === "PERCENTAGE" ? "18.00" : "5.00"}
                          value={formData.rate}
                          onChange={(e) => handleInputChange("rate", e.target.value)}
                          className={errors.rate ? "border-red-500" : ""}
                        />
                        {errors.rate && (
                          <p className="text-sm text-red-500">{errors.rate}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isCompound"
                        checked={formData.isCompound}
                        onChange={(e) => handleInputChange("isCompound", e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="isCompound" className="flex items-center">
                        Compound Tax
                        <span className="ml-2 text-sm text-muted-foreground">
                          (Tax calculated on tax-inclusive amount)
                        </span>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Validity Period */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Validity Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="validFrom">Valid From *</Label>
                        <Input
                          id="validFrom"
                          type="date"
                          value={formData.validFrom}
                          onChange={(e) => handleInputChange("validFrom", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="validTo">Valid To (Optional)</Label>
                        <Input
                          id="validTo"
                          type="date"
                          value={formData.validTo}
                          onChange={(e) => handleInputChange("validTo", e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>



                {/* Submit Button */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Tax System
                          </>
                        )}
                      </Button>
                      <Link href="/dashboard/tax-systems">
                        <Button variant="outline">Cancel</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            {formData.name && formData.rate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tax System Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">{formData.name}</div>
                      <div className="text-sm text-muted-foreground">{formData.taxId}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <Badge variant="outline">
                        {formData.rate}
                        {formData.taxType === "PERCENTAGE" ? "%" : " units"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="text-sm">{formData.taxType.replace("_", " ")}</span>
                    </div>
                    {formData.isCompound && (
                      <div className="flex justify-between">
                        <span>Compound:</span>
                        <Badge variant="secondary">Yes</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Tax System Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium">Percentage</div>
                    <div className="text-muted-foreground">Tax as percentage of amount</div>
                  </div>
                  <div>
                    <div className="font-medium">Fixed Amount</div>
                    <div className="text-muted-foreground">Fixed tax amount per item</div>
                  </div>
                  <div>
                    <div className="font-medium">Compound</div>
                    <div className="text-muted-foreground">Tax calculated on tax-inclusive amount</div>
                  </div>
                  <div>
                    <div className="font-medium">Inclusive</div>
                    <div className="text-muted-foreground">Tax included in the price</div>
                  </div>
                  <div>
                    <div className="font-medium">Exclusive</div>
                    <div className="text-muted-foreground">Tax added to the price</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewTaxSystemPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewTaxSystemContent />
    </Suspense>
  );
}
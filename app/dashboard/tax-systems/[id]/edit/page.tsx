"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showError } from "@/lib/alert-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar,
  FileText,
  AlertTriangle,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";

interface TaxSystem {
  id: string;
  name: string;
  description?: string | null;
  taxId: string;
  taxType: string;
  rate: number;
  isCompound: boolean;
  isActive: boolean;
  validFrom: Date;
  validTo?: Date | null;
}

interface Product {
  id: string;
  name: string;
  category?: string | null;
}

type TaxSystemFormData = {
  name: string;
  description: string;
  taxId: string;
  taxType: string;
  rate: string;
  isCompound: boolean;
  isActive: boolean;
  validFrom: string;
  validTo: string;
};

export default function EditTaxSystemPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [taxSystem, setTaxSystem] = useState<TaxSystem | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [formData, setFormData] = useState<TaxSystemFormData>({
    name: "",
    description: "",
    taxId: "",
    taxType: "PERCENTAGE",
    rate: "",
    isCompound: false,
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: ""
  });

  useEffect(() => {
    if (params?.id && currentBusiness?.id) {
      fetchTaxSystem();
    } else if (!businessLoading) {
      setLoading(false);
    }
  }, [params?.id, currentBusiness?.id, businessLoading]);

  const fetchTaxSystem = async () => {
    if (!currentBusiness?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/tax-systems/${params?.id}?businessId=${currentBusiness.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setTaxSystem(data);
        setFormData({
          name: data.name,
          description: data.description || "",
          taxId: data.taxId,
          taxType: data.taxType,
          rate: (data.rate * 100).toString(),
          isCompound: data.isCompound,
          isActive: data.isActive,
          validFrom: new Date(data.validFrom).toISOString().split('T')[0],
          validTo: data.validTo ? new Date(data.validTo).toISOString().split('T')[0] : ""
        });
      } else {
        console.error("Failed to fetch tax system");
        router.push("/dashboard/tax-systems");
      }
    } catch (error) {
      console.error("Error fetching tax system:", error);
      router.push("/dashboard/tax-systems");
    } finally {
      setLoading(false);
    }
  };



  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.taxId) newErrors.taxId = "Tax ID is required";
    if (!formData.rate) newErrors.rate = "Rate is required";
    
    const rateValue = parseFloat(formData.rate);
    if (isNaN(rateValue) || rateValue < 0) {
      newErrors.rate = "Rate must be a non-negative number";
    }

    if (!formData.validFrom) newErrors.validFrom = "Valid from date is required";

    if (Object.keys(newErrors).length > 0) {
       setErrors(newErrors);
       return;
    }

    setSaving(true);
    try {
      const taxSystemData = {
        name: formData.name,
        description: formData.description || undefined,
        taxId: formData.taxId,
        taxType: formData.taxType,
        rate: rateValue / 100, // Convert percentage to decimal
        isCompound: formData.isCompound,
        isActive: formData.isActive,
        validFrom: new Date(formData.validFrom),
        validTo: formData.validTo ? new Date(formData.validTo) : undefined
      };

      const response = await fetch(`/api/tax-systems/${params?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taxSystemData),
      });

      if (response.ok) {
        router.push("/dashboard/tax-systems");
      } else {
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error updating tax system:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/tax-systems/${params?.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/tax-systems");
      } else {
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting tax system:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!taxSystem) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold">Tax System not found</h2>
          <p className="text-muted-foreground mt-2">The requested tax system could not be found.</p>
          <Link href="/dashboard/tax-systems">
            <Button className="mt-4">Back to Tax Systems</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/tax-systems">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tax Systems
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Edit Tax System
              </h1>
              <p className="text-muted-foreground">
                Modify {taxSystem.name} settings
              </p>
            </div>
          </div>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Tax System</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{taxSystem.name}"? This action cannot be undone and may affect existing invoices using this tax system.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Tax System
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
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
                      <Label htmlFor="name">Tax System Name <span className="text-red-500">*</span></Label>
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
                      <Label htmlFor="taxId">Tax ID <span className="text-red-500">*</span></Label>
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
                          <SelectItem value="INCLUSIVE">Inclusive Tax</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rate">
                        Tax Rate <span className="text-red-500">*</span> {formData.taxType === "PERCENTAGE" ? "(%)" : "(Amount)"}
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

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isCompound"
                        checked={formData.isCompound}
                        onChange={(e) => handleInputChange("isCompound", e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="isCompound">Compound Tax</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange("isActive", e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
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
                      <Label htmlFor="validFrom">Valid From <span className="text-red-500">*</span></Label>
                      <Input
                        id="validFrom"
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => handleInputChange("validFrom", e.target.value)}
                        className={errors.validFrom ? "border-red-500" : ""}
                      />
                       {errors.validFrom && <p className="text-sm text-red-500">{errors.validFrom}</p>}
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
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Tax System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium">{taxSystem.name}</div>
                    <div className="text-sm text-muted-foreground">{taxSystem.taxId}</div>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <Badge variant="outline">
                      {(taxSystem.rate * 100).toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-sm">{taxSystem.taxType.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={taxSystem.isActive ? "default" : "secondary"}>
                      {taxSystem.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid From:</span>
                    <span className="text-sm">{formatDate(taxSystem.validFrom)}</span>
                  </div>
                  {taxSystem.validTo && (
                    <div className="flex justify-between">
                      <span>Valid To:</span>
                      <span className="text-sm">{formatDate(taxSystem.validTo)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Changes will affect new invoices only</p>
                  <p>• Existing invoices maintain their original tax rates</p>
                  <p>• Deactivating won't delete existing tax records</p>
                  <p>• Consider creating a new tax system for rate changes instead of modifying existing ones</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
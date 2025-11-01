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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormField, FormTextareaField, FormSection, FormGrid } from "@/components/ui/form-fields";
import { ArrowLeft, Save, User, MapPin, Hash } from "lucide-react";
import Link from "next/link";

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
  taxId: string;
  notes: string;
  isActive: boolean;
}

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    billingAddress: "",
    shippingAddress: "",
    taxId: "",
    notes: "",
    isActive: true,
  });
  const customerId = params.id as string;

  useEffect(() => {
    if (currentBusiness?.id && customerId) {
      fetchCustomer();
    }
  }, [currentBusiness?.id, customerId]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}?businessId=${currentBusiness?.id}`);
      if (response.ok) {
        const customer = await response.json();
        setFormData({
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          billingAddress: customer.billingAddress || "",
          shippingAddress: customer.shippingAddress || "",
          taxId: customer.taxId || "",
          notes: customer.notes || "",
          isActive: customer.isActive,
        });
      } else {
        showError("Error", "Failed to fetch customer details");
        router.push("/dashboard/customers");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      showError("Error", "Error loading customer details");
    } finally {
      setLoading(false);
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
      const response = await fetch(`/api/customers/${customerId}`, {
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
        showSuccess("Success", "Customer updated successfully");
        router.push(`/dashboard/customers/${customerId}`);
      } else {
        const errorData = await response.json();
        showError("Error", errorData.error || "Failed to update customer");
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      showError("Error", "Error updating customer");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof CustomerFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const copyBillingToShipping = () => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: prev.billingAddress,
    }));
  };

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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/customers/${customerId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
            <p className="text-muted-foreground">
              Update customer information and settings
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Essential customer details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Customer Name"
                id="name"
                value={formData.name}
                onChange={(value) => handleFieldChange("name", value)}
                required
                placeholder="Enter customer name"
              />

              <FormGrid columns={2}>
                <FormField
                  label="Email Address"
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleFieldChange("email", value)}
                  placeholder="customer@example.com"
                />
                <FormField
                  label="Phone Number"
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(value) => handleFieldChange("phone", value)}
                  placeholder="+1 (555) 123-4567"
                />
              </FormGrid>

              <FormField
                label="Tax ID"
                id="taxId"
                value={formData.taxId}
                onChange={(value) => handleFieldChange("taxId", value)}
                placeholder="Tax identification number"
              />
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
              <CardDescription>
                Billing and shipping addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormTextareaField
                label="Billing Address"
                id="billingAddress"
                value={formData.billingAddress}
                onChange={(value) => handleFieldChange("billingAddress", value)}
                placeholder="Enter billing address..."
                rows={3}
              />

              <div className="flex items-center justify-between">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyBillingToShipping}
                >
                  Copy from Billing
                </Button>
              </div>
              <Textarea
                id="shippingAddress"
                value={formData.shippingAddress}
                onChange={(e) => handleFieldChange("shippingAddress", e.target.value)}
                placeholder="Enter shipping address..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Notes and settings for this customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormTextareaField
                label="Notes"
                id="notes"
                value={formData.notes}
                onChange={(value) => handleFieldChange("notes", value)}
                placeholder="Add any notes about this customer..."
                rows={4}
              />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Active Customer</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive customers won't appear in customer lists
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

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/dashboard/customers/${customerId}`}>Cancel</Link>
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
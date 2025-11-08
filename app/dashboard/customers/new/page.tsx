"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, User, Mail, Phone, MapPin, FileText } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional()
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    billingAddress: "",
    shippingAddress: "",
    taxId: "",
    notes: ""
  });

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const copyBillingToShipping = () => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: prev.billingAddress
    }));
  };

  const validateForm = (): boolean => {
    try {
      customerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
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
      // Get selected business ID
      const businessId = localStorage.getItem("selectedBusinessId");
      if (!businessId) {
        alert("Please select a business first");
        return;
      }

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          businessId,
          email: formData.email || null
        }),
      });

      if (response.ok) {
        router.push("/dashboard/customers");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Error creating customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Customer</h1>
            <p className="text-muted-foreground">
              Create a new customer profile for your business
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Essential customer details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter customer name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="customer@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="taxId"
                      placeholder="Tax identification number"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange("taxId", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Address Information
                </CardTitle>
                <CardDescription>
                  Billing and shipping addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Textarea
                    id="billingAddress"
                    placeholder="Enter complete billing address"
                    value={formData.billingAddress}
                    onChange={(e) => handleInputChange("billingAddress", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Separator className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyBillingToShipping}
                    disabled={!formData.billingAddress}
                  >
                    Copy to Shipping
                  </Button>
                  <Separator className="flex-1" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Textarea
                    id="shippingAddress"
                    placeholder="Enter shipping address (if different from billing)"
                    value={formData.shippingAddress}
                    onChange={(e) => handleInputChange("shippingAddress", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Any additional information about this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter any notes or special instructions for this customer..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/customers">
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
                  Create Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
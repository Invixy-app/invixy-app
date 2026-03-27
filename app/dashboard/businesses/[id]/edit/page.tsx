"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  Building2,
  Save,
  ArrowLeft,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import { showError, showSuccess, showConfirm } from "@/lib/alert-store";

interface BusinessFormData {
  name: string;
  description: string;
  type: string;
  industry: string;
  registrationNumber: string;
  taxId: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const BUSINESS_TYPES = [
  "Corporation",
  "LLC",
  "Partnership", 
  "Sole Proprietorship",
  "Non-Profit",
  "Other"
];

const INDUSTRIES = [
  "Technology",
  "Healthcare", 
  "Finance",
  "Retail",
  "Manufacturing",
  "Construction",
  "Education",
  "Consulting",
  "Real Estate",
  "Food & Beverage",
  "Transportation",
  "Entertainment",
  "Other"
];

export default function EditBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;
  
  const [business, setBusiness] = useState<any>(null);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: "",
    description: "",
    type: "",
    industry: "",
    registrationNumber: "",
    taxId: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (businessId) {
      fetchBusiness();
    }
  }, [businessId]);

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/business/${businessId}`);
      if (response.ok) {
        const data = await response.json();
        const businessData = data.business;
        setBusiness(businessData);
        
        // Populate form with existing data
        setFormData({
          name: businessData.name || "",
          description: businessData.description || "",
          type: businessData.type || "",
          industry: businessData.industry || "",
          registrationNumber: businessData.registrationNumber || "",
          taxId: businessData.taxId || "",
          phone: businessData.phone || "",
          email: businessData.email || "",
          website: businessData.website || "",
          address: businessData.address || "",
          city: businessData.city || "",
          state: businessData.state || "",
          zipCode: businessData.zipCode || "",
          country: businessData.country || "United States"
        });
      } else {
        showError("Error", "Something went wrong. Please try again.");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch business:", error);
      showError("Error", "Something went wrong. Please try again.");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Business name is required";
    }
    if (!formData.type) {
      newErrors.type = "Business type is required";
    }
    if (formData.email && !formData.email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }
    if (formData.website && !formData.website.startsWith("http")) {
      newErrors.website = "Website URL should start with http:// or https://";
    }
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = "Phone number should be at least 10 digits";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      showError("Validation Error", "Please check the form for errors");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/business/${businessId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSuccess("Success", "Business updated successfully");
        setHasChanges(false);
        router.push(`/dashboard`);
      } else {
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update business:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      showConfirm(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to leave without saving?",
        () => router.push(`/dashboard`),
        {
          confirmText: "Leave",
          cancelText: "Stay"
        }
      );
    } else {
      router.push(`/dashboard`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
            <h3 className="mt-4 text-lg font-semibold">Business Not Found</h3>
            <p className="mt-2 text-muted-foreground">
              The business you're trying to edit doesn't exist or you don't have permission to edit it.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/dashboard/businesses">
                  Back to Businesses
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user has permission to edit
  if (business.role !== 'OWNER' && business.role !== 'ACCOUNTANT') {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-16 w-16 text-[var(--brand-cobalt)]" />
            <h3 className="mt-4 text-lg font-semibold">Insufficient Permissions</h3>
            <p className="mt-2 text-muted-foreground">
              You don't have permission to edit this business. Only owners and accountants can make changes.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Business</h1>
              <p className="text-muted-foreground">
                Update your business information and settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={business.role === 'OWNER' ? 'default' : 'secondary'}>
              {business.role.toLowerCase()}
            </Badge>
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              className="min-w-[100px]"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-[var(--brand-cobalt)]/25 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business Name</CardTitle>
              <Building2 className="h-4 w-4 text-[var(--brand-cobalt)]" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formData.name ? "Set" : "Required"}</div></CardContent>
          </Card>
          <Card className="border-[var(--brand-teal)]/25 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contact</CardTitle>
              <Phone className="h-4 w-4 text-[var(--brand-teal)]" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formData.email ? "Set" : "Pending"}</div></CardContent>
          </Card>
          <Card className="border-[var(--brand-indigo)]/25 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Role</CardTitle>
              <Badge variant={business.role === 'OWNER' ? 'default' : 'secondary'}>{business.role.toLowerCase()}</Badge>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">Access</div></CardContent>
          </Card>
        </div>

        {hasChanges && (
          <div className="bg-[var(--brand-cobalt)]/10 border border-[var(--brand-cobalt)]/25 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[var(--brand-cobalt)]" />
              <span className="text-sm font-medium text-[var(--brand-cobalt)]">
                You have unsaved changes
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="shadow-sm border-border/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Essential details about your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter business name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your business"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Business Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    placeholder="Business registration number"
                  />
                </div>

                <div>
                  <Label htmlFor="taxId">Tax ID / EIN</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    placeholder="Tax identification number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-sm border-border/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                How customers can reach your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@business.com"
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                  />
                </div>
                 {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.business.com"
                    className={`pl-10 ${errors.website ? "border-red-500" : ""}`}
                  />
                </div>
                 {errors.website && <p className="text-sm text-red-500 mt-1">{errors.website}</p>}
              </div>

              <Separator />

              <div>
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street address"
                    className="pl-10"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="12345"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            className="min-w-[120px]"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import {
  Settings,
  ArrowLeft,
  AlertTriangle,
  Users,
  UserPlus,
  Save,
  Trash2,
  Shield,
  Globe,
  Bell,
  CreditCard,
  Archive,
} from "lucide-react";
import { showError, showSuccess, showConfirm } from "@/lib/alert-store";

interface BusinessSettings {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  role: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

const CURRENCIES = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
];

export default function BusinessSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;
  const { data: session } = useSession();
  
  const [business, setBusiness] = useState<BusinessSettings | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");

  useEffect(() => {
    if (businessId) {
      fetchBusinessSettings();
    }
  }, [businessId]);

  const fetchBusinessSettings = async () => {
    try {
      const response = await fetch(`/api/business/${businessId}`);
      if (response.ok) {
        const data = await response.json();
        const businessData = data.business;
        setBusiness({
          id: businessData.id,
          name: businessData.name,
          currency: businessData.currency || "USD",
          timezone: businessData.timezone || "UTC",
          isActive: businessData.status === 'active',
          role: businessData.role
        });
        setTeamMembers(businessData.users || []);
      } else {
        showError("Error", "Failed to load business settings");
        router.push("/dashboard/businesses");
      }
    } catch (error) {
      console.error("Failed to fetch business settings:", error);
      showError("Error", "Failed to load business settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (updates: Partial<BusinessSettings>) => {
    if (!business) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/business/${businessId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setBusiness(prev => prev ? { ...prev, ...updates } : null);
        showSuccess("Success", "Settings updated successfully");
      } else {
        const error = await response.json();
        showError("Error", error.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      showError("Error", "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      showError("Validation Error", "Email address is required");
      return;
    }

    if (!inviteEmail.includes("@")) {
      showError("Validation Error", "Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch(`/api/business/${businessId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        }),
      });

      if (response.ok) {
        showSuccess("Success", "Invitation sent successfully");
        setInviteEmail("");
        setInviteRole("EMPLOYEE");
        // Refresh team members
        fetchBusinessSettings();
      } else {
        const error = await response.json();
        showError("Error", error.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Failed to invite user:", error);
      showError("Error", "Failed to send invitation");
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    showConfirm(
      "Remove Team Member",
      `Are you sure you want to remove ${userName} from this business? They will lose access to all business data.`,
      async () => {
        try {
          const response = await fetch(`/api/business/${businessId}/users/${userId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            showSuccess("Success", "User removed successfully");
            fetchBusinessSettings(); // Refresh team members
          } else {
            const error = await response.json();
            showError("Error", error.message || "Failed to remove user");
          }
        } catch (error) {
          console.error("Failed to remove user:", error);
          showError("Error", "Failed to remove user");
        }
      },
      {
        confirmText: "Remove",
        cancelText: "Cancel"
      }
    );
  };

  const handleDeleteBusiness = async () => {
    showConfirm(
      "Delete Business",
      "Are you sure you want to delete this business? This action cannot be undone and all data will be permanently lost.",
      async () => {
        try {
          const response = await fetch(`/api/business/${businessId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            showSuccess("Success", "Business deleted successfully");
            router.push("/dashboard/businesses");
          } else {
            const error = await response.json();
            showError("Error", error.message || "Failed to delete business");
          }
        } catch (error) {
          console.error("Failed to delete business:", error);
          showError("Error", "Failed to delete business");
        }
      },
      {
        confirmText: "Delete Forever",
        cancelText: "Cancel"
      }
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
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
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
            <h3 className="mt-4 text-lg font-semibold">Business Not Found</h3>
            <p className="mt-2 text-muted-foreground">
              The business you're trying to access doesn't exist or you don't have permission.
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

  // Check if user has permission to access settings
  if (business.role !== 'OWNER') {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <Shield className="mx-auto h-16 w-16 text-orange-500" />
            <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
            <p className="mt-2 text-muted-foreground">
              Only business owners can access settings. Your current role is: {business.role.toLowerCase()}.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href={`/dashboard/businesses/${businessId}`}>
                  Back to Business
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/businesses/${businessId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Business Settings</h1>
              <p className="text-muted-foreground">
                Manage {business.name} settings and team access
              </p>
            </div>
          </div>
          <Badge variant="default">Owner</Badge>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Basic Settings
                  </CardTitle>
                  <CardDescription>
                    Configure basic business settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Business Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Active businesses can create invoices and manage customers
                      </p>
                    </div>
                    <Switch
                      checked={business.isActive}
                      onCheckedChange={(checked) => 
                        handleSettingsUpdate({ isActive: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Localization
                  </CardTitle>
                  <CardDescription>
                    Set your business currency and timezone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={business.currency}
                      onValueChange={(value) => 
                        handleSettingsUpdate({ currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={business.timezone}
                      onValueChange={(value) => 
                        handleSettingsUpdate({ timezone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((timezone) => (
                          <SelectItem key={timezone.value} value={timezone.value}>
                            {timezone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Invite Team Member
                  </CardTitle>
                  <CardDescription>
                    Send an invitation to add a new team member
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="invite-role">Role</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={setInviteRole}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                        <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleInviteUser} className="w-full">
                    Send Invitation
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Manage existing team members and their permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            {member.role.toLowerCase()}
                          </Badge>
                          {member.role !== 'OWNER' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveUser(member.id, member.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {teamMembers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="mx-auto h-12 w-12 mb-4" />
                        <p>No team members yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Configure how you want to be notified about business activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about invoices and payments
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send automatic payment reminders to customers
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that will affect your business permanently
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="font-medium text-red-600 mb-2">Archive Business</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Archive this business to make it inactive. You can reactivate it later, but it won't be accessible to team members.
                  </p>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Business
                  </Button>
                </div>

                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="font-medium text-red-600 mb-2">Delete Business</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete this business and all associated data including customers, products, invoices, and payments. This action cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteBusiness}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Business Forever
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
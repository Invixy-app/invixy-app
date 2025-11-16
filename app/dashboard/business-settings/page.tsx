"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Building2,
  Save,
  Settings as SettingsIcon,
  Calculator,
  Users,
  FileText,
  Bell,
  Trash2,
  AlertTriangle,
  Edit,
  Mail,
  UserPlus
} from "lucide-react";
import { useAlert } from "@/lib/alert-store";
import { useBusinessContext } from "@/components/business-context";

interface BusinessSettings {
  autoNumberInvoices: boolean;
  invoicePrefix: string;
  emailNotifications: boolean;
  paymentReminders: boolean;
  reminderDaysBefore: number;
  defaultPaymentTerms: number;
  taxInclusive: boolean;
  currency: string;
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
}

export default function BusinessSettingsPage() {
  const router = useRouter();
  const { addAlert } = useAlert();
  const { currentBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Team management state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("EMPLOYEE");

  const [settings, setSettings] = useState<BusinessSettings>({
    autoNumberInvoices: true,
    invoicePrefix: "INV",
    emailNotifications: true,
    paymentReminders: false,
    reminderDaysBefore: 3,
    defaultPaymentTerms: 30,
    taxInclusive: false,
    currency: "USD"
  });

  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    website: "",
    description: ""
  });

  useEffect(() => {
    if (currentBusiness) {
      fetchBusinessSettings();
      setBusinessInfo({
        name: currentBusiness.name || "",
        email: currentBusiness.email || "",
        phone: currentBusiness.phone || "",
        address: currentBusiness.billingAddress || "",
        taxId: currentBusiness.taxRegistrationNumber || "",
        website: currentBusiness.website || "",
        description: currentBusiness.description || ""
      });
    }
  }, [currentBusiness]);

  const fetchBusinessSettings = async () => {
    if (!currentBusiness) return;

    try {
      const response = await fetch(`/api/business/${currentBusiness.id}/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
    }
  };

  const updateBusinessInfo = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/business/${currentBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessInfo)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update business');
      }

      addAlert({
        type: 'success',
        title: 'Business Updated',
        message: 'Business information has been updated successfully'
      });

    } catch (error: any) {
      addAlert({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update business'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/business/${currentBusiness.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }

      addAlert({
        type: 'success',
        title: 'Settings Updated',
        message: 'Your business settings have been updated'
      });

    } catch (error: any) {
      addAlert({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBusiness = async () => {
    if (!currentBusiness) return;

    try {
      const response = await fetch(`/api/business/${currentBusiness.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete business');
      }

      addAlert({
        type: 'success',
        title: 'Business Deleted',
        message: 'Your business has been deleted successfully'
      });

      // Refresh businesses and redirect to dashboard
      router.push('/dashboard');
      router.refresh();

    } catch (error: any) {
      addAlert({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete business'
      });
    }
  };

  // Team management functions
  const fetchTeamMembers = async () => {
    if (!currentBusiness) return;

    setLoadingTeam(true);
    try {
      const response = await fetch(`/api/business/${currentBusiness.id}/users`);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoadingTeam(false);
    }
  };

  const addTeamMember = async () => {
    if (!currentBusiness || !newMemberEmail) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/business/${currentBusiness.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add team member');
      }

      addAlert({
        type: 'success',
        title: 'Team Member Added',
        message: 'Team member has been added successfully'
      });

      setNewMemberEmail("");
      setNewMemberRole("EMPLOYEE");
      setShowAddMemberDialog(false);
      fetchTeamMembers();

    } catch (error: any) {
      addAlert({
        type: 'error',
        title: 'Failed to Add Member',
        message: error.message || 'Failed to add team member'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTeamMemberRole = async () => {
    if (!currentBusiness || !selectedMember) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/business/${currentBusiness.id}/users/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newMemberRole
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }

      addAlert({
        type: 'success',
        title: 'Role Updated',
        message: 'Team member role has been updated'
      });

      setShowEditMemberDialog(false);
      setSelectedMember(null);
      fetchTeamMembers();

    } catch (error: any) {
      addAlert({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update role'
      });
    } finally {
      setLoading(false);
    }
  };

  const removeTeamMember = async (memberId: string) => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/business/${currentBusiness.id}/users/${memberId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove team member');
      }

      addAlert({
        type: 'success',
        title: 'Member Removed',
        message: 'Team member has been removed'
      });

      fetchTeamMembers();

    } catch (error: any) {
      addAlert({
        type: 'error',
        title: 'Remove Failed',
        message: error.message || 'Failed to remove team member'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'MANAGER':
        return 'secondary';
      case 'ACCOUNTANT':
        return 'outline';
      case 'EMPLOYEE':
        return 'outline';
      case 'VIEWER':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Fetch team members when team tab is active
  useEffect(() => {
    if (activeTab === 'team' && currentBusiness) {
      fetchTeamMembers();
    }
  }, [activeTab, currentBusiness]);

  if (!currentBusiness) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-6 h-6 mr-2" />
                No Business Selected
              </CardTitle>
              <CardDescription>
                Please select a business from the top navigation to manage settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/businesses/new">
                <Button>
                  <Building2 className="w-4 h-4 mr-2" />
                  Create New Business
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <SettingsIcon className="w-6 h-6 mr-2" />
            Business Settings
          </h1>
          <p className="text-muted-foreground">
            Manage settings for {currentBusiness.name}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Update your business details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={businessInfo.name}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter business name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Email Address</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={businessInfo.email}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="business@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Phone Number</Label>
                    <Input
                      id="businessPhone"
                      type="tel"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessWebsite">Website</Label>
                    <Input
                      id="businessWebsite"
                      type="url"
                      value={businessInfo.website}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Textarea
                    id="businessAddress"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter your business address"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / Registration Number</Label>
                    <Input
                      id="taxId"
                      value={businessInfo.taxId}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, taxId: e.target.value }))}
                      placeholder="Tax ID"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select 
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={businessInfo.description}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your business"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={updateBusinessInfo} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoicing Tab */}
          <TabsContent value="invoicing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Invoice Settings
                </CardTitle>
                <CardDescription>
                  Configure default settings for invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Auto-number Invoices</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate sequential invoice numbers
                    </p>
                  </div>
                  <Switch 
                    checked={settings.autoNumberInvoices}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoNumberInvoices: checked }))}
                  />
                </div>

                {settings.autoNumberInvoices && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                    <Input
                      id="invoicePrefix"
                      value={settings.invoicePrefix}
                      onChange={(e) => setSettings(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                      placeholder="INV"
                      className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: {settings.invoicePrefix}-001, {settings.invoicePrefix}-002
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Default Payment Terms (Days)</Label>
                  <Input
                    id="paymentTerms"
                    type="number"
                    value={settings.defaultPaymentTerms}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultPaymentTerms: Number.parseInt(e.target.value) || 30 }))}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Default number of days for payment due date
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Tax Inclusive Pricing</Label>
                    <p className="text-sm text-muted-foreground">
                      Product prices include tax by default
                    </p>
                  </div>
                  <Switch 
                    checked={settings.taxInclusive}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, taxInclusive: checked }))}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Tax Configuration</h4>
                  <Link href="/dashboard/tax-systems">
                    <Button variant="outline" className="w-full justify-start">
                      <Calculator className="w-4 h-4 mr-2" />
                      Manage Tax Systems
                    </Button>
                  </Link>
                </div>

                <div className="flex justify-end">
                  <Button onClick={updateSettings} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications & Reminders
                </CardTitle>
                <CardDescription>
                  Configure email notifications and payment reminders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email when invoice status changes
                    </p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically remind customers of due invoices
                    </p>
                  </div>
                  <Switch 
                    checked={settings.paymentReminders}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, paymentReminders: checked }))}
                  />
                </div>

                {settings.paymentReminders && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="reminderDays">Send Reminder (Days Before Due)</Label>
                    <Input
                      id="reminderDays"
                      type="number"
                      value={settings.reminderDaysBefore}
                      onChange={(e) => setSettings(prev => ({ ...prev, reminderDaysBefore: Number.parseInt(e.target.value) || 3 }))}
                      className="max-w-xs"
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={updateSettings} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Team Management
                  </CardTitle>
                  <CardDescription>
                    Manage users and their roles for this business
                  </CardDescription>
                </div>
                <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                      <DialogDescription>
                        Invite a user to this business by their email address
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="memberEmail">Email Address</Label>
                        <Input
                          id="memberEmail"
                          type="email"
                          placeholder="user@example.com"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="memberRole">Role</Label>
                        <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                          <SelectTrigger id="memberRole">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EMPLOYEE">Employee</SelectItem>
                            <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Defines the permissions and access level for this user
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addTeamMember} disabled={loading || !newMemberEmail}>
                        {loading ? 'Adding...' : 'Add Member'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingTeam ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading team members...</p>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add team members to collaborate on this business
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Added</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {member.user.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                {member.user.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(member.role)}>
                                {member.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(member.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {member.role !== 'OWNER' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setNewMemberRole(member.role);
                                        setShowEditMemberDialog(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will remove {member.user.name || member.user.email} from this business.
                                            They will lose all access immediately.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => removeTeamMember(member.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Remove
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                                {member.role === 'OWNER' && (
                                  <Badge variant="outline" className="text-xs">Owner</Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Role descriptions */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">Role Permissions</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Owner:</strong> Full access to all features and settings. Cannot be removed.
                    </div>
                    <div>
                      <strong>Manager:</strong> Can manage invoices, customers, products, and view reports.
                    </div>
                    <div>
                      <strong>Accountant:</strong> Can create and manage invoices, view financial reports.
                    </div>
                    <div>
                      <strong>Employee:</strong> Can create invoices and manage customers.
                    </div>
                    <div>
                      <strong>Viewer:</strong> Read-only access to invoices and reports.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Member Dialog */}
            <Dialog open={showEditMemberDialog} onOpenChange={setShowEditMemberDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Team Member Role</DialogTitle>
                  <DialogDescription>
                    Change the role for {selectedMember?.user.name || selectedMember?.user.email}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editMemberRole">Role</Label>
                    <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                      <SelectTrigger id="editMemberRole">
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditMemberDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateTeamMemberRole} disabled={loading}>
                    {loading ? 'Updating...' : 'Update Role'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that affect your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-2">Delete Business</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your business, there is no going back. This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                    <li>All invoices and customer data</li>
                    <li>All products and tax systems</li>
                    <li>All payment records</li>
                    <li>All team member access</li>
                  </ul>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Business
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the business{" "}
                          <strong>{currentBusiness.name}</strong> and remove all associated data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteBusiness}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, delete this business
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users,
  Trash2,
  AlertTriangle,
  Edit,
  Mail,
  UserPlus
} from "lucide-react";
import { useAlert } from "@/lib/alert-store";
import { useBusinessContext } from "@/components/business-context";
import { businessSchema } from "@/lib/validations/business";
import { z } from "zod";

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
  const { currentBusiness, refreshBusinesses } = useBusinessContext();
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

  const roleDescriptions = {
    OWNER: "Full administrative access. Can manage team members, business settings, and all data.",
    ACCOUNTANT: "Financial management. Can create, edit, and delete invoices. Can manage tax systems and view all reports.",
    MANAGER: "Operations management. Can create and edit invoices. Can manage products and customers.",
    EMPLOYEE: "Standard operations. Can create invoices. Can manage products and customers.",
    VIEWER: "Read-only access. Can view invoices and reports but cannot make any changes."
  };

  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    website: "",
    description: "",
    currency: "USD"
  });

  useEffect(() => {
    if (currentBusiness) {
      setBusinessInfo({
        name: currentBusiness.name || "",
        email: currentBusiness.email || "",
        phone: currentBusiness.phone || "",
        address: currentBusiness.billingAddress || "",
        taxId: currentBusiness.taxRegistrationNumber || "",
        website: currentBusiness.website || "",
        description: currentBusiness.description || "",
        currency: currentBusiness.currency || "USD"
      });
    }
  }, [currentBusiness]);

  const updateBusinessInfo = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      // Map frontend state to backend schema
      const payload = {
        name: businessInfo.name,
        email: businessInfo.email,
        phone: businessInfo.phone,
        billingAddress: businessInfo.address,
        shippingAddress: businessInfo.address, // Using same address for now
        taxRegistrationNumber: businessInfo.taxId,
        website: businessInfo.website,
        description: businessInfo.description,
        currency: businessInfo.currency
      };

      // Validate payload
      const validatedData = businessSchema.partial().parse(payload);

      const response = await fetch(`/api/business/${currentBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
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

      refreshBusinesses();

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        addAlert({
          type: 'error',
          title: 'Validation Failed',
          message: error.message
        });
      } else {
        addAlert({
          type: 'error',
          title: 'Update Failed',
          message: error.message || 'Failed to update business'
        });
      }
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
      <div className="max-w-4xl mx-auto space-y-6">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
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
                      value={businessInfo.currency}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, currency: e.target.value }))}
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
                          {roleDescriptions[newMemberRole as keyof typeof roleDescriptions]}
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
                {loadingTeam && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading team members...</p>
                  </div>
                )}
                
                {!loadingTeam && teamMembers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add team members to collaborate on this business
                    </p>
                  </div>
                )}

                {!loadingTeam && teamMembers.length > 0 && (
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
                              {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
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
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold">Owner</div>
                      <div className="text-muted-foreground">{roleDescriptions.OWNER}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Manager</div>
                      <div className="text-muted-foreground">{roleDescriptions.MANAGER}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Accountant</div>
                      <div className="text-muted-foreground">{roleDescriptions.ACCOUNTANT}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Employee</div>
                      <div className="text-muted-foreground">{roleDescriptions.EMPLOYEE}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Viewer</div>
                      <div className="text-muted-foreground">{roleDescriptions.VIEWER}</div>
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
                    <p className="text-xs text-muted-foreground mt-2">
                      {roleDescriptions[newMemberRole as keyof typeof roleDescriptions]}
                    </p>
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

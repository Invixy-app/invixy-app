"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  User, 
  Lock, 
  Bell, 
  Trash2, 
  Save,
  Mail,
  Phone,
  MapPin,
  Shield,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import { useAlert } from "@/lib/alert-store";

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  language?: string;
  emailVerified?: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  invoiceReminders: boolean;
  paymentNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserSettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { addAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    timezone: 'UTC',
    language: 'en'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    invoiceReminders: true,
    paymentNotifications: true,
    marketingEmails: false,
    securityAlerts: true
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (session?.user) {
      setProfile({
        id: session.user.id || '',
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || '',
        phone: '',
        address: '',
        timezone: 'UTC',
        language: 'en',
        emailVerified: !!session.user.email
      });
      fetchUserSettings();
    }
  }, [session]);

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile(prev => ({ ...prev, ...data.profile }));
        }
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
          timezone: profile.timezone,
          language: profile.language
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      // Update session
      await update({
        name: profile.name,
      });

      addAlert({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully'
      });

    } catch (error: any) {
      addAlert({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update notifications');
      }

      addAlert({
        type: 'success',
        title: 'Notifications Updated',
        message: 'Your notification preferences have been updated'
      });

    } catch (error: any) {
      addAlert({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update notifications'
      });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addAlert({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New password and confirmation do not match'
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      addAlert({
        type: 'error',
        title: 'Weak Password',
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      addAlert({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been changed successfully'
      });

    } catch (error: any) {
      addAlert({
        type: 'error',
        title: 'Password Change Failed',
        message: error.message || 'Failed to change password'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }

      addAlert({
        type: 'success',
        title: 'Account Deleted',
        message: 'Your account has been deleted successfully'
      });

      // Redirect to home page
      router.push('/');

    } catch (error: any) {
      addAlert({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete account'
      });
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="email"
                        type="email"
                        value={profile.email || ''}
                        disabled
                        className="flex-1"
                      />
                      {profile.emailVerified && (
                        <Shield className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email address cannot be changed. Contact support if needed.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select 
                      id="timezone"
                      value={profile.timezone || 'UTC'}
                      onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Shanghai">Shanghai</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={profile.address || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={updateProfile} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Password requirements:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>At least 8 characters long</li>
                    <li>Include uppercase and lowercase letters</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={changePassword} 
                    disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive general email notifications
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="invoice-reminders">Invoice Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about pending invoices
                      </p>
                    </div>
                    <Switch
                      id="invoice-reminders"
                      checked={notifications.invoiceReminders}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, invoiceReminders: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="payment-notifications">Payment Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when payments are received
                      </p>
                    </div>
                    <Switch
                      id="payment-notifications"
                      checked={notifications.paymentNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, paymentNotifications: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="security-alerts">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Important security and account notifications
                      </p>
                    </div>
                    <Switch
                      id="security-alerts"
                      checked={notifications.securityAlerts}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, securityAlerts: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing-emails">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive product updates and marketing content
                      </p>
                    </div>
                    <Switch
                      id="marketing-emails"
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketingEmails: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={updateNotifications} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Account Management
                </CardTitle>
                <CardDescription>
                  Manage your account settings and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            account and remove all your data from our servers including:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>All your businesses and associated data</li>
                              <li>All invoices, customers, and products</li>
                              <li>All payment records</li>
                              <li>All user preferences and settings</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={deleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
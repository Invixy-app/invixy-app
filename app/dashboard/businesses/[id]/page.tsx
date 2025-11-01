"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Package,
  FileText,
  DollarSign,
  Edit,
  Settings,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  UserPlus,
} from "lucide-react";
import { showError } from "@/lib/alert-store";

interface BusinessDetail {
  id: string;
  name: string;
  description?: string;
  type: string;
  industry?: string;
  registrationNumber?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customerCount: number;
  productCount: number;
  invoiceCount: number;
  totalRevenue: number;
  pendingAmount: number;
  monthlyRevenue: number;
  users?: {
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
  }[];
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  user?: string;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const businessId = params.id as string;
  const { data: session } = useSession();
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      fetchBusinessDetail();
    }
  }, [businessId]);

  const fetchBusinessDetail = async () => {
    try {
      const response = await fetch(`/api/business/${businessId}`);
      if (response.ok) {
        const data = await response.json();
        setBusiness(data.business);
        setRecentActivity(data.recentActivity || []);
      } else {
        showError("Error", "Failed to load business details");
      }
    } catch (error) {
      console.error("Failed to fetch business:", error);
      showError("Error", "Failed to load business details");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'text-blue-600 bg-blue-50';
      case 'ACCOUNTANT': return 'text-purple-600 bg-purple-50';
      case 'EMPLOYEE': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
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
            <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
            <h3 className="mt-4 text-lg font-semibold">Business Not Found</h3>
            <p className="mt-2 text-muted-foreground">
              The business you're looking for doesn't exist or you don't have access to it.
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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{business.name}</h1>
              <Badge className={getStatusColor(business.status)}>
                {business.status}
              </Badge>
              <Badge className={getRoleColor(business.role)}>
                {business.role.toLowerCase()}
              </Badge>
            </div>
            {business.description && (
              <p className="text-muted-foreground">{business.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {formatDate(business.createdAt)}
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {business.type}
              </div>
              {business.industry && (
                <div>• {business.industry}</div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/businesses/${business.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            {business.role === 'OWNER' && (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/businesses/${business.id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(business.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                All time revenue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(business.monthlyRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(business.pendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {business.invoiceCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Total invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="mt-1">{business.type}</p>
                    </div>
                    {business.industry && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Industry</label>
                        <p className="mt-1">{business.industry}</p>
                      </div>
                    )}
                  </div>
                  
                  {business.registrationNumber && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                      <p className="mt-1">{business.registrationNumber}</p>
                    </div>
                  )}
                  
                  {business.taxId && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tax ID</label>
                      <p className="mt-1">{business.taxId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {business.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{business.phone}</span>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{business.email}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={business.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        {business.website}
                      </a>
                    </div>
                  )}
                  {business.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{business.address}</p>
                        {(business.city || business.state || business.zipCode) && (
                          <p className="text-muted-foreground">
                            {[business.city, business.state, business.zipCode].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {business.country && (
                          <p className="text-muted-foreground">{business.country}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <Users className="h-8 w-8 mx-auto text-blue-600" />
                  <CardTitle className="text-2xl">{business.customerCount}</CardTitle>
                  <CardDescription>Customers</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/customers">View All</Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="text-center">
                  <Package className="h-8 w-8 mx-auto text-green-600" />
                  <CardTitle className="text-2xl">{business.productCount}</CardTitle>
                  <CardDescription>Products</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/products">View All</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <FileText className="h-8 w-8 mx-auto text-purple-600" />
                  <CardTitle className="text-2xl">{business.invoiceCount}</CardTitle>
                  <CardDescription>Invoices</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/invoices">View All</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest activities in this business
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-sm font-semibold">No activity yet</h3>
                    <p className="mt-2 text-muted-foreground">
                      Activity will appear here as users interact with this business.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="bg-muted p-2 rounded-full">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(activity.timestamp)}
                            </span>
                            {activity.amount && (
                              <span className="text-sm font-medium text-green-600">
                                {formatCurrency(activity.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage users who have access to this business
                    </CardDescription>
                  </div>
                  {business.role === 'OWNER' && (
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite User
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {business.users && business.users.length > 0 ? (
                  <div className="space-y-4">
                    {business.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{user.name}</h4>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role.toLowerCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Joined {formatDate(user.joinedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-sm font-semibold">No team members</h3>
                    <p className="mt-2 text-muted-foreground">
                      Invite team members to collaborate on this business.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Settings</CardTitle>
                  <CardDescription>
                    Configure business preferences and options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Status</h4>
                      <p className="text-sm text-muted-foreground">Current business status</p>
                    </div>
                    <Badge className={getStatusColor(business.status)}>
                      {business.status}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Created</h4>
                      <p className="text-sm text-muted-foreground">{formatDate(business.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Last Updated</h4>
                      <p className="text-sm text-muted-foreground">{formatDate(business.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {business.role === 'OWNER' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible actions for this business
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-600">Delete Business</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permanently delete this business and all associated data. This action cannot be undone.
                      </p>
                      <Button variant="destructive" size="sm" className="mt-3">
                        Delete Business
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
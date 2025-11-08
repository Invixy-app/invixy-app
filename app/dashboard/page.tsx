"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Building2,
  Users,
  Package,
  FileText,
  Plus,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Calculator,
  Eye,
} from "lucide-react";

interface BusinessWithRole {
  id: string;
  name: string;
  description?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  customerCount?: number;
  productCount?: number;
  invoiceCount?: number;
  totalRevenue?: number;
  pendingAmount?: number;
  status?: string;
}

interface DashboardStats {
  totalBusinesses: number;
  totalCustomers: number;
  totalProducts: number;
  totalInvoices: number;
  monthlyRevenue: number;
  pendingInvoices: number;
  recentRevenue: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'invoice' | 'customer' | 'product' | 'business';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { currentBusiness } = useBusinessContext();
  const [businesses, setBusinesses] = useState<BusinessWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    recentRevenue: 0,
    revenueGrowth: 12.5,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch businesses
      const businessResponse = await fetch("/api/business");
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        setBusinesses(businessData.businesses || []);
        
        // Update stats with actual business count
        setStats(prev => ({
          ...prev,
          totalBusinesses: businessData.businesses?.length || 0,
        }));
      }

      // Fetch dashboard stats (this could be combined with business API later)
      const statsResponse = await fetch("/api/business/dashboard");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prev => ({
          ...prev,
          ...statsData.stats,
        }));
        setRecentActivity(statsData.recentActivity || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ACCOUNTANT":
        return "secondary";
      case "EMPLOYEE":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "default";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4" />;
      case 'customer':
        return <Users className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'business':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4 p-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {currentBusiness 
                ? `Overview for ${currentBusiness.name}` 
                : `Welcome back, ${session?.user?.name}`
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/invoices/new">
                <FileText className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/businesses/new">
                <Plus className="mr-2 h-4 w-4" />
                New Business
              </Link>
            </Button>
          </div>
        </div>

        {/* KEY METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.monthlyRevenue)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{stats.revenueGrowth}% from last month
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Awaiting payment
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Across all businesses
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <div className="text-xs text-muted-foreground mt-1">
                In catalog
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECONDARY METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
              <Progress value={Math.min((stats.totalBusinesses / 10) * 100, 100)} className="mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {stats.totalBusinesses} of 10 businesses
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Lifetime invoices created
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Revenue</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.recentRevenue)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Last 7 days
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BUSINESSES LIST */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Businesses</CardTitle>
                  <CardDescription>
                    Manage your businesses and their performance
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/businesses">
                    <Eye className="mr-2 h-4 w-4" />
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {businesses.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">
                    No businesses yet
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by creating your first business.
                  </p>
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/dashboard/businesses/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Business
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {businesses.slice(0, 3).map((business) => (
                    <div
                      key={business.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{business.name}</h3>
                          <Badge variant={getRoleBadgeVariant(business.role)}>
                            {business.role.toLowerCase()}
                          </Badge>
                          {business.status && (
                            <Badge variant={getStatusBadgeVariant(business.status)}>
                              {business.status}
                            </Badge>
                          )}
                        </div>
                        {business.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {business.description}
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{business.customerCount || 0} customers</span>
                          <span>{business.productCount || 0} products</span>
                          <span>{business.invoiceCount || 0} invoices</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          {business.totalRevenue && (
                            <span className="text-sm font-medium text-green-600">
                              {formatCurrency(business.totalRevenue)}
                            </span>
                          )}
                          {business.pendingAmount && business.pendingAmount > 0 && (
                            <span className="text-xs text-orange-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {formatCurrency(business.pendingAmount)} pending
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/businesses/${business.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {businesses.length > 3 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/businesses">
                          View all {businesses.length} businesses
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* RECENT ACTIVITY */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates across your businesses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">
                    No recent activity
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Activity will appear here as you use the platform.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <div className="p-2 bg-muted rounded-full">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {activity.title}
                          </p>
                          {activity.amount && (
                            <span className="text-sm font-medium text-green-600">
                              {formatCurrency(activity.amount)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

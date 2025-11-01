"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Users,
  Package,
  FileText,
  Settings,
  Calendar,
  DollarSign,
  Eye,
} from "lucide-react";
import { showError } from "@/lib/alert-store";

interface BusinessWithStats {
  id: string;
  name: string;
  description?: string;
  type: string;
  industry?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customerCount: number;
  productCount: number;
  invoiceCount: number;
  totalRevenue: number;
  pendingAmount: number;
  lastActivity?: string;
}

export default function BusinessesPage() {
  const { data: session } = useSession();

  const [businesses, setBusinesses] = useState<BusinessWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/business/dashboard");
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
      } else {
        showError("Error", "Failed to load businesses");
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
      showError("Error", "Failed to load businesses");
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
        return "outline";
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
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (business.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || business.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
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
          <div>
            <h1 className="text-3xl font-bold">Your Businesses</h1>
            <p className="text-muted-foreground">
              Manage all your businesses and their settings
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/businesses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Business
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>

        {/* Business Cards */}
        {filteredBusinesses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchTerm || selectedRole !== "all" 
                  ? "No businesses match your criteria" 
                  : "No businesses yet"
                }
              </h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || selectedRole !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first business"
                }
              </p>
              {!searchTerm && selectedRole === "all" && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/dashboard/businesses/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Business
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <Card key={business.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{business.name}</CardTitle>
                      {business.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {business.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={getRoleBadgeVariant(business.role)}>
                      {business.role.toLowerCase()}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(business.status)}>
                      {business.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Business Type & Industry */}
                    <div className="text-sm text-muted-foreground">
                      {business.type}
                      {business.industry && ` • ${business.industry}`}
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="text-sm font-medium">{business.customerCount}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Customers</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <Package className="h-3 w-3" />
                          <span className="text-sm font-medium">{business.productCount}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Products</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span className="text-sm font-medium">{business.invoiceCount}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Invoices</div>
                      </div>
                    </div>

                    {/* Revenue Information */}
                    {business.totalRevenue > 0 && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                {formatCurrency(business.totalRevenue)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">Total Revenue</div>
                          </div>
                          {business.pendingAmount > 0 && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-orange-600">
                                {formatCurrency(business.pendingAmount)}
                              </div>
                              <div className="text-xs text-muted-foreground">Pending</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Creation Date */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {formatDate(business.createdAt)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/businesses/${business.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      {business.role === 'OWNER' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/businesses/${business.id}/settings`}>
                            <Settings className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredBusinesses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{filteredBusinesses.length}</div>
                  <div className="text-sm text-muted-foreground">Total Businesses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {filteredBusinesses.reduce((sum, b) => sum + b.customerCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Customers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {filteredBusinesses.reduce((sum, b) => sum + b.invoiceCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Invoices</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(filteredBusinesses.reduce((sum, b) => sum + b.totalRevenue, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
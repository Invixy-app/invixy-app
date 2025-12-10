"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showConfirm, showError, showSuccess } from "@/lib/alert-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Edit, 
  MoreHorizontal,
  Calculator,
  Percent,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Package,
  TrendingUp,
  Activity,
  Trash2
} from "lucide-react";
import Link from "next/link";

interface TaxSystem {
  id: string;
  name: string;
  description?: string | null;
  taxId: string;
  taxType: string;
  rate: number;
  isCompound: boolean;
  isActive: boolean;
  validFrom: Date;
  validTo?: Date | null;
  applicableProducts?: string[] | null;
  exemptProducts?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Product {
  id: string;
  name: string;
  category?: string | null;
  price: number;
}

interface InvoiceUsage {
  id: string;
  invoiceNumber: string;
  customerName: string;
  issueDate: Date;
  status: string;
  taxAmount: number;
  total: number;
}

export default function TaxSystemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [taxSystem, setTaxSystem] = useState<TaxSystem | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceUsage, setInvoiceUsage] = useState<InvoiceUsage[]>([]);
  const [stats, setStats] = useState({
    totalTaxCollected: 0,
    invoicesUsingTax: 0,
    productsWithTax: 0,
    averageTaxAmount: 0
  });

  useEffect(() => {
    if (params?.id && currentBusiness?.id) {
      fetchTaxSystemDetails();
    } else if (!businessLoading) {
      setLoading(false);
    }
  }, [params?.id, currentBusiness?.id, businessLoading]);

  const fetchTaxSystemDetails = async () => {
    if (!currentBusiness?.id) return;
    
    try {
      setLoading(true);
      
      const [taxSystemRes, productsRes, usageRes] = await Promise.all([
        fetch(`/api/tax-systems/${params?.id}?businessId=${currentBusiness.id}`),
        fetch(`/api/products?businessId=${currentBusiness.id}&taxSystemId=${params?.id}`),
        fetch(`/api/tax-systems/${params?.id}/usage?businessId=${currentBusiness.id}`)
      ]);
      
      if (taxSystemRes.ok) {
        const data = await taxSystemRes.json();
        setTaxSystem(data);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setInvoiceUsage(usageData.invoices || []);
        setStats({
          totalTaxCollected: usageData.totalTaxCollected || 0,
          invoicesUsingTax: usageData.invoicesUsingTax || 0,
          productsWithTax: usageData.productsWithTax || 0,
          averageTaxAmount: usageData.averageTaxAmount || 0
        });
      }
    } catch (error) {
      console.error("Error fetching tax system details:", error);
      router.push("/dashboard/tax-systems");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentBusiness?.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const getTaxTypeIcon = (taxType: string) => {
    switch (taxType) {
      case "PERCENTAGE":
        return <Percent className="h-4 w-4" />;
      case "FIXED_AMOUNT":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Calculator className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: { [key: string]: { color: string, icon: any, label: string } } = {
      DRAFT: { color: "bg-gray-500", icon: FileText, label: "Draft" },
      SENT: { color: "bg-blue-500", icon: Activity, label: "Sent" },
      VIEWED: { color: "bg-purple-500", icon: Activity, label: "Viewed" },
      PAID: { color: "bg-green-500", icon: CheckCircle, label: "Paid" },
      PARTIAL_PAID: { color: "bg-yellow-500", icon: Activity, label: "Partial" },
      OVERDUE: { color: "bg-red-500", icon: XCircle, label: "Overdue" },
      CANCELLED: { color: "bg-gray-400", icon: XCircle, label: "Cancelled" }
    };

    const statusConfig = config[status] || config.DRAFT;
    const Icon = statusConfig.icon;
    
    return (
      <Badge className={`${statusConfig.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading || businessLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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

  if (!taxSystem) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold">Tax System not found</h2>
          <p className="text-muted-foreground mt-2">The requested tax system could not be found.</p>
          <Link href="/dashboard/tax-systems">
            <Button className="mt-4">Back to Tax Systems</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isExpired = taxSystem.validTo && new Date(taxSystem.validTo) < new Date();
  const isActive = taxSystem.isActive && !isExpired;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/tax-systems">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tax Systems
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {taxSystem.name}
                </h1>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Created on {formatDate(taxSystem.createdAt)}
                {taxSystem.validTo && ` • Expires ${formatDate(taxSystem.validTo)}`}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/tax-systems/${taxSystem.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Tax System
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Tax System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tax System Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Tax Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Tax ID</div>
                      <div className="text-lg font-mono">{taxSystem.taxId}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Tax Type</div>
                      <div className="flex items-center">
                        {getTaxTypeIcon(taxSystem.taxType)}
                        <span className="ml-2">{taxSystem.taxType.replace("_", " ")}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Rate</div>
                      <div className="text-2xl font-bold">
                        {taxSystem.taxType === "PERCENTAGE" 
                          ? formatPercentage(taxSystem.rate)
                          : formatCurrency(taxSystem.rate)
                        }
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Valid From</div>
                      <div>{formatDate(taxSystem.validFrom)}</div>
                    </div>
                    {taxSystem.validTo && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Valid To</div>
                        <div>{formatDate(taxSystem.validTo)}</div>
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      {taxSystem.isCompound && (
                        <Badge variant="secondary">Compound Tax</Badge>
                      )}
                      {isExpired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {taxSystem.description && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Description</div>
                      <p className="text-sm">{taxSystem.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Products Using This Tax */}
            {products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Products Using This Tax
                  </CardTitle>
                  <CardDescription>
                    Products configured with this tax system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Tax Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const taxAmount = taxSystem.taxType === "PERCENTAGE" 
                          ? product.price * taxSystem.rate
                          : taxSystem.rate;
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.category || "-"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(taxAmount)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Recent Invoice Usage */}
            {invoiceUsage.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Recent Invoice Usage
                  </CardTitle>
                  <CardDescription>
                    Recent invoices that have used this tax system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Tax Amount</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceUsage.slice(0, 10).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <Link 
                              href={`/dashboard/invoices/${invoice.id}`}
                              className="hover:underline"
                            >
                              #{invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice.taxAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Tax Collected</span>
                    <span className="text-lg font-bold">{formatCurrency(stats.totalTaxCollected)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Invoices Using Tax</span>
                    <span className="font-medium">{stats.invoicesUsingTax}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Products With Tax</span>
                    <span className="font-medium">{stats.productsWithTax}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Tax Amount</span>
                    <span className="font-medium">{formatCurrency(stats.averageTaxAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href={`/dashboard/tax-systems/${taxSystem.id}/edit`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Tax System
                    </Button>
                  </Link>
                  <Link href="/dashboard/products/new">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="h-4 w-4 mr-2" />
                      Create Product with This Tax
                    </Button>
                  </Link>
                  <Link href="/dashboard/invoices/new">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Tax System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(taxSystem.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{formatDate(taxSystem.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showConfirm, showError, showSuccess } from "@/lib/alert-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Percent,
  DollarSign,
  CheckCircle,
  Clock
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
  validFrom: string;
  validTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TaxSystemsPage() {
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [taxSystems, setTaxSystems] = useState<TaxSystem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchTaxSystems(currentBusiness.id);
    } else if (!businessLoading) {
      setLoading(false);
    }
  }, [currentBusiness?.id, businessLoading]);

  const fetchTaxSystems = async (businessId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tax-systems?businessId=${businessId}`);
      if (response.ok) {
        const data = await response.json();
        setTaxSystems(data);
      } else {
        console.error("Failed to fetch tax systems");
      }
    } catch (error) {
      console.error("Error fetching tax systems:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTaxSystem = (taxSystemId: string) => {
    showConfirm(
      "Delete Tax System",
      "Are you sure you want to delete this tax system? This action cannot be undone.",
      async () => {
        try {
          const response = await fetch(`/api/tax-systems/${taxSystemId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            setTaxSystems(taxSystems.filter(t => t.id !== taxSystemId));
            showSuccess("Success", "Tax system deleted successfully");
          } else {
            showError("Error", "Failed to delete tax system");
          }
        } catch (error) {
          console.error("Error deleting tax system:", error);
          showError("Error", "Error deleting tax system");
        }
      },
      {
        confirmText: "Delete",
        cancelText: "Cancel"
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  const getTaxTypeBadgeVariant = (taxType: string) => {
    switch (taxType) {
      case "PERCENTAGE":
        return "default";
      case "FIXED_AMOUNT":
        return "secondary";
      case "INCLUSIVE":
        return "outline";
      case "EXCLUSIVE":
        return "outline";
      case "COMPOUND":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const isExpired = (validTo?: string | null) => {
    if (!validTo) return false;
    return new Date(validTo) < new Date();
  };

  const activeTaxSystems = taxSystems.filter(tax => tax.isActive && !isExpired(tax.validTo));
  const inactiveTaxSystems = taxSystems.filter(tax => !tax.isActive || isExpired(tax.validTo));

  if (loading || businessLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tax Systems</h1>
            <p className="text-muted-foreground">
              Configure and manage your tax calculation systems
            </p>
          </div>
          <Link href="/dashboard/tax-systems/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tax System
            </Button>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Active Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTaxSystems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-600" />
                Inactive/Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveTaxSystems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calculator className="h-4 w-4 mr-2 text-blue-600" />
                Total Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taxSystems.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tax Systems List */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Configuration</CardTitle>
            <CardDescription>
              Manage your tax calculation systems and rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="space-y-4">
              <TabsList>
                <TabsTrigger value="active">Active Systems ({activeTaxSystems.length})</TabsTrigger>
                <TabsTrigger value="inactive">Inactive ({inactiveTaxSystems.length})</TabsTrigger>
                <TabsTrigger value="all">All Systems ({taxSystems.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4">
                {activeTaxSystems.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tax System</TableHead>
                          <TableHead>Tax ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Valid Period</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTaxSystems.map((tax) => (
                          <TableRow key={tax.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center">
                                  {getTaxTypeIcon(tax.taxType)}
                                  <span className="ml-2">{tax.name}</span>
                                </div>
                                {tax.description && (
                                  <div className="text-sm text-muted-foreground line-clamp-1">
                                    {tax.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {tax.taxId}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getTaxTypeBadgeVariant(tax.taxType)}>
                                {tax.taxType.replace('_', ' ')}
                              </Badge>
                              {tax.isCompound && (
                                <Badge variant="destructive" className="ml-1 text-xs">
                                  COMPOUND
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {tax.taxType === "FIXED_AMOUNT" 
                                  ? `$${tax.rate.toFixed(2)}` 
                                  : formatPercentage(tax.rate)
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>From: {formatDate(tax.validFrom)}</div>
                                {tax.validTo && (
                                  <div className="text-muted-foreground">
                                    To: {formatDate(tax.validTo)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-green-600">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <Link href={`/dashboard/tax-systems/${tax.id}`}>
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                  </Link>
                                  <Link href={`/dashboard/tax-systems/${tax.id}/edit`}>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit System
                                    </DropdownMenuItem>
                                  </Link>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteTaxSystem(tax.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active tax systems</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first tax system to start applying taxes to products
                    </p>
                    <Link href="/dashboard/tax-systems/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Tax System
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="inactive" className="space-y-4">
                {inactiveTaxSystems.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tax System</TableHead>
                          <TableHead>Tax ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inactiveTaxSystems.map((tax) => (
                          <TableRow key={tax.id} className="opacity-60">
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center">
                                  {getTaxTypeIcon(tax.taxType)}
                                  <span className="ml-2">{tax.name}</span>
                                </div>
                                {tax.description && (
                                  <div className="text-sm text-muted-foreground line-clamp-1">
                                    {tax.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {tax.taxId}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getTaxTypeBadgeVariant(tax.taxType)}>
                                {tax.taxType.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {tax.taxType === "FIXED_AMOUNT" 
                                  ? `$${tax.rate.toFixed(2)}` 
                                  : formatPercentage(tax.rate)
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {!tax.isActive ? "Inactive" : "Expired"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <Link href={`/dashboard/tax-systems/${tax.id}`}>
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                  </Link>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteTaxSystem(tax.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No inactive tax systems</h3>
                    <p className="text-muted-foreground">
                      All your tax systems are currently active
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                {taxSystems.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tax System</TableHead>
                          <TableHead>Tax ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taxSystems.map((tax) => (
                          <TableRow key={tax.id} className={!tax.isActive || isExpired(tax.validTo) ? "opacity-60" : ""}>
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center">
                                  {getTaxTypeIcon(tax.taxType)}
                                  <span className="ml-2">{tax.name}</span>
                                </div>
                                {tax.description && (
                                  <div className="text-sm text-muted-foreground line-clamp-1">
                                    {tax.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {tax.taxId}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getTaxTypeBadgeVariant(tax.taxType)}>
                                {tax.taxType.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {tax.taxType === "FIXED_AMOUNT" 
                                  ? `$${tax.rate.toFixed(2)}` 
                                  : formatPercentage(tax.rate)
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={tax.isActive && !isExpired(tax.validTo) ? "default" : "secondary"}>
                                {tax.isActive && !isExpired(tax.validTo) ? "Active" : 
                                 !tax.isActive ? "Inactive" : "Expired"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(tax.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <Link href={`/dashboard/tax-systems/${tax.id}`}>
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                  </Link>
                                  {tax.isActive && !isExpired(tax.validTo) && (
                                    <Link href={`/dashboard/tax-systems/${tax.id}/edit`}>
                                      <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit System
                                      </DropdownMenuItem>
                                    </Link>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteTaxSystem(tax.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tax systems configured</h3>
                    <p className="text-muted-foreground mb-4">
                      Set up your first tax system to start calculating taxes on products and invoices
                    </p>
                    <Link href="/dashboard/tax-systems/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Tax System
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Setup */}
        {taxSystems.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup</CardTitle>
              <CardDescription>
                Get started with common tax system templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <Percent className="h-5 w-5 mr-2" />
                    <h4 className="font-medium">GST (India)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    5%, 12%, 18%, 28% tax rates
                  </p>
                  <Link href="/dashboard/tax-systems/new?template=gst">
                    <Button variant="outline" size="sm" className="w-full">
                      Setup GST
                    </Button>
                  </Link>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <Percent className="h-5 w-5 mr-2" />
                    <h4 className="font-medium">VAT (EU)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Standard and reduced VAT rates
                  </p>
                  <Link href="/dashboard/tax-systems/new?template=vat">
                    <Button variant="outline" size="sm" className="w-full">
                      Setup VAT
                    </Button>
                  </Link>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <Percent className="h-5 w-5 mr-2" />
                    <h4 className="font-medium">Sales Tax (US)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    State and local tax rates
                  </p>
                  <Link href="/dashboard/tax-systems/new?template=sales_tax">
                    <Button variant="outline" size="sm" className="w-full">
                      Setup Sales Tax
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
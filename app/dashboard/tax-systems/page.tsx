"use client";

import { useEffect, useRef, useState } from "react";
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
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock,
} from "lucide-react";
import Link from "next/link";

type TabValue = "active" | "inactive" | "all";

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
  const ITEMS_PER_PAGE = 10;
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();

  const [taxSystems, setTaxSystems] = useState<TaxSystem[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [stats, setStats] = useState({
    activeCount: 0,
    inactiveCount: 0,
    totalCount: 0,
  });
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (!currentBusiness?.id && !businessLoading) {
      setInitialLoading(false);
    }
  }, [currentBusiness?.id, businessLoading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, currentBusiness?.id]);

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchTaxSystems(currentBusiness.id, activeTab, currentPage);
    }
  }, [currentBusiness?.id, activeTab, currentPage]);

  const fetchTaxSystems = async (businessId: string, tab: TabValue, page: number) => {
    const isInitialFetch = !hasLoadedOnceRef.current;
    try {
      if (isInitialFetch) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }
      const params = new URLSearchParams({
        businessId,
        paginated: "true",
        tab,
        page: String(page),
        pageSize: String(ITEMS_PER_PAGE),
      });

      const response = await fetch(`/api/tax-systems?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTaxSystems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setStats(
          data.stats || {
            activeCount: 0,
            inactiveCount: 0,
            totalCount: 0,
          }
        );
      } else {
        console.error("Failed to fetch tax systems");
      }
    } catch (error) {
      console.error("Error fetching tax systems:", error);
    } finally {
      if (isInitialFetch) {
        hasLoadedOnceRef.current = true;
        setInitialLoading(false);
      }
      setTableLoading(false);
    }
  };

  const handleDeleteTaxSystem = (taxSystemId: string) => {
    if (!currentBusiness?.id) {
      showError("Error", "No business selected");
      return;
    }

    showConfirm(
      "Delete Tax System",
      "Are you sure you want to delete this tax system? This action cannot be undone.",
      async () => {
        try {
          const response = await fetch(`/api/tax-systems/${taxSystemId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            await fetchTaxSystems(currentBusiness.id, activeTab, currentPage);
            showSuccess("Success", "Tax system deleted successfully");
          } else {
            showError("Error", "Something went wrong. Please try again.");
          }
        } catch (error) {
          console.error("Error deleting tax system:", error);
          showError("Error", "Something went wrong. Please try again.");
        }
      },
      {
        confirmText: "Delete",
        cancelText: "Cancel",
      }
    );
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const formatPercentage = (rate: number) => `${(rate * 100).toFixed(2)}%`;

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

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const rangeStart = total === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + ITEMS_PER_PAGE, total);

  if (initialLoading || businessLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--brand-cobalt)]"></div>
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
      <div className="space-y-8">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tax Systems</h1>
            <p className="text-muted-foreground">Configure and manage your tax calculation systems</p>
          </div>
          <Link href="/dashboard/tax-systems/new">
            <Button className="bg-[var(--brand-cobalt)] text-white hover:bg-[var(--brand-indigo)]">
              <Plus className="h-4 w-4 mr-2" />
              Add Tax System
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-[var(--brand-teal)]/25 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-[var(--brand-teal)]" />
                Active Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCount}</div>
            </CardContent>
          </Card>

          <Card className="border-[var(--brand-indigo)]/25 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                Inactive/Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactiveCount}</div>
            </CardContent>
          </Card>

          <Card className="border-[var(--brand-cobalt)]/25 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calculator className="h-4 w-4 mr-2 text-[var(--brand-cobalt)]" />
                Total Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-border/80">
          <CardHeader>
            <CardTitle>Tax Configuration</CardTitle>
            <CardDescription>Manage your tax calculation systems and rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-4">
              <TabsList className="bg-muted/60">
                <TabsTrigger value="active">Active Systems ({stats.activeCount})</TabsTrigger>
                <TabsTrigger value="inactive">Inactive ({stats.inactiveCount})</TabsTrigger>
                <TabsTrigger value="all">All Systems ({stats.totalCount})</TabsTrigger>
              </TabsList>
            </Tabs>

            {tableLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-4 py-8 text-sm text-muted-foreground">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--brand-cobalt)] border-b-transparent" />
                Loading tax systems...
              </div>
            ) : taxSystems.length > 0 ? (
              <>
                <div className="rounded-xl border border-border/80 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="max-w-[250px]">Tax System</TableHead>
                        <TableHead className="w-[120px]">Tax ID</TableHead>
                        <TableHead className="w-[120px]">Type</TableHead>
                        <TableHead className="w-[100px]">Rate</TableHead>
                        <TableHead className="w-[150px]">Valid Period</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="text-right w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxSystems.map((tax) => {
                        const active = tax.isActive && !isExpired(tax.validTo);
                        return (
                          <TableRow key={tax.id} className={!active ? "opacity-60" : ""}>
                            <TableCell className="max-w-[250px]">
                              <div>
                                <div className="font-medium flex items-center">
                                  {getTaxTypeIcon(tax.taxType)}
                                  <span className="ml-2 line-clamp-2" title={tax.name}>{tax.name}</span>
                                </div>
                                {tax.description && (
                                  <div className="text-sm text-muted-foreground line-clamp-2" title={tax.description}>
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
                                {tax.taxType.replace("_", " ")}
                              </Badge>
                              {tax.isCompound && (
                                <Badge variant="destructive" className="ml-1 text-xs">
                                  COMPOUND
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {tax.taxType === "FIXED_AMOUNT" ? `$${tax.rate.toFixed(2)}` : formatPercentage(tax.rate)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>From: {formatDate(tax.validFrom)}</div>
                                {tax.validTo && <div className="text-muted-foreground">To: {formatDate(tax.validTo)}</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={active ? "default" : "secondary"}>
                                {active ? "Active" : !tax.isActive ? "Inactive" : "Expired"}
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
                                  {active && (
                                    <Link href={`/dashboard/tax-systems/${tax.id}/edit`}>
                                      <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit System
                                      </DropdownMenuItem>
                                    </Link>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDeleteTaxSystem(tax.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between border-t border-border/80 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {rangeStart}-{rangeEnd} of {total} systems
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tax systems found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "active"
                    ? "Create your first tax system to start applying taxes"
                    : "No tax systems match this tab yet"}
                </p>
                <Link href="/dashboard/tax-systems/new">
                  <Button className="bg-[var(--brand-cobalt)] text-white hover:bg-[var(--brand-indigo)]">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tax System
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

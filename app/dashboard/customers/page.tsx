"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showConfirm, showError, showSuccess } from "@/lib/alert-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LIMITS } from "@/lib/constants-limits";
import { Edit, Eye, Mail, MapPin, MoreHorizontal, Phone, Plus, Search, Trash2, Users, UserCheck, AtSign } from "lucide-react";
import Link from "next/link";
import { BulkCustomerImport } from "@/components/customers/bulk-customer-import";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  taxId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const ITEMS_PER_PAGE = 10;
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [customersWithEmail, setCustomersWithEmail] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const hasLoadedOnceRef = useRef(false);

  // Calculate limits
  const currentPlan = currentBusiness?.plan || "FREE";
  const customerLimit = LIMITS[currentPlan].CUSTOMERS;
  const canCreateCustomer = totalCustomers < customerLimit;

  useEffect(() => {
    if (!currentBusiness?.id && !businessLoading) {
      setInitialLoading(false);
    }
  }, [currentBusiness?.id, businessLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, currentBusiness?.id]);

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchCustomers(currentBusiness.id, currentPage, debouncedSearchTerm);
    }
  }, [currentBusiness?.id, currentPage, debouncedSearchTerm]);

  const fetchCustomers = async (businessId: string, page = 1, search = "") => {
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
        page: String(page),
        pageSize: String(ITEMS_PER_PAGE),
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`/api/customers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.items || []);
        setTotalCustomers(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setActiveCustomers(data.stats?.activeCount || 0);
        setCustomersWithEmail(data.stats?.withEmailCount || 0);
      } else {
        console.error("Failed to fetch customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      if (isInitialFetch) {
        hasLoadedOnceRef.current = true;
        setInitialLoading(false);
      }
      setTableLoading(false);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    showConfirm(
      "Delete Customer",
      "Are you sure you want to delete this customer? This action cannot be undone.",
      async () => {
        try {
          const response = await fetch(`/api/customers/${customerId}?businessId=${currentBusiness?.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            if (currentBusiness?.id) {
                await fetchCustomers(currentBusiness.id, currentPage, debouncedSearchTerm);
            }
            showSuccess("Success", "Customer deleted successfully");
          } else {
            const errorData = await response.json();
            showError("Error", "Something went wrong. Please try again.");
          }
        } catch (error) {
          console.error("Error deleting customer:", error);
          showError("Error", "Something went wrong. Please try again.");
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

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const rangeStart = totalCustomers === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + ITEMS_PER_PAGE, totalCustomers);

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
        {/* Header */}
        <div className="flex justify-between items-center rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customer database and relationships
            </p>
          </div>
          <div className="flex gap-2">
            <BulkCustomerImport
              onImportSuccess={async () => {
                if (currentBusiness?.id) {
                  await fetchCustomers(currentBusiness.id, currentPage, debouncedSearchTerm);
                }
              }}
            />
            <TooltipProvider>
              <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span>
                  <Button disabled={!canCreateCustomer} asChild={canCreateCustomer} className="bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                    {canCreateCustomer ? (
                      <Link href="/dashboard/customers/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                      </Link>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canCreateCustomer && (
                <TooltipContent side="left">
                   <p>Limit reached on {currentPlan} plan.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          </div>
        </div>

        {/* Summary Stats */}
        {totalCustomers > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-[var(--brand-cobalt)]/25 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-[var(--brand-cobalt)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Customer records</p>
              </CardContent>
            </Card>
            <Card className="border-[var(--brand-teal)]/25 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <UserCheck className="h-4 w-4 text-[var(--brand-teal)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeCustomers}
                </div>
                <p className="text-xs text-muted-foreground">Currently active profiles</p>
              </CardContent>
            </Card>
            <Card className="border-[var(--brand-indigo)]/25 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Email</CardTitle>
                <AtSign className="h-4 w-4 text-[var(--brand-indigo)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customersWithEmail}
                </div>
                <p className="text-xs text-muted-foreground">Reachable by email</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="shadow-sm border-border/80">
          <CardHeader>
            <CardTitle>Customer Directory</CardTitle>
            <CardDescription>
              Search and manage your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Customers Table */}
            {tableLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-4 py-8 text-sm text-muted-foreground">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--brand-cobalt)] border-b-transparent" />
                Loading customers...
              </div>
            ) : customers.length > 0 ? (
              <div>
                <div className="rounded-xl border border-border/80 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="max-w-[200px]">Customer</TableHead>
                        <TableHead className="max-w-[200px]">Contact</TableHead>
                        <TableHead className="max-w-[250px]">Address</TableHead>
                        <TableHead className="w-[120px]">Tax ID</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[120px]">Added</TableHead>
                        <TableHead className="text-right w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                        <TableCell className="max-w-[200px]">
                          <div>
                            <div className="font-medium line-clamp-2" title={customer.name}>{customer.name}</div>
                            {customer.email && (
                              <div className="flex items-center text-sm text-muted-foreground mt-1" title={customer.email}>
                                <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="line-clamp-2 break-all">{customer.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          {customer.billingAddress && (
                            <div className="flex items-start text-sm">
                              <MapPin className="h-3 w-3 mr-1 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="line-clamp-2" title={customer.billingAddress}>{customer.billingAddress}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.taxId && (
                            <Badge variant="outline" className="text-xs">
                              {customer.taxId}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.isActive ? "default" : "secondary"}>
                            {customer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(customer.createdAt)}
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
                              <Link href={`/dashboard/customers/${customer.id}`}>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/dashboard/customers/${customer.id}/edit`}>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Customer
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/dashboard/invoices/new?customerId=${customer.id}`}>
                                <DropdownMenuItem>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Invoice
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="text-destructive"
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
                <div className="flex items-center justify-between border-t border-border/80 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {rangeStart}-{rangeEnd} of {totalCustomers} customers
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
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
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
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "No customers found" : "No customers yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Try adjusting your search terms" 
                    : "Get started by adding your first customer"
                  }
                </p>
                {!searchTerm && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span>
                          <Button disabled={!canCreateCustomer} asChild={canCreateCustomer}>
                            {canCreateCustomer ? (
                              <Link href="/dashboard/customers/new">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Customer
                              </Link>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Customer
                              </>
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canCreateCustomer && (
                        <TooltipContent>
                          <p>Limit reached on {currentPlan} plan.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
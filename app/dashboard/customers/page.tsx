"use client";

import { useEffect, useState } from "react";
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
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import Link from "next/link";

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
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchCustomers(currentBusiness.id);
    } else if (!businessLoading) {
      setLoading(false);
    }
  }, [currentBusiness?.id, businessLoading]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const fetchCustomers = async (businessId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers?businessId=${businessId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        console.error("Failed to fetch customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
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
            setCustomers(customers.filter(c => c.id !== customerId));
            showSuccess("Success", "Customer deleted successfully");
          } else {
            const errorData = await response.json();
            showError("Error", errorData.error || "Failed to delete customer");
          }
        } catch (error) {
          console.error("Error deleting customer:", error);
          showError("Error", "Error deleting customer");
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

  if (loading) {
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
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customer database and relationships
            </p>
          </div>
          <Link href="/dashboard/customers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card>
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
            {filteredCustomers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Tax ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            {customer.email && (
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Mail className="h-3 w-3 mr-1" />
                                {customer.email}
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
                        <TableCell>
                          {customer.billingAddress && (
                            <div className="flex items-start text-sm">
                              <MapPin className="h-3 w-3 mr-1 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="line-clamp-2">{customer.billingAddress}</span>
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
                  <Link href="/dashboard/customers/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Customer
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {customers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers.filter(c => c.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">With Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers.filter(c => c.email).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
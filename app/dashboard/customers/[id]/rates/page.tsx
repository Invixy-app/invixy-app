"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showError, showSuccess } from "@/lib/alert-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, FileSpreadsheet, Package } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
}

interface CustomPrice {
  id: string;
  productId: string;
  price: string; // Decimal from prisma comes as string/number in JSON
  updatedAt: string;
  product: {
    name: string;
    sku?: string | null;
    price: string;
    unit: string;
  };
}

export default function CustomerRatesPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBusiness } = useBusinessContext();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rates, setRates] = useState<CustomPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const customerId = params.id as string;

  useEffect(() => {
    if (currentBusiness?.id && customerId) {
      fetchData();
    }
  }, [currentBusiness?.id, customerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Customer
      const customerRes = await fetch(`/api/customers/${customerId}?businessId=${currentBusiness?.id}`);
      if (customerRes.ok) {
        setCustomer(await customerRes.json());
      } else {
        showError("Error", "Customer not found");
        router.push("/dashboard/customers");
        return;
      }

      // Fetch Rates
      const ratesRes = await fetch(`/api/customers/${customerId}/rates?businessId=${currentBusiness?.id}`);
      if (ratesRes.ok) {
        setRates(await ratesRes.json());
      }
    } catch (error) {
      console.error("Error fetching rates data:", error);
      showError("Error", "Failed to load special rates.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentBusiness?.currency || 'USD'
    }).format(numericAmount);
  };

  const handleExportCSV = () => {
    if (!rates || rates.length === 0) {
      showError("No data", "There are no special rates to export.");
      return;
    }

    // CSV Header
    const headers = ["Product Name", "SKU", "Base Price", "Custom Rate", "Unit", "Last Updated"];
    
    // CSV Rows
    const rows = rates.map(rate => [
      `"${rate.product.name.replace(/"/g, '""')}"`,
      `"${rate.product.sku || ''}"`,
      rate.product.price,
      rate.price,
      rate.product.unit,
      formatDate(rate.updatedAt)
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create Blob and Download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${customer?.name || 'Customer'}_Special_Rates.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccess("Success", "Rates exported to CSV successfully.");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--brand-cobalt)]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentBusiness || !customer) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/dashboard/customers/${customerId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Special Rates</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Custom negotiated pricing for {customer.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="text-[var(--brand-cobalt)] border-[var(--brand-cobalt)]/20 hover:bg-[var(--brand-cobalt)]/5"
              onClick={handleExportCSV}
              disabled={rates.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Link href={`/dashboard/invoices/new?customerId=${customerId}`}>
              <Button className="bg-[var(--brand-cobalt)] text-white hover:bg-[var(--brand-indigo)]">
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[var(--brand-cobalt)]" />
                <CardTitle className="text-lg">Product Pricing List</CardTitle>
              </div>
              <CardDescription>
                {rates.length} products with custom rates
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {rates.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Base Price</TableHead>
                    <TableHead className="text-right">Custom Rate</TableHead>
                    <TableHead className="text-right">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            {rate.product.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{rate.product.sku || '-'}</TableCell>
                      <TableCell className="text-right text-muted-foreground line-through decoration-muted-foreground/50 decoration-1">
                        {formatCurrency(rate.product.price)} /{rate.product.unit}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[var(--brand-cobalt)]">
                         {formatCurrency(rate.price)} /{rate.product.unit}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(rate.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 px-4 shadow-inner bg-muted/10">
                <div className="bg-white dark:bg-zinc-900 border border-border rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                   <Package className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-medium mb-1 text-foreground">No custom rates found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  When you create an invoice for this customer with modified product prices, they will automatically appear here.
                </p>
                <Link href={`/dashboard/invoices/new?customerId=${customerId}`}>
                    <Button variant="outline" className="text-[var(--brand-cobalt)]">Cut an Invoice</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showError, showSuccess, showWarning, showInfo } from "@/lib/alert-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  User, 
  FileText, 
  UserPlus, 
  PackagePlus, 
  Download,
  Lock,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { invoiceSchema, type InvoiceFormValues } from "@/lib/validations/invoice";
import { InvoiceEmailDialog } from "@/components/invoices/invoice-email-dialog";
import { downloadInvoicePdf } from "@/lib/invoice-client-actions";

type InvoiceFormData = Omit<InvoiceFormValues, "issueDate" | "dueDate" | "items"> & {
  issueDate: string;
  dueDate: string;
  items: (InvoiceFormValues["items"][number] & {
    lineTotal: number;
  })[];
};

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  stockQuantity?: number | null;
  taxSystem?: {
    id: string;
    name: string;
    rate: number;
  } | null;
}

interface TaxSystem {
  id: string;
  name: string;
  taxId: string;
  rate: number;
}

interface ProductHistory {
  hasHistory: boolean;
  lastPrice: number | null;
  lastQuantity?: number;
  lastDiscount?: number;
  lastInvoice?: {
    number: string;
    date: string;
    status: string;
  };
}

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxSystems, setTaxSystems] = useState<TaxSystem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productHistories, setProductHistories] = useState<Record<string, ProductHistory>>({});
  const [productSearchQueries, setProductSearchQueries] = useState<Record<number, string>>({});
  
  const [lastInvoice, setLastInvoice] = useState<any | null>(null);
  const [isLoadingLastInvoice, setIsLoadingLastInvoice] = useState(false);
  const [hasAppliedLastInvoice, setHasAppliedLastInvoice] = useState(false);

  // Quick add dialogs
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    billingAddress: "",
    shippingAddress: "",
    taxId: "",
    notes: ""
  });
  
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    sku: "",
    price: 0,
    cost: 0,
    category: "",
    unit: "pcs",
    stockQuantity: 0,
    minStockLevel: 0,
    taxSystemId: ""
  });
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: searchParams?.get("customerId") || "",
    status: "DRAFT",
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    notes: "",
    terms: "",
    currency: "USD",
    items: [{
      productId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      lineTotal: 0,
      taxSystemIds: []
    }]
  });

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<{id: string, number: string} | null>(null);

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchData();
    }
  }, [currentBusiness?.id]);

  useEffect(() => {
    if (currentBusiness?.currency) {
      setFormData(prev => ({ ...prev, currency: currentBusiness.currency }));
    }
  }, [currentBusiness?.currency]);



  useEffect(() => {
    async function fetchLastInvoice() {
      if (!currentBusiness?.id || !formData.customerId) {
        setLastInvoice(null);
        setHasAppliedLastInvoice(false);
        return;
      }
      setIsLoadingLastInvoice(true);
      try {
        const res = await fetch(`/api/invoices?businessId=${currentBusiness.id}&customerId=${formData.customerId}&status=SENT&paginated=true&pageSize=1`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setLastInvoice(data.items[0]);
          } else {
             const resPaid = await fetch(`/api/invoices?businessId=${currentBusiness.id}&customerId=${formData.customerId}&status=PAID&paginated=true&pageSize=1`);
             if (resPaid.ok) {
                const dataPaid = await resPaid.json();
                if (dataPaid.items && dataPaid.items.length > 0) {
                   setLastInvoice(dataPaid.items[0]);
                } else {
                   setLastInvoice(null);
                }
             }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingLastInvoice(false);
      }
    }
    fetchLastInvoice();
  }, [formData.customerId, currentBusiness?.id]);

  const applyLastInvoice = () => {
    if (!lastInvoice) return;
    setFormData(prev => ({
      ...prev,
      currency: lastInvoice.currency || prev.currency,
      notes: lastInvoice.notes || "",
      terms: lastInvoice.terms || "",
      items: lastInvoice.items.map((item: any) => ({
        productId: item.productId || "",
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        lineTotal: item.lineTotal,
        taxAmount: Number(item.taxAmount || 0),
        taxSystemIds: item.itemTaxes?.map((t: any) => t.taxSystemId) || []
      }))
    }));
    setHasAppliedLastInvoice(true);
    showSuccess("Success", "Previous invoice autofilled!");
  };

  const fetchData = async () => {
    if (!currentBusiness?.id) return;

    try {
      const [customersRes, productsRes, taxSystemsRes] = await Promise.all([
        fetch(`/api/customers?businessId=${currentBusiness.id}`),
        fetch(`/api/products?businessId=${currentBusiness.id}`),
        fetch(`/api/tax-systems?businessId=${currentBusiness.id}`)
      ]);

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (taxSystemsRes.ok) {
        const taxSystemsData = await taxSystemsRes.json();
        setTaxSystems(taxSystemsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          lineTotal: 0,
          taxSystemIds: []
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Stock check
          if (field === 'quantity' && updatedItem.productId) {
            const product = products.find(p => p.id === updatedItem.productId);
            if (product && product.stockQuantity !== null && product.stockQuantity !== undefined) {
              if (updatedItem.quantity > product.stockQuantity) {
                showWarning(
                  "Stock Warning", 
                  `Requested quantity (${updatedItem.quantity}) exceeds available stock (${product.stockQuantity}) for ${product.name}.`
                );
              }
            }
          }

          // Recalculate line total if it's a price-affecting field
          if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
            updatedItem.lineTotal = (updatedItem.quantity * updatedItem.unitPrice) - updatedItem.discount;
          }
          return updatedItem;
        }
        return item;
      });
      
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      // Stock check
      if (product.stockQuantity !== null && product.stockQuantity !== undefined && product.stockQuantity < 1) {
         showWarning(
            "Stock Warning", 
            `Product ${product.name} is out of stock (Available: ${product.stockQuantity}).`
         );
      }

      // Fetch historical price if customer is selected
      if (formData.customerId && currentBusiness?.id) {
        fetchProductHistory(productId, formData.customerId);
      }

      setFormData(prev => ({
        ...prev,
        items: prev.items.map((item, i) => {
          if (i === index) {
            const updatedItem = {
              ...item,
              productId: productId,
              description: product.name,
              unitPrice: product.price,
              // Automatically add product's default tax if it exists
              taxSystemIds: product.taxSystem?.id ? [product.taxSystem.id] : []
            };
            // Recalculate line total
            updatedItem.lineTotal = (updatedItem.quantity * updatedItem.unitPrice) - updatedItem.discount;
            return updatedItem;
          }
          return item;
        })
      }));
    }
  };

  const fetchProductHistory = async (productId: string, customerId: string) => {
    if (!currentBusiness?.id) return;

    try {
      const response = await fetch(
        `/api/products/${productId}/history?customerId=${customerId}&businessId=${currentBusiness.id}`
      );

      if (response.ok) {
        const data = await response.json();
        setProductHistories(prev => ({
          ...prev,
          [productId]: data
        }));
      }
    } catch (error) {
      console.error("Error fetching product history:", error);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      showError("Validation Error", "Customer name is required");
      return;
    }

    if (!currentBusiness?.id) {
      showError("Error", "No business selected");
      return;
    }

    setSavingCustomer(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newCustomer,
          businessId: currentBusiness.id,
        }),
      });

      if (response.ok) {
        const createdCustomer = await response.json();
        setCustomers(prev => [...prev, createdCustomer]);
        setFormData(prev => ({ ...prev, customerId: createdCustomer.id }));
        setNewCustomer({
          name: "",
          email: "",
          phone: "",
          billingAddress: "",
          shippingAddress: "",
          taxId: "",
          notes: ""
        });
        setShowAddCustomerDialog(false);
        showSuccess("Success", "Customer created successfully");
      } else {
        const error = await response.json();
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      showError("Validation Error", "Product name is required");
      return;
    }

    if (newProduct.price <= 0) {
      showError("Validation Error", "Product price must be greater than 0");
      return;
    }

    if (!currentBusiness?.id) {
      showError("Error", "No business selected");
      return;
    }

    setSavingProduct(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newProduct,
          businessId: currentBusiness.id,
          taxSystemId: newProduct.taxSystemId || null,
        }),
      });

      if (response.ok) {
        const createdProduct = await response.json();
        setProducts(prev => [...prev, createdProduct]);
        setNewProduct({
          name: "",
          description: "",
          sku: "",
          price: 0,
          cost: 0,
          category: "",
          unit: "pcs",
          stockQuantity: 0,
          minStockLevel: 0,
          taxSystemId: ""
        });
        setShowAddProductDialog(false);
        showSuccess("Success", "Product created successfully");
      } else {
        const error = await response.json();
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setSavingProduct(false);
    }
  };

  const toggleItemTax = (itemIndex: number, taxId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === itemIndex) {
          const taxSystemIds = item.taxSystemIds.includes(taxId)
            ? item.taxSystemIds.filter(id => id !== taxId)
            : [...item.taxSystemIds, taxId];
          return { ...item, taxSystemIds };
        }
        return item;
      })
    }));
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.lineTotal, 0);
  
  // Calculate tax per item based on selected tax systems for each item
  const totalTax = formData.items.reduce((totalTaxAmount, item) => {
    const itemTax = item.taxSystemIds.reduce((itemTaxSum, taxId) => {
      const tax = taxSystems.find(t => t.id === taxId);
      return itemTaxSum + (tax ? item.lineTotal * tax.rate : 0);
    }, 0);
    return totalTaxAmount + itemTax;
  }, 0);
  
  const total = subtotal + totalTax;
  
  // Get all unique tax systems used across all items for summary display
  const usedTaxSystems = Array.from(new Set(formData.items.flatMap(item => item.taxSystemIds)));

  const validateForm = (): boolean => {
    try {
      const dataToValidate = {
        ...formData,
        dueDate: formData.dueDate === "" ? undefined : formData.dueDate
      };
      invoiceSchema.parse(dataToValidate);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        for (const err of error.issues) {
          if (err.path[0] === "items") {
             const itemIndex = err.path[1];
             const field = err.path[2];
             if (typeof itemIndex === 'number' && field) {
                newErrors[`items.${itemIndex}.${String(field)}`] = err.message;
             } else {
                newErrors["items"] = "Please check item details";
             }
          } else if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        }
        setErrors(newErrors);
        showError("Validation Error", "Please check the form for errors.");
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent, action: 'draft' | 'send' | 'download' = 'draft') => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (!currentBusiness?.id) {
      showError("No Business", "Please select a business first");
      return;
    }

    setLoading(true);
    try {
      const dataToValidate = {
        ...formData,
        dueDate: formData.dueDate === "" ? undefined : formData.dueDate
      };
      const validatedData = invoiceSchema.parse(dataToValidate);
      
      const invoiceData = {
        ...validatedData,
        businessId: currentBusiness.id,
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const invoice = await response.json();
        
        if (action === 'download') {
          await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
          showSuccess("Success", "Invoice created successfully. Downloading PDF...");
          router.push(`/dashboard/invoices/${invoice.id}`);
        } else if (action === 'send') {
          setCreatedInvoice({ id: invoice.id, number: invoice.invoiceNumber });
          setShowEmailDialog(true);
        } else {
          showSuccess("Success", "Invoice draft created successfully");
          router.push(`/dashboard/invoices/${invoice.id}`);
        }
      } else {
        const errorData = await response.json();
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      if (action !== 'send') {
          setLoading(false);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency
    }).format(amount);
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  if (businessLoading) {
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
        <div className="flex items-center space-x-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <Link href="/dashboard/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
            <p className="text-muted-foreground">
              Generate a professional invoice for your customer
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-[var(--brand-cobalt)]/25 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer</CardTitle>
              <User className="h-4 w-4 text-[var(--brand-cobalt)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formData.customerId ? "Selected" : "Required"}</div>
            </CardContent>
          </Card>
          <Card className="border-[var(--brand-teal)]/25 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items</CardTitle>
              <FileText className="h-4 w-4 text-[var(--brand-teal)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formData.items.length}</div>
            </CardContent>
          </Card>
          <Card className="border-[var(--brand-indigo)]/25 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <DollarSign className="h-4 w-4 text-[var(--brand-indigo)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(total)}</div>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Invoice Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer & Dates */}
              <Card className="shadow-sm border-border/80">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Invoice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="customer">Customer <span className="text-red-500">*</span></Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddCustomerDialog(true)}
                          className="h-8 text-xs"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Add New
                        </Button>
                      </div>
                      <Select 
                        value={formData.customerId} 
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, customerId: value }));
                          if(errors.customerId) setErrors(prev => ({...prev, customerId: ""}));
                        }}
                      >
                        <SelectTrigger className={errors.customerId ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex flex-col items-start gap-0">
                                <div className="text-md">{customer.name}</div>
                                {customer.email && (
                                  <div className="text-sm text-muted-foreground">
                                    {customer.email}
                                  </div>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.customerId && (
                        <p className="text-sm text-red-500">{errors.customerId}</p>
                      )}
                    </div>
                    {lastInvoice && !hasAppliedLastInvoice && (
                      <div className="mt-2 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span>Last invoice for this customer is <strong>{lastInvoice.invoiceNumber}</strong>.</span>
                        </div>
                        <Button type="button" size="sm" variant="outline" className="text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 bg-white dark:bg-transparent" onClick={applyLastInvoice}>
                          Autofill Details
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="issueDate">Issue Date <span className="text-red-500">*</span></Label>
                      <Input
                        id="issueDate"
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => {
                           setFormData(prev => ({ ...prev, issueDate: e.target.value }));
                           if(errors.issueDate) setErrors(prev => ({...prev, issueDate: ""}));
                        }}
                        className={errors.issueDate ? "border-red-500" : ""}
                      />
                      {errors.issueDate && (
                        <p className="text-sm text-red-500">{errors.issueDate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, dueDate: e.target.value }));
                          if(errors.dueDate) setErrors(prev => ({...prev, dueDate: ""}));
                        }}
                        className={errors.dueDate ? "border-red-500" : ""}
                      />
                      {errors.dueDate && (
                        <p className="text-sm text-red-500">{errors.dueDate}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card className="shadow-sm border-border/80">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Line Items
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Product <span className="text-red-500">*</span></Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAddProductDialog(true)}
                                className="h-8 text-xs"
                              >
                                <PackagePlus className="h-3 w-3 mr-1" />
                                Add New
                              </Button>
                            </div>
                            <Select
                              value={item.productId || ""}
                              onValueChange={(value) => value && value !== "custom" ? selectProduct(index, value) : updateItem(index, "productId", "")}
                              onOpenChange={(open) => {
                                if (!open) setProductSearchQueries(prev => ({ ...prev, [index]: "" }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a product" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2 sticky top-0 bg-popover z-10 border-b">
                                  <Input 
                                    placeholder="Search products..." 
                                    value={productSearchQueries[index] || ""}
                                    onChange={(e) => setProductSearchQueries(prev => ({ ...prev, [index]: e.target.value }))}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {products
                                  .filter(p => p.name.toLowerCase().includes((productSearchQueries[index] || "").toLowerCase()))
                                  .map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <div className="flex flex-col items-start">
                                      <div className="font-medium">{product.name}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                                {products.filter(p => p.name.toLowerCase().includes((productSearchQueries[index] || "").toLowerCase())).length === 0 && (
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    No products found.
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            {item.productId && productHistories[item.productId]?.hasHistory && (
                              <div className="mt-2 p-2 bg-[var(--brand-cobalt)]/10 border border-[var(--brand-cobalt)]/25 rounded-md text-sm">
                                <div className="font-medium text-[var(--brand-cobalt)]">Last Purchase Price</div>
                                <div className="text-[var(--brand-cobalt)]">
                                  {formatCurrency(productHistories[item.productId].lastPrice || 0)}
                                  {productHistories[item.productId].lastInvoice && (
                                    <span className="text-xs text-[var(--brand-cobalt)] ml-1">
                                      (Invoice {productHistories[item.productId].lastInvoice?.number})
                                    </span>
                                  )}
                                </div>
                                
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Input
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                              className={errors[`items.${index}.description`] ? "border-red-500" : ""}
                            />
                            {errors[`items.${index}.description`] && (
                                <p className="text-xs text-red-500 mt-1">{errors[`items.${index}.description`]}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="1"
                              value={item.quantity || ""}
                              onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                              className={errors[`items.${index}.quantity`] ? "border-red-500" : ""}
                            />
                            {errors[`items.${index}.quantity`] && (
                                <p className="text-xs text-red-500 mt-1">{errors[`items.${index}.quantity`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={item.unitPrice || ""}
                              onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                              className={errors[`items.${index}.unitPrice`] ? "border-red-500" : ""}
                            />
                            {errors[`items.${index}.unitPrice`] && (
                                <p className="text-xs text-red-500 mt-1">{errors[`items.${index}.unitPrice`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Discount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={item.discount || ""}
                              onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                              className={errors[`items.${index}.discount`] ? "border-red-500" : ""}
                            />
                            {errors[`items.${index}.discount`] && (
                                <p className="text-xs text-red-500 mt-1">{errors[`items.${index}.discount`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Line Total</Label>
                            <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md text-sm">
                              {formatCurrency(item.lineTotal)}
                            </div>
                          </div>
                        </div>

                        {/* Tax selection for this item */}
                        {taxSystems.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-sm font-medium">Applicable Taxes</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {taxSystems.map((tax) => (
                                <div key={tax.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`tax-${index}-${tax.id}`}
                                    checked={item.taxSystemIds.includes(tax.id)}
                                    onChange={() => toggleItemTax(index, tax.id)}
                                    className="rounded"
                                  />
                                  <label 
                                    htmlFor={`tax-${index}-${tax.id}`} 
                                    className="flex-1 flex items-center justify-between text-sm cursor-pointer"
                                  >
                                    <span>{tax.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {(tax.rate * 100).toFixed(2)}%
                                    </Badge>
                                  </label>
                                </div>
                              ))}
                            </div>
                            {item.taxSystemIds.length > 0 && (
                              <div className="text-sm text-muted-foreground pt-1">
                                Tax on this item: {formatCurrency(
                                  item.taxSystemIds.reduce((sum, taxId) => {
                                    const tax = taxSystems.find(t => t.id === taxId);
                                    return sum + (tax ? item.lineTotal * tax.rate : 0);
                                  }, 0)
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {errors.items && (
                      <p className="text-sm text-red-500">{errors.items}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes & Terms */}
              <Card className="shadow-sm border-border/80">
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes for the customer..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className={errors.notes ? "border-red-500" : ""}
                    />
                    {errors.notes && (
                      <p className="text-sm text-red-500">{errors.notes}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      placeholder="Payment terms and conditions..."
                      value={formData.terms}
                      onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                      rows={3}
                      className={errors.terms ? "border-red-500" : ""}
                    />
                     {errors.terms && (
                      <p className="text-sm text-red-500">{errors.terms}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoice Summary */}
            <div className="space-y-6">
              {/* Customer Info */}
              {selectedCustomer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="font-medium">{selectedCustomer.name}</div>
                      {selectedCustomer.email && (
                        <div className="text-sm text-muted-foreground">
                          {selectedCustomer.email}
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="text-sm text-muted-foreground">
                          {selectedCustomer.phone}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invoice Totals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>

                    {usedTaxSystems.length > 0 && (
                      <>
                        {usedTaxSystems.map(taxId => {
                          const tax = taxSystems.find(t => t.id === taxId);
                          if (!tax) return null;
                          // Calculate tax across all items that have this tax
                          const taxAmount = formData.items.reduce((sum, item) => {
                            if (item.taxSystemIds.includes(taxId)) {
                              return sum + (item.lineTotal * tax.rate);
                            }
                            return sum;
                          }, 0);
                          return (
                            <div key={taxId} className="flex justify-between text-sm">
                              <span>{tax.name} ({(tax.rate * 100).toFixed(2)}%):</span>
                              <span>{formatCurrency(taxAmount)}</span>
                            </div>
                          );
                        })}
                        <Separator />
                      </>
                    )}

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                      variant="outline"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save as Draft
                        </>
                      )}
                    </Button>

                     <Button 
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={(e) => handleSubmit(e, 'download')}
                      disabled={loading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Save & Download
                    </Button>

                    {currentBusiness?.plan === 'FREE' ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="w-full">
                              <Button 
                                type="button"
                                className="w-full"
                                disabled={true}
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                Save & Send
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Emailing invoices is available on Pro and Enterprise plans.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Button 
                        type="button"
                        className="w-full bg-[var(--brand-cobalt)] text-white hover:bg-[var(--brand-indigo)]"
                        onClick={(e) => handleSubmit(e, 'send')}
                        disabled={loading}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Save & Send
                      </Button>
                    )}

                    <Link href="/dashboard/invoices">
                      <Button variant="ghost" className="w-full">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>

        {/* Add Customer Dialog */}
        <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Create a new customer to add to this invoice
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name <span className="text-red-500">*</span></Label>
                <Input
                  id="customerName"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="customer@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerBillingAddress">Billing Address</Label>
                <Textarea
                  id="customerBillingAddress"
                  value={newCustomer.billingAddress}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, billingAddress: e.target.value }))}
                  placeholder="Enter billing address"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerShippingAddress">Shipping Address</Label>
                <Textarea
                  id="customerShippingAddress"
                  value={newCustomer.shippingAddress}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, shippingAddress: e.target.value }))}
                  placeholder="Enter shipping address (leave empty if same as billing)"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerTaxId">Tax ID</Label>
                  <Input
                    id="customerTaxId"
                    value={newCustomer.taxId}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, taxId: e.target.value }))}
                    placeholder="Tax identification number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerNotes">Notes</Label>
                <Textarea
                  id="customerNotes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the customer"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddCustomerDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddCustomer}
                disabled={savingCustomer}
              >
                {savingCustomer ? "Creating..." : "Create Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Product Dialog */}
        <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product to add to your catalog
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="productName"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productSKU">SKU</Label>
                  <Input
                    id="productSKU"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Product SKU"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescription">Description</Label>
                <Textarea
                  id="productDescription"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Product description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productPrice">Price <span className="text-red-500">*</span></Label>
                  <Input
                    id="productPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price || ""}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productCost">Cost</Label>
                  <Input
                    id="productCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.cost || ""}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productUnit">Unit</Label>
                  <Select
                    value={newProduct.unit}
                    onValueChange={(value) => setNewProduct(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="g">Gram</SelectItem>
                      <SelectItem value="lb">Pound</SelectItem>
                      <SelectItem value="l">Liter</SelectItem>
                      <SelectItem value="ml">Milliliter</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="ft">Feet</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                      <SelectItem value="hrs">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productCategory">Category</Label>
                  <Input
                    id="productCategory"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Product category"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productStock">Stock Quantity</Label>
                  <Input
                    id="productStock"
                    type="number"
                    min="0"
                    value={newProduct.stockQuantity || ""}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productMinStock">Min Stock Level</Label>
                  <Input
                    id="productMinStock"
                    type="number"
                    min="0"
                    value={newProduct.minStockLevel || ""}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {taxSystems.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="productTax">Default Tax</Label>
                  <Select
                    value={newProduct.taxSystemId || "none"}
                    onValueChange={(value) => setNewProduct(prev => ({ ...prev, taxSystemId: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default tax (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No default tax</SelectItem>
                      {taxSystems.map((tax) => (
                        <SelectItem key={tax.id} value={tax.id}>
                          {tax.name} ({(tax.rate * 100).toFixed(2)}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddProductDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddProduct}
                disabled={savingProduct}
              >
                {savingProduct ? "Creating..." : "Create Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {createdInvoice && (
          <InvoiceEmailDialog
            invoiceId={createdInvoice.id}
            invoiceNumber={createdInvoice.number}
            customerEmail={selectedCustomer?.email || ""}
            customerName={selectedCustomer?.name || ""}
            open={showEmailDialog}
            onOpenChange={setShowEmailDialog}
            onSuccess={() => {
              // Redirect handled by dialog or we can do it here
              router.push(`/dashboard/invoices/${createdInvoice.id}`);
            }}
            onCancel={() => {
              router.push(`/dashboard/invoices/${createdInvoice.id}`);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}
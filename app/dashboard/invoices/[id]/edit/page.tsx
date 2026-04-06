"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Save, 
  Plus,
  Trash2,
  Calculator,
  User,
  FileText,
  AlertTriangle,
  Edit
} from "lucide-react";
import Link from "next/link";
import { showError, showSuccess, showConfirm } from "@/lib/alert-store";
import { z } from "zod";
import { invoiceSchema } from "@/lib/validations/invoice";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  taxSystemId?: string;
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

interface InvoiceItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  taxSystemIds: string[]; // Tax systems for this item
  tempId?: string; // For new items before saving
}

interface InvoiceFormData {
  customerId: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  terms: string;
  items: InvoiceItem[];
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { currentBusiness } = useBusinessContext();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxSystems, setTaxSystems] = useState<TaxSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productHistories, setProductHistories] = useState<Record<string, ProductHistory>>({});
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: "",
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    notes: "",
    terms: "",
    items: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productSearchQueries, setProductSearchQueries] = useState<Record<number, string>>({});

  useEffect(() => {
    if (params?.id && currentBusiness?.id) {
      fetchInvoiceData();
    }
  }, [params?.id, currentBusiness?.id]);

  const fetchInvoiceData = async () => {
    try {
      // Fetch invoice
      const invoiceResponse = await fetch(`/api/invoices/${params?.id}?businessId=${currentBusiness?.id}`);
      if (!invoiceResponse.ok) {
        showError("Error", "Something went wrong. Please try again.");
        router.push("/dashboard/invoices");
        return;
      }
      const invoiceData = await invoiceResponse.json();
      setInvoice(invoiceData);

      // Populate form
      setFormData({
        customerId: invoiceData.customer.id,
        issueDate: invoiceData.issueDate.split('T')[0],
        dueDate: invoiceData.dueDate ? invoiceData.dueDate.split('T')[0] : "",
        notes: invoiceData.notes || "",
        terms: invoiceData.terms || "",
        items: invoiceData.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          lineTotal: item.lineTotal,
          taxSystemIds: item.itemTaxes?.map((t: any) => t.taxSystemId) || []
        }))
      });

      // Fetch related data
      await Promise.all([
        fetchCustomers(),
        fetchProducts(),
        fetchTaxSystems()
      ]);
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?businessId=${currentBusiness?.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?businessId=${currentBusiness?.id}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchTaxSystems = async () => {
    try {
      const response = await fetch(`/api/tax-systems?businessId=${currentBusiness?.id}`);
      if (response.ok) {
        const data = await response.json();
        setTaxSystems(data);
      }
    } catch (error) {
      console.error("Error fetching tax systems:", error);
    }
  };

  const calculateLineTotal = (quantity: number, unitPrice: number, discount: number = 0) => {
    return (quantity * unitPrice) - discount;
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
    if (formData.items.length <= 1) return;
    showConfirm(
      "Remove Item",
      "Are you sure you want to remove this item from the invoice?",
      () => {
        setFormData(prev => ({
          ...prev,
          items: prev.items.filter((_, i) => i !== index)
        }));
      }
    );
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
            updatedItem.lineTotal = calculateLineTotal(updatedItem.quantity, updatedItem.unitPrice, updatedItem.discount);
          }
          return updatedItem;
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
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
              taxSystemIds: product.taxSystemId ? [product.taxSystemId] : []
            };
            updatedItem.lineTotal = calculateLineTotal(updatedItem.quantity, updatedItem.unitPrice, updatedItem.discount);
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
        setProductHistories(prev => ({ ...prev, [productId]: data }));
      }
    } catch (error) {
      console.error("Error fetching product history:", error);
    }
  };

  const toggleItemTax = (index: number, taxId: string) => {
    setFormData(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const currentTaxes = item.taxSystemIds || [];
          const newTaxes = currentTaxes.includes(taxId)
            ? currentTaxes.filter((id: string) => id !== taxId)
            : [...currentTaxes, taxId];
          return { ...item, taxSystemIds: newTaxes };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.lineTotal, 0);
    
    // Calculate tax per item based on selected tax systems
    const taxAmount = formData.items.reduce((totalTax, item) => {
      const itemTax = (item.taxSystemIds || []).reduce((itemTaxSum, taxId) => {
        const tax = taxSystems.find(t => t.id === taxId);
        return itemTaxSum + (tax ? item.lineTotal * tax.rate : 0);
      }, 0);
      return totalTax + itemTax;
    }, 0);
    
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

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

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const { subtotal, taxAmount, total } = calculateTotals();
      
      const invoiceData = {
        ...formData,
        subtotal,
        totalTax: taxAmount,
        totalAmount: total,
        items: formData.items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          lineTotal: item.lineTotal,
          taxSystemIds: item.taxSystemIds || []
        }))
      };

      const response = await fetch(`/api/invoices/${params?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        showSuccess("Success", "Invoice updated successfully");
        router.push(`/dashboard/invoices/${params?.id}`);
      } else {
        const errorData = await response.json();
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    showConfirm(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      () => {
        router.push(`/dashboard/invoices/${params?.id}`);
      }
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--brand-cobalt)]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold mt-4">Invoice Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The invoice you're trying to edit could not be found or you don't have permission to edit it.
          </p>
          <Link href="/dashboard/invoices">
            <Button className="mt-4">Back to Invoices</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Check if invoice can be edited
  if (invoice.status !== 'DRAFT') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-16 w-16 text-orange-500" />
          <h2 className="text-2xl font-bold mt-4">Cannot Edit Invoice</h2>
          <p className="text-muted-foreground mt-2">
            This invoice has status "{invoice.status}" and cannot be edited.
            Only draft invoices can be modified.
          </p>
          <Link href={`/dashboard/invoices/${params?.id}`}>
            <Button className="mt-4">View Invoice</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Edit Invoice #{invoice.invoiceNumber}
              </h1>
              <p className="text-muted-foreground">
                Make changes to your draft invoice
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline">Draft</Badge>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[var(--brand-cobalt)] text-white hover:bg-[var(--brand-indigo)]">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Details */}
            <Card className="shadow-sm border-border/80">
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>
                  Set the basic information for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer <span className="text-red-500">*</span></Label>
                    <Select value={formData.customerId} onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, customerId: value }));
                      if (errors.customerId) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.customerId;
                          return newErrors;
                        });
                      }
                    }}>
                      <SelectTrigger className={errors.customerId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{customer.name}</span>
                              {customer.email && (
                                <span className="text-xs text-muted-foreground">- {customer.email}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customerId && <p className="text-sm text-red-500">{errors.customerId}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, issueDate: e.target.value }));
                        if (errors.issueDate) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.issueDate;
                            return newErrors;
                          });
                        }
                      }}
                      required
                      className={errors.issueDate ? "border-red-500" : ""}
                    />
                    {errors.issueDate && <p className="text-sm text-red-500">{errors.issueDate}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, dueDate: e.target.value }));
                      if (errors.dueDate) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.dueDate;
                          return newErrors;
                        });
                      }
                    }}
                    className={errors.dueDate ? "border-red-500" : ""}
                  />
                  {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="shadow-sm border-border/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>
                      Add products or services to this invoice
                    </CardDescription>
                  </div>
                  <Button type="button" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-y">
                          <TableHead className="w-[30%] min-w-[220px] h-12">PRODUCT / ACCOUNT</TableHead>
                          <TableHead className="w-[20%] min-w-[150px] h-12">DESCRIPTION</TableHead>
                          <TableHead className="w-[100px] min-w-[100px] h-12">QTY</TableHead>
                          <TableHead className="w-[120px] min-w-[120px] h-12">PRICE</TableHead>
                          <TableHead className="w-[100px] min-w-[100px] h-12">DISC.</TableHead>
                          {taxSystems.length > 0 && <TableHead className="w-[140px] min-w-[140px] h-12">TAX</TableHead>}
                          <TableHead className="w-[120px] min-w-[120px] text-right h-12">TOTAL</TableHead>
                          <TableHead className="w-[60px] min-w-[60px] text-center h-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item, index) => {
                          const idError = errors["items." + index + ".productId"];
                          const descError = errors["items." + index + ".description"];
                          const qtyError = errors["items." + index + ".quantity"];
                          const priceError = errors["items." + index + ".unitPrice"];
                          const discError = errors["items." + index + ".discount"];
                          
                          return (
                            <TableRow key={index} className="group border-b">
                              <TableCell className="align-top p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={item.productId || ""}
                                      onValueChange={(value) => value && value !== "custom" ? selectProduct(index, value) : updateItem(index, "productId", "")}
                                      onOpenChange={(open) => {
                                        if (!open) setProductSearchQueries(prev => ({ ...prev, [index]: "" }));
                                      }}
                                    >
                                      <SelectTrigger className={"w-full " + (idError ? "border-red-500" : "")}>
                                        <SelectValue placeholder="Select Product" />
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
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">{product.name}</span>
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
                                  </div>
                                  {item.productId && productHistories[item.productId]?.hasHistory && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground ml-1">
                                      <span>Last Purchase:</span>
                                      <span className="font-medium">${(productHistories[item.productId].lastPrice || 0).toFixed(2)}</span>
                                    </div>
                                  )}
                                  {idError && typeof idError === 'string' && <p className="text-xs text-red-500 mt-1">{idError}</p>}
                                </div>
                              </TableCell>
  
                              <TableCell className="align-top p-3">
                                <Input
                                  placeholder="-"
                                  value={item.description}
                                  onChange={(e) => updateItem(index, "description", e.target.value)}
                                  className={"w-full bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background transition-all " + (descError ? "border-red-500 bg-background" : "")}
                                />
                                {descError && typeof descError === 'string' && <p className="text-xs text-red-500 mt-1">{descError}</p>}
                              </TableCell>
  
                              <TableCell className="align-top p-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  placeholder="1"
                                  value={item.quantity || ""}
                                  onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                                  className={"w-full " + (qtyError ? "border-red-500" : "")}
                                />
                                {qtyError && typeof qtyError === 'string' && <p className="text-xs text-red-500 mt-1">{qtyError}</p>}
                              </TableCell>
  
                              <TableCell className="align-top p-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={item.unitPrice || ""}
                                  onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                  className={"w-full " + (priceError ? "border-red-500" : "")}
                                />
                                {priceError && typeof priceError === 'string' && <p className="text-xs text-red-500 mt-1">{priceError}</p>}
                              </TableCell>
  
                              <TableCell className="align-top p-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={item.discount || ""}
                                  onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                                  className={"w-full bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background transition-all " + (discError ? "border-red-500 bg-background" : "")}
                                />
                                {discError && typeof discError === 'string' && <p className="text-xs text-red-500 mt-1">{discError}</p>}
                              </TableCell>
  
                              {taxSystems.length > 0 && (
                                <TableCell className="align-top p-3">
                                  <div className="space-y-2">
                                    <div className="mt-1">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" className="h-8 w-full justify-between px-2 text-xs">
                                            <span className="truncate">
                                              {item.taxSystemIds.length > 0
                                                ? `${item.taxSystemIds.length} Selected`
                                                : "Select Tax"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground ml-1">▼</span>
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[180px]">
                                          {taxSystems.map((tax) => {
                                            const isSelected = item.taxSystemIds.includes(tax.id);
                                            return (
                                              <DropdownMenuCheckboxItem
                                                key={tax.id}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleItemTax(index, tax.id)}
                                              >
                                                {tax.name} ({(tax.rate * 100).toFixed(0)}%)
                                              </DropdownMenuCheckboxItem>
                                            );
                                          })}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    {item.taxSystemIds.length > 0 && (
                                      <div className="text-[10px] text-muted-foreground font-medium">
                                        Tax: ${(
                                          item.taxSystemIds.reduce((sum, taxId) => {
                                            const tax = taxSystems.find(t => t.id === taxId);
                                            return sum + (tax ? item.lineTotal * tax.rate : 0);
                                          }, 0)
                                        ).toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              )}
  
                              <TableCell className="align-top p-3 text-right">
                                <div className="font-medium py-2">
                                  ${item.lineTotal.toFixed(2)}
                                </div>
                              </TableCell>
  
                              <TableCell className="align-top p-3 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-100 mt-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(index)}
                                    disabled={formData.items.length === 1}
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {errors.items && typeof errors.items === 'string' && (
                    <div className="p-4 border-t">
                      <p className="text-sm text-red-500 font-medium">{errors.items}</p>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            <Card className="shadow-sm border-border/80">
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Add notes and terms for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes for this invoice..."
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

          {/* Invoice Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>

                  {taxAmount > 0 && (
                    <>
                      <div className="space-y-1">
                        {formData.items.map((item, idx) => {
                          const itemTaxes = (item.taxSystemIds || []).map(taxId => {
                            const tax = taxSystems.find(t => t.id === taxId);
                            return tax ? { tax, amount: item.lineTotal * tax.rate } : null;
                          }).filter(Boolean);
                          
                          if (itemTaxes.length === 0) return null;
                          
                          return (
                            <div key={idx} className="text-sm text-muted-foreground">
                              {itemTaxes.map((taxInfo: any, tIdx) => (
                                <div key={tIdx} className="flex justify-between">
                                  <span>{taxInfo.tax.name}:</span>
                                  <span>${taxInfo.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            {formData.customerId && (
              <Card className="shadow-sm border-border/80">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const customer = customers.find(c => c.id === formData.customerId);
                    return customer ? (
                      <div className="space-y-1">
                        <div className="font-medium">{customer.name}</div>
                        {customer.email && (
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        )}
                        {customer.phone && (
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

              </div>
    </DashboardLayout>
  );
}
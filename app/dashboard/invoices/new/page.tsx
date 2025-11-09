"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showError, showSuccess } from "@/lib/alert-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Plus, 
  Trash2,
  User,
  FileText
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.001, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  discount: z.number().min(0).default(0)
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  issueDate: z.date(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default("USD"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required")
});

type InvoiceFormData = {
  customerId: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  terms: string;
  currency: string;
  items: {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    lineTotal: number;
    taxSystemIds: string[]; // Tax systems for this specific item
  }[];
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

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxSystems, setTaxSystems] = useState<TaxSystem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: searchParams?.get("customerId") || "",
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    notes: "",
    terms: "",
    currency: "USD",
    items: [{
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      lineTotal: 0,
      taxSystemIds: []
    }]
  });

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchData();
    }
  }, [currentBusiness?.id]);

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
      setFormData(prev => ({
        ...prev,
        items: prev.items.map((item, i) => {
          if (i === index) {
            const updatedItem = {
              ...item,
              productId: productId,
              description: product.name,
              unitPrice: product.price
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

  const handleSubmit = async (e: React.FormEvent, saveAs: 'draft' | 'sent' = 'draft') => {
    e.preventDefault();
    
    if (!formData.customerId) {
      setErrors({ customer: "Please select a customer" });
      return;
    }

    if (formData.items.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      setErrors({ items: "Please complete all item details" });
      return;
    }

    if (!currentBusiness?.id) {
      showError("No Business", "Please select a business first");
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        businessId: currentBusiness.id,
        customerId: formData.customerId,
        issueDate: formData.issueDate ? new Date(formData.issueDate) : new Date(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        notes: formData.notes,
        terms: formData.terms,
        currency: formData.currency,
        items: formData.items.map(item => ({
          productId: item.productId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxSystemIds: item.taxSystemIds // Include item-level taxes
        }))
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
        
        // Update status if sending (no longer need separate tax application)
        if (saveAs === 'sent') {
          await fetch(`/api/invoices/${invoice.id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "SENT" }),
          });
        }

        showSuccess("Success", `Invoice ${saveAs === 'sent' ? 'created and sent' : 'created as draft'} successfully`);
        router.push(`/dashboard/invoices/${invoice.id}`);
      } else {
        const errorData = await response.json();
        showError("Error", errorData.error || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      showError("Error", "Error creating invoice");
    } finally {
      setLoading(false);
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
        <div className="flex items-center space-x-4">
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

        <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Invoice Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer & Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Invoice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer *</Label>
                      <Select value={formData.customerId} onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div>
                                <div className="font-medium">{customer.name}</div>
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
                      {errors.customer && (
                        <p className="text-sm text-red-500">{errors.customer}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="issueDate">Issue Date</Label>
                      <Input
                        id="issueDate"
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
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
                            <Label>Product (Optional)</Label>
                            <Select
                              value={item.productId || ""}
                              onValueChange={(value) => value && value !== "custom" ? selectProduct(index, value) : updateItem(index, "productId", "")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a product" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">Custom item</SelectItem>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <div>
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {formatCurrency(product.price)} per {product.unit}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Description *</Label>
                            <Input
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                            />
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
                            />
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
                            />
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
                            />
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
              <Card>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      placeholder="Payment terms and conditions..."
                      value={formData.terms}
                      onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                      rows={3}
                    />
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
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
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
                      onClick={(e) => handleSubmit(e, 'sent')}
                      disabled={loading}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Save & Send
                    </Button>

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
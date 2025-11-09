"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  ArrowLeft, 
  Save, 
  Plus,
  Trash2,
  Calculator,
  User,
  FileText,
  AlertTriangle,
  X,
  Edit
} from "lucide-react";
import Link from "next/link";
import { showError, showSuccess, showConfirm } from "@/lib/alert-store";

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
  const { data: session } = useSession();
  const { currentBusiness } = useBusinessContext();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxSystems, setTaxSystems] = useState<TaxSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: "",
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    notes: "",
    terms: "",
    items: []
  });

  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    description: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    taxSystemIds: []
  });

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
        showError("Error", "Failed to load invoice");
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
      showError("Error", "Failed to load invoice data");
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
    if (!newItem.description || !newItem.quantity || !newItem.unitPrice) {
      showError("Validation Error", "Please fill in all required fields");
      return;
    }

    const lineTotal = calculateLineTotal(
      newItem.quantity || 0,
      newItem.unitPrice || 0,
      newItem.discount || 0
    );

    const item: InvoiceItem = {
      tempId: `temp_${Date.now()}`,
      productId: newItem.productId,
      description: newItem.description || "",
      quantity: newItem.quantity || 0,
      unitPrice: newItem.unitPrice || 0,
      discount: newItem.discount || 0,
      lineTotal,
      taxSystemIds: newItem.taxSystemIds || []
    };

    if (editingItemIndex !== null) {
      const updatedItems = [...formData.items];
      updatedItems[editingItemIndex] = { ...updatedItems[editingItemIndex], ...item };
      setFormData(prev => ({ ...prev, items: updatedItems }));
      setEditingItemIndex(null);
    } else {
      setFormData(prev => ({ ...prev, items: [...prev.items, item] }));
    }

    setNewItem({
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxSystemIds: []
    });
    setShowProductDialog(false);
  };

  const editItem = (index: number) => {
    const item = formData.items[index];
    setNewItem({
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxSystemIds: item.taxSystemIds || []
    });
    setEditingItemIndex(index);
    setShowProductDialog(true);
  };

  const removeItem = (index: number) => {
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

  const selectProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setNewItem(prev => ({
        ...prev,
        productId: product.id,
        description: product.name,
        unitPrice: product.price,
        taxSystemIds: product.taxSystemId ? [product.taxSystemId] : []
      }));
    }
  };

  const toggleItemTax = (taxId: string) => {
    setNewItem(prev => {
      const currentTaxes = prev.taxSystemIds || [];
      const newTaxes = currentTaxes.includes(taxId)
        ? currentTaxes.filter(id => id !== taxId)
        : [...currentTaxes, taxId];
      return { ...prev, taxSystemIds: newTaxes };
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

  const validateForm = () => {
    if (!formData.customerId) {
      showError("Validation Error", "Please select a customer");
      return false;
    }
    if (!formData.issueDate) {
      showError("Validation Error", "Please select an issue date");
      return false;
    }
    if (formData.items.length === 0) {
      showError("Validation Error", "Please add at least one item to the invoice");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

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
        showError("Error", errorData.error || "Failed to update invoice");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      showError("Error", "Failed to update invoice");
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
            <Button onClick={handleSave} disabled={saving}>
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
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>
                  Set the basic information for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer *</Label>
                    <Select value={formData.customerId} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, customerId: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              {customer.email && (
                                <div className="text-xs text-muted-foreground">{customer.email}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date *</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      required
                    />
                  </div>
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
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>
                      Add products or services to this invoice
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowProductDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.items.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No items added</h3>
                    <p className="text-muted-foreground">
                      Add your first item to get started
                    </p>
                    <Button className="mt-4" onClick={() => setShowProductDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={item.id || item.tempId}>
                          <TableCell>
                            <div className="font-medium">{item.description}</div>
                            {item.taxSystemIds && item.taxSystemIds.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Taxes: {item.taxSystemIds.map((taxId, idx) => {
                                  const tax = taxSystems.find(t => t.id === taxId);
                                  return tax ? (
                                    <span key={taxId}>
                                      {idx > 0 && ", "}
                                      {(tax.rate * 100).toFixed(2)}%
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            ${item.unitPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.discount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${item.lineTotal.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editItem(index)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            <Card>
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
              <Card>
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

        {/* Add/Edit Item Dialog */}
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItemIndex !== null ? "Edit Item" : "Add Item"}
              </DialogTitle>
              <DialogDescription>
                Add or edit an item for this invoice
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Product Selection */}
              <div className="space-y-2">
                <Label>Select Product (Optional)</Label>
                <Select value={newItem.productId || ""} onValueChange={selectProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product or enter manually" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            ${product.price.toFixed(2)} per {product.unit}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Manual Item Entry */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Item description"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.discount}
                    onChange={(e) => setNewItem(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Line Total</Label>
                  <div className="px-3 py-2 border rounded-md bg-muted">
                    ${calculateLineTotal(
                      newItem.quantity || 0,
                      newItem.unitPrice || 0,
                      newItem.discount || 0
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Tax Selection */}
              {taxSystems.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-sm font-medium">Applicable Taxes</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {taxSystems.map((tax) => (
                      <div key={tax.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`tax-${tax.id}`}
                          checked={(newItem.taxSystemIds || []).includes(tax.id)}
                          onChange={() => toggleItemTax(tax.id)}
                          className="rounded"
                        />
                        <label 
                          htmlFor={`tax-${tax.id}`} 
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
                  {(newItem.taxSystemIds || []).length > 0 && (
                    <div className="text-sm text-muted-foreground pt-1">
                      Tax on this item: ${
                        (newItem.taxSystemIds || []).reduce((sum, taxId) => {
                          const tax = taxSystems.find(t => t.id === taxId);
                          const lineTotal = calculateLineTotal(
                            newItem.quantity || 0,
                            newItem.unitPrice || 0,
                            newItem.discount || 0
                          );
                          return sum + (tax ? lineTotal * tax.rate : 0);
                        }, 0).toFixed(2)
                      }
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProductDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addItem}>
                {editingItemIndex !== null ? "Update Item" : "Add Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
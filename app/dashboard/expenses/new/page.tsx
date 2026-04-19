"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showError, showSuccess } from "@/lib/alert-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Save, PlusCircle, CreditCard, AlignLeft, Receipt } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function NewExpensePage() {
  const router = useRouter();
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    categoryId: "uncategorized",
    description: "",
    paymentMethod: "CASH",
    reference: ""
  });

  // Adding new category state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchCategories();
    }
  }, [currentBusiness?.id]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/expense-categories?businessId=${currentBusiness?.id}`);
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showError("Error", "Category name cannot be empty");
      return;
    }
    
    try {
      setAddingCategory(true);
      const res = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: currentBusiness?.id,
          name: newCategoryName
        })
      });

      if (res.ok) {
        const newlyCreated = await res.json();
        setCategories([...categories, newlyCreated]);
        setFormData({ ...formData, categoryId: newlyCreated.id });
        setIsCategoryDialogOpen(false);
        setNewCategoryName("");
        showSuccess("Success", "Category added");
      } else {
        const err = await res.json();
        showError("Error", err.error || "Failed to create category");
      }
    } catch (error) {
       console.error("Failed to add category:", error);
       showError("Error", "An unexpected error occurred");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness?.id) return;
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      showError("Validation Error", "Please enter a valid amount");
      return;
    }

    if (!formData.description.trim()) {
      showError("Validation Error", "Please provide a description");
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        businessId: currentBusiness.id,
        amount: Number(formData.amount),
        date: formData.date,
        description: formData.description,
        categoryId: formData.categoryId === "uncategorized" ? null : formData.categoryId,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        currency: currentBusiness.currency
      };

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showSuccess("Success", "Expense recorded successfully!");
        router.push("/dashboard/expenses");
      } else {
        const errorData = await res.json();
        showError("Error", errorData.error || "Failed to save expense");
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      showError("Error", "Something went wrong saving your expense");
    } finally {
      setLoading(false);
    }
  };

  if (businessLoading) return null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <Link href="/dashboard/expenses">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Record Expense</h1>
            <p className="text-sm text-muted-foreground">Log an outbound payment from your business</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-border/80 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Expense Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="date">Date of Expense <span className="text-red-500">*</span></Label>
                  <Input 
                    id="date" 
                    type="date" 
                    required 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="space-y-2.5">
                   <Label htmlFor="amount">Amount ({currentBusiness?.currency || "USD"}) <span className="text-red-500">*</span></Label>
                   <Input 
                     id="amount" 
                     type="number" 
                     step="0.01" 
                     min="0.01"
                     placeholder="0.00" 
                     required
                     value={formData.amount}
                     onChange={e => setFormData({...formData, amount: e.target.value})}
                   />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="description" className="flex items-center gap-2">
                   Description <span className="text-red-500">*</span>
                </Label>
                <Textarea 
                  id="description" 
                  placeholder="e.g. Office supplies for the month" 
                  required
                  rows={2}
                  className="resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="category">Category</Label>
                    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                       <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-[var(--brand-cobalt)] hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40">
                             <PlusCircle className="h-3 w-3 mr-1" /> New Category
                          </Button>
                       </DialogTrigger>
                       <DialogContent className="sm:max-w-[400px]">
                         <DialogHeader>
                           <DialogTitle>Add Expense Category</DialogTitle>
                           <DialogDescription>Create a new category bucket to track your spending.</DialogDescription>
                         </DialogHeader>
                         <div className="py-4 space-y-3">
                            <Label>Category Name</Label>
                            <Input 
                               placeholder="e.g., Software Subscriptions" 
                               value={newCategoryName}
                               onChange={(e) => setNewCategoryName(e.target.value)}
                               onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                               autoFocus
                            />
                         </div>
                         <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddCategory} disabled={addingCategory} className="bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                               {addingCategory ? "Saving..." : "Save Category"}
                            </Button>
                         </DialogFooter>
                       </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized" className="text-muted-foreground italic">Uncategorized</SelectItem>
                      {categories.map(cat => (
                         <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                   <Label htmlFor="paymentMethod">Payment Method <span className="text-red-500">*</span></Label>
                   <Select value={formData.paymentMethod} onValueChange={(val) => setFormData({...formData, paymentMethod: val})}>
                      <SelectTrigger id="paymentMethod">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="CASH">Cash</SelectItem>
                         <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                         <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                         <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                         <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                         <SelectItem value="CHECK">Check</SelectItem>
                         <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
              </div>

              <div className="space-y-2.5">
                 <Label htmlFor="reference">Reference / Receipt Number (Optional)</Label>
                 <Input 
                   id="reference" 
                   placeholder="e.g. TXN-1928374" 
                   value={formData.reference}
                   onChange={e => setFormData({...formData, reference: e.target.value})}
                 />
              </div>

            </CardContent>
            <div className="p-4 bg-muted/20 border-t flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white px-6 w-full sm:w-auto"
              >
                {loading ? (
                  <span className="flex items-center"><div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" /> Saving...</span>
                ) : (
                  <span className="flex items-center"><Save className="h-4 w-4 mr-2" /> Save Expense</span>
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}

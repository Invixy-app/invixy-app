"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showError, showSuccess } from "@/lib/alert-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Receipt,
  TrendingDown,
  Calendar,
  CreditCard,
  MoreHorizontal,
  Edit,
  Trash2,
  Wallet
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExpenseCategory {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  amount: string; // from Prisma standard
  currency: string;
  date: string;
  description: string;
  paymentMethod: string;
  status: string;
  category?: ExpenseCategory | null;
  creator?: {
    name: string | null;
  } | null;
}

export default function ExpensesPage() {
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchExpenses();
    }
  }, [currentBusiness?.id]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredExpenses(
        expenses.filter(e => 
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredExpenses(expenses);
    }
  }, [searchQuery, expenses]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/expenses?businessId=${currentBusiness?.id}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
        setFilteredExpenses(data);
      } else {
        showError("Error", "Failed to load expenses.");
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      showError("Error", "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/expenses/${id}?businessId=${currentBusiness?.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        showSuccess("Success", "Expense deleted successfully");
        setExpenses(prev => prev.filter(e => e.id !== id));
      } else {
        showError("Error", "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      showError("Error", "Something went wrong.");
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentBusiness?.currency || 'USD'
    }).format(numericAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  if (businessLoading) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Expenses
            </h1>
            <p className="text-sm text-muted-foreground mt-1 ml-14">
              Track and categorize your outbound cashflow
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link href="/dashboard/expenses/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[var(--brand-cobalt)] text-white hover:bg-[var(--brand-indigo)] shadow-md hover:shadow-lg transition-all rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Record Expense
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/60 shadow-sm bg-gradient-to-br from-red-50/50 to-white dark:from-red-950/20 dark:to-zinc-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Total Expenses
                <Wallet className="h-4 w-4 text-red-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(totalExpense)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all logged time</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Expense Records
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {expenses.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total transactions logged</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="shadow-sm border-border/80 overflow-hidden rounded-xl">
          <div className="p-4 bg-muted/20 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search descriptions or categories..."
                className="pl-9 bg-background w-full rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <CardContent className="p-0 border-none">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cobalt)]"></div>
              </div>
            ) : filteredExpenses.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(expense.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{expense.description}</div>
                        {expense.creator?.name && (
                           <div className="text-xs text-muted-foreground">Logged by {expense.creator.name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.category ? (
                          <Badge variant="secondary" className="font-normal bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {expense.category.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Uncategorized</span>
                        )}
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1.5 text-sm">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="capitalize">{expense.paymentMethod.replace(/_/g, ' ').toLowerCase()}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-foreground">
                           {formatCurrency(expense.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => deleteExpense(expense.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Expense
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16 px-4">
                <div className="bg-muted border border-border rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                   <TrendingDown className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No expenses recorded</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto mt-2 text-sm">
                  Track your business costs easily. Record your first expense to see it here!
                </p>
                <Link href="/dashboard/expenses/new">
                   <Button className="bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] rounded-xl">Record Expense</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

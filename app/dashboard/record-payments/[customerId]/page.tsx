"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useBusinessContext } from "@/components/business-context"
import { ArrowLeft, Loader2, CalendarIcon, Search, Filter } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { formatCurrency, getCurrencySymbol } from "@/lib/utils"

export default function CustomerInvoicesPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const customerId = params.customerId as string
  const initialInvoiceId = searchParams.get("invoiceId")

  const { status } = useSession()
  const { currentBusiness } = useBusinessContext()
  
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [customerName, setCustomerName] = useState("Customer")
  const [activeTab, setActiveTab] = useState("pending")
  const [payments, setPayments] = useState<any[]>([])
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false)
  
  // Sheet state
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  
  // Payment form state
  const [payAmount, setPayAmount] = useState("")
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0])
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER")
  const [depositTo, setDepositTo] = useState("chase_checking")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")

  // Demo asset accounts for the UI
  const assetAccounts = [
    { id: "chase_checking", name: "Chase Checking" },
    { id: "stripe_balance", name: "Stripe Balance" },
    { id: "cash_drawer", name: "Cash Drawer" },
  ]

  const fetchInvoices = async () => {
    if (!currentBusiness?.id || !customerId) return
    try {
      setIsLoading(true)
      const res = await fetch(`/api/record-payments/customers/${customerId}/invoices?businessId=${currentBusiness.id}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
        
        if (initialInvoiceId && data.length > 0) {
          const inv = data.find((i: any) => i.id === initialInvoiceId)
          if (inv) handleOpenSheet(inv)
        }
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPayments = async () => {
    if (!currentBusiness?.id || !customerId) return
    try {
      setIsPaymentsLoading(true)
      const res = await fetch(`/api/record-payments/customers/${customerId}/payments?businessId=${currentBusiness.id}`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data)
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error)
    } finally {
      setIsPaymentsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchInvoices()
    }
  }, [currentBusiness?.id, customerId, status])

  useEffect(() => {
    if (status === "authenticated" && activeTab === "history") {
      fetchPayments()
    }
  }, [currentBusiness?.id, customerId, status, activeTab])

  const handleOpenSheet = (invoice: any) => {
    setSelectedInvoice(invoice)
    setPayAmount(invoice.balanceDue.toString())
    setPayDate(new Date().toISOString().split("T")[0])
    setPayMethod("BANK_TRANSFER")
    setIsSheetOpen(true)
  }

  const handleFullPayment = () => {
    if (selectedInvoice) {
      setPayAmount(selectedInvoice.balanceDue.toString())
    }
  }

  const handleSubmitPayment = async () => {
    if (!selectedInvoice || !payAmount) return
    
    setIsSubmitting(true)
    try {
      // POST to existing payment endpoint
      const res = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentDate: new Date(payDate).toISOString(),
          method: payMethod,
          notes: `${notes} (Deposited to: ${assetAccounts.find(a => a.id === depositTo)?.name || depositTo})`.trim(),
        })
      })

      if (res.ok) {
        setIsSheetOpen(false)
        setSelectedInvoice(null)
        // Refresh the table
        await fetchInvoices()
        if (activeTab === "history") {
          await fetchPayments()
        }
      } else {
        const err = await res.json()
        alert(`Error: ${err.error || 'Failed to record payment'}`)
      }
    } catch (error) {
      console.error("Payment submission error:", error)
      alert("Failed to submit payment due to a network error.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate totals
  const totalBalance = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0)
  const currencyStr = invoices[0]?.currency || "USD"

  // Apply filters
  const filteredInvoices = invoices.filter((inv) => {
    // Some basic safeguarding, assume the ID or a short 'INV-001' string acts as invoice number. 
    // Usually inv.id or an invoiceNumber field exists
    const invIdDisplay = (inv.invoiceNumber || inv.id || "").toLowerCase()
    if (searchQuery && !invIdDisplay.includes(searchQuery.toLowerCase())) {
      return false
    }
    
    if (filterStatus !== "ALL") {
      const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== "PAID"
      if (filterStatus === "OVERDUE" && !isOverdue) return false
      if (filterStatus === "UPCOMING" && isOverdue) return false
    }
    return true
  })

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/record-payments")} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Pending Invoices</h1>
            <p className="text-muted-foreground">Click on an invoice to record a partial or full payment.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList>
            <TabsTrigger value="pending">Pending Invoices</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="m-0">
            <Card className="shadow-sm border-border/80">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>Invoices for Payment</CardTitle>
                  <CardDescription>
                    Outstanding debts for this customer
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-muted-foreground block">Total Open Balance</span>
                  <span className="text-3xl font-bold">{formatCurrency(totalBalance, currencyStr)}</span>
                </div>
              </CardHeader>
              <div className="px-6 flex flex-col sm:flex-row border-b pb-4 gap-4 items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Invoice #"
                className="pl-9 bg-background/50 focus-within:bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center w-full sm:w-auto ml-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val)}>
                <SelectTrigger className="w-[160px] bg-background/50">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Invoices</SelectItem>
                  <SelectItem value="OVERDUE">Overdue Only</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                 <Loader2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">No Pending Invoices</h3>
              <p className="text-muted-foreground mt-2">This customer has no pending balance remaining.</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-16 px-6 bg-muted/20 rounded-xl m-6 border border-dashed border-border/50">
              <h3 className="text-lg font-semibold text-foreground">No matches found</h3>
              <p className="text-muted-foreground mt-1 mb-4">We couldn&apos;t find pending invoices matching your search filters.</p>
              <Button variant="outline" onClick={() => {setSearchQuery(""); setFilterStatus("ALL")}}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-foreground">Invoice #</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-foreground border-l border-border/30">Issue Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                    <TableHead className="text-right font-semibold text-foreground border-l border-border/30">Total Amount</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Balance Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => {
                    const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== "PAID";
                    const displayStatus = isOverdue ? "OVERDUE" : inv.status.replace("_", " ");
                    
                    return (
                    <TableRow 
                      key={inv.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOpenSheet(inv)}
                    >
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={cn({
                            "bg-red-100 text-red-800 hover:bg-red-200": isOverdue,
                            "bg-blue-100 text-blue-800 hover:bg-blue-200": !isOverdue && inv.status === "SENT",
                            "bg-orange-100 text-orange-800 hover:bg-orange-200": !isOverdue && inv.status === "PARTIALLY_PAID"
                          })}
                        >
                          {displayStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell className={cn(
                        isOverdue ? "text-red-500 font-medium" : ""
                      )}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.totalAmount, inv.currency)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(inv.balanceDue, inv.currency)}</TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="m-0">
            <Card className="shadow-sm border-border/80">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Records of past successful transfers and payments</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isPaymentsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">No recorded payments</h3>
                    <p className="text-muted-foreground mt-2">Past payments for this customer will appear here.</p>
                  </div>
                ) : (
                  <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="font-semibold text-foreground">Date</TableHead>
                          <TableHead className="font-semibold text-foreground">Invoice #</TableHead>
                          <TableHead className="font-semibold text-foreground">Amount</TableHead>
                          <TableHead className="font-semibold text-foreground">Method</TableHead>
                          <TableHead className="font-semibold text-foreground">Reference/Notes</TableHead>
                          <TableHead className="font-semibold text-foreground">Recorded By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                            <TableCell>{payment.invoiceNumber}</TableCell>
                            <TableCell className="font-bold text-emerald-600">{formatCurrency(payment.amount, payment.currency)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-muted/50">
                                {payment.paymentMethod.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[250px] truncate" title={payment.notes || payment.reference || "-"}>
                              {payment.notes || payment.reference || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{payment.createdBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Payment Action Drawer */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto sm:px-10 px-6 py-8">
          <SheetHeader className="mb-6 border-b pb-6">
            <SheetTitle className="text-2xl font-bold">Record Payment</SheetTitle>
            <SheetDescription className="text-base">
              {selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : ''}
            </SheetDescription>
          </SheetHeader>

          {selectedInvoice && (
            <div className="space-y-8">
              {/* Summary Block */}
              <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Remaining Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(selectedInvoice.balanceDue, selectedInvoice.currency)}
                  </p>
                </div>
                <Badge variant="outline" className={cn(
                  "text-sm px-3 py-1.5 shadow-sm",
                  (selectedInvoice.dueDate && new Date(selectedInvoice.dueDate) < new Date() && selectedInvoice.status !== "PAID")
                    ? "bg-red-100 text-red-800 border-red-200" 
                    : "bg-background"
                )}>
                  {(selectedInvoice.dueDate && new Date(selectedInvoice.dueDate) < new Date() && selectedInvoice.status !== "PAID") 
                    ? "OVERDUE" 
                    : selectedInvoice.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Form elements */}
              <div className="space-y-5 px-1">
                <div className="space-y-3">
                  <Label htmlFor="payment-date" className="text-sm font-semibold">Payment Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="payment-date" 
                      type="date" 
                      className="pl-10 h-11 bg-background" 
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="payment-amount" className="text-sm font-semibold">Payment Amount</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleFullPayment}
                      className="h-8 px-3 text-xs font-semibold hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
                    >
                      Fill Remaining
                    </Button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-muted-foreground font-medium">{getCurrencySymbol(selectedInvoice.currency)}</span>
                    <Input 
                      id="payment-amount" 
                      type="number" 
                      min="0.01"
                      step="0.01" 
                      max={selectedInvoice.balanceDue}
                      className="pl-9 h-12 font-semibold text-lg bg-background" 
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Label htmlFor="payment-method" className="text-sm font-semibold">Payment Method</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger id="payment-method" className="h-11 bg-background">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2">
                  <Label htmlFor="deposit-to" className="text-sm font-semibold">Deposit To <span className="text-xs font-normal text-muted-foreground ml-1">(Asset Account)</span></Label>
                  <Select value={depositTo} onValueChange={setDepositTo}>
                    <SelectTrigger id="deposit-to" className="h-11 bg-background">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetAccounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2 pb-4">
                  <Label htmlFor="notes" className="text-sm font-semibold">Notes & Reference</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="E.g., Check #1234, Transfer ID..."
                    rows={4}
                    className="resize-none bg-background placeholder:text-muted-foreground/60"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="mt-8 flex-col sm:flex-row gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmitPayment}
              disabled={isSubmitting || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > (selectedInvoice?.balanceDue || 0)}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      </div>
    </DashboardLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useBusinessContext } from "@/components/business-context"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AlertCircle, ArrowRight, Loader2, DollarSign, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

export default function RecordPaymentsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { currentBusiness, isLoading: isBusinessLoading } = useBusinessContext()
  
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOverdue, setFilterOverdue] = useState("ALL")

  useEffect(() => {
    async function fetchCustomers() {
      if (!currentBusiness?.id || status !== "authenticated") return
      try {
        setIsLoading(true)
        const res = await fetch(`/api/record-payments/customers?businessId=${currentBusiness.id}`)
        if (res.ok) {
          const data = await res.json()
          setCustomers(data)
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCustomers()
  }, [currentBusiness?.id, status])

  if (isBusinessLoading || status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cobalt)]"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentBusiness) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Business Selected</h3>
            <p className="text-muted-foreground mb-4">Please select a business to record payments.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const filteredCustomers = customers.filter(customer => {
    if (searchQuery && !customer.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(customer.email || "").toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterOverdue === "OVERDUE" && !customer.hasOverdue) {
      return false
    }
    return true
  })

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Record Payments</h1>
            <p className="text-muted-foreground">Select a customer below to view their pending invoices and record payments.</p>
          </div>
        </div>

        <Card className="shadow-sm border-border/80">
          <CardHeader>
            <CardTitle>Accounts Receivable Summary</CardTitle>
            <CardDescription>
              Customers with outstanding balances
            </CardDescription>
          </CardHeader>
          <div className="px-6 flex flex-col sm:flex-row border-b pb-4 gap-4 items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search counterparty..."
                className="pl-9 bg-background/50 focus-within:bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center w-full sm:w-auto ml-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterOverdue} onValueChange={setFilterOverdue}>
                <SelectTrigger className="w-[160px] bg-background/50">
                  <SelectValue placeholder="Filter Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Customers</SelectItem>
                  <SelectItem value="OVERDUE">Overdue Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No Pending Payments</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                All your customers are up to date! There are no pending or overdue invoices right now.
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-16 px-6 bg-muted/20 rounded-xl m-6 border border-dashed border-border/50">
              <h3 className="text-lg font-semibold text-foreground">No matching customers</h3>
              <p className="text-muted-foreground mt-1 mb-4">No customers matched your search criteria.</p>
              <Button variant="outline" onClick={() => {setSearchQuery(""); setFilterOverdue("ALL")}}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-foreground">Customer Name</TableHead>
                    <TableHead className="font-semibold text-foreground">Email</TableHead>
                    <TableHead className="text-center font-semibold text-foreground">Pending Invoices</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Outstanding Balance</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/record-payments/${customer.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {customer.name}
                          {customer.hasOverdue && (
                            <Badge variant="destructive" className="flex items-center gap-1 text-[10px] h-5 px-1.5 border-transparent">
                              <AlertCircle className="w-3 h-3" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{customer.email || "-"}</TableCell>
                      <TableCell className="text-center">{customer.pendingInvoicesCount}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(customer.totalOutstanding, currentBusiness?.currency || 'USD')}
                      </TableCell>
                      <TableCell className="text-right w-[50px]">
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  )
}

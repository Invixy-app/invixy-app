"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1  mx-auto px-4 md:px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">API Reference</h1>
            <p className="text-xl text-muted-foreground">
              Integrate Invixy directly into your application with our REST API.
            </p>
          </div>

          <Tabs defaultValue="authentication" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="authentication" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                  <CardDescription>
                    All API requests must be authenticated using a Bearer token.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-md font-mono text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can generate an API key from your dashboard settings. Keep this key secure.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>List Invoices</CardTitle>
                  <CardDescription>
                    GET /api/v1/invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Returns a list of invoices for the authenticated business.
                  </p>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
{`{
  "data": [
    {
      "id": "inv_123",
      "number": "INV-2025-001",
      "amount": 1500.00,
      "status": "paid"
    }
  ]
}`}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Customer</CardTitle>
                  <CardDescription>
                    POST /api/v1/customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Creates a new customer record.
                  </p>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
{`{
  "name": "Acme Corp",
  "email": "billing@acme.com",
  "taxId": "US123456789"
}`}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

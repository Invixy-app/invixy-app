"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, DollarSign, BarChart3, Hash } from "lucide-react";
import Link from "next/link";

export default function ProductDetailsPage() {
  const params = useParams();
  const { currentBusiness } = useBusinessContext();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const productId = params.id as string;

  useEffect(() => {
    if (currentBusiness?.id && productId) {
      fetchProduct();
    }
  }, [currentBusiness?.id, productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}?businessId=${currentBusiness?.id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currentBusiness?.currency || 'USD'
      }).format(amount);
    } catch {
      return `$${amount}`;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-xl font-semibold">Product not found</h2>
          <Link href="/dashboard/products">
            <Button variant="link">Back to Products</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const cost = product.cost !== null && product.cost !== undefined ? Number(product.cost) : 0;
  const price = product.price !== null && product.price !== undefined ? Number(product.price) : 0;
  const profit = price - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/products">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
                <span>•</span>
                <span>{product.category || "Uncategorized"}</span>
              </div>
            </div>
          </div>
          <Link href={`/dashboard/products/${productId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div className="mt-1">{product.description || "No description provided"}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">SKU</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    {product.sku || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Unit</div>
                  <div className="mt-1">{product.unit}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Selling Price</div>
                  <div className="mt-1 text-xl font-bold">{formatCurrency(price)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Cost Price</div>
                  <div className="mt-1 text-xl">{formatCurrency(cost)}</div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Profit Margin</div>
                    <div className={`mt-1 text-lg font-semibold ${margin < 0 ? "text-red-600" : "text-green-600"}`}>
                      {margin.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Profit per Unit</div>
                    <div className={`mt-1 text-lg font-semibold ${profit < 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(profit)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Current Stock</div>
                  <div className="mt-1 text-2xl font-bold">
                    {product.stockQuantity !== null ? product.stockQuantity : "Not Tracked"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Min. Stock Level</div>
                  <div className="mt-1 text-xl">
                    {product.minStockLevel || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

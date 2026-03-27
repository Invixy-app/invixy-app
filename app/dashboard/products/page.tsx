"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showConfirm, showError, showSuccess } from "@/lib/alert-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LIMITS } from "@/lib/constants-limits";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  DollarSign,
  Hash,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { BulkProductImport } from "@/components/products/bulk-product-import";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  cost?: number | null;
  category?: string | null;
  unit: string;
  stockQuantity?: number | null;
  minStockLevel?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  taxSystem?: {
    id: string;
    name: string;
    taxId: string;
    rate: number;
  } | null;
}

export default function ProductsPage() {
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Calculate limits
  const currentPlan = currentBusiness?.plan || "FREE";
  const productLimit = LIMITS[currentPlan].PRODUCTS;
  const canCreateProduct = products.length < productLimit;

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchProducts(currentBusiness.id);
    } else if (!businessLoading) {
      setLoading(false);
    }
  }, [currentBusiness?.id, businessLoading]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchProducts = async (businessId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?businessId=${businessId}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!currentBusiness?.id) {
      showError("Error", "No business selected");
      return;
    }

    showConfirm(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      async () => {
        try {
          const response = await fetch(`/api/products/${productId}?businessId=${currentBusiness.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            setProducts(products.filter(p => p.id !== productId));
            showSuccess("Success", "Product deleted successfully");
          } else {
            const errorData = await response.json();
            showError("Error", "Something went wrong. Please try again.");
          }
        } catch (error) {
          console.error("Error deleting product:", error);
          showError("Error", "Something went wrong. Please try again.");
        }
      },
      {
        confirmText: "Delete",
        cancelText: "Cancel"
      }
    );
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currentBusiness?.currency || 'USD'
      }).format(amount);
    } catch (error) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === null || product.stockQuantity === undefined) return { status: "No tracking", variant: "outline" as const };
    if (product.minStockLevel && product.stockQuantity <= product.minStockLevel) {
      return { status: "Low stock", variant: "destructive" as const };
    }
    if (product.stockQuantity === 0) return { status: "Out of stock", variant: "destructive" as const };
    return { status: "In stock", variant: "default" as const };
  };

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  if (loading) {
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

  const activeProducts = products.filter((p) => p.isActive).length;
  const lowStockProducts = products.filter(
    (p) =>
      p.stockQuantity !== null &&
      p.minStockLevel !== null &&
      typeof p.stockQuantity === "number" &&
      typeof p.minStockLevel === "number" &&
      p.stockQuantity <= p.minStockLevel
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Product Catalog</h1>
            <p className="text-muted-foreground">Manage your enterprise inventory and pricing structures.</p>
          </div>
          <div className="flex items-center gap-2">
            <BulkProductImport />
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <span>
                    <Button disabled={!canCreateProduct} asChild={canCreateProduct} className="bg-[var(--brand-cobalt)] text-white hover:bg-[var(--brand-indigo)]">
                      {canCreateProduct ? (
                        <Link href="/dashboard/products/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Product
                        </Link>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Product
                        </>
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canCreateProduct && (
                  <TooltipContent side="left">
                    <p>You reached the limit of {productLimit} products for {currentPlan}.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-[var(--brand-cobalt)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Catalog volume</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Eye className="h-4 w-4 text-[var(--brand-teal)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProducts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Published and available</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockProducts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Needs restocking attention</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Hash className="h-4 w-4 text-[var(--brand-indigo)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active taxonomy groups</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products, Item Code, category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 pl-9"
                  />
                </div>
                {categories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-10 rounded-md border border-border/80 bg-background px-4 text-sm shadow-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category || ""}>
                        {category}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Showing {filteredProducts.length} of {products.length.toLocaleString()} products
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="px-5 text-[10px] uppercase tracking-[0.14em]">Product Name</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.14em]">Item Code</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.14em]">Category</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.14em]">Price</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.14em]">Stock</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.14em]">Tax System</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.14em]">Status</TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-[0.14em]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <TableRow key={product.id} className="hover:bg-muted/20">
                          <TableCell className="px-5 py-3">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{product.description || "-"}</div>
                          </TableCell>
                          <TableCell className="py-3 text-sm text-muted-foreground">{product.sku || "-"}</TableCell>
                          <TableCell className="py-3">
                            {product.category ? <Badge variant="outline">{product.category}</Badge> : "-"}
                          </TableCell>
                          <TableCell className="py-3 font-semibold">{formatCurrency(product.price)}</TableCell>
                          <TableCell className="py-3">
                            <div className="text-sm font-medium">{product.stockQuantity ?? "-"}</div>
                            <Badge variant={stockStatus.variant} className="mt-1 text-[10px]">
                              {stockStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            {product.taxSystem ? `${product.taxSystem.name} ${(product.taxSystem.rate * 100).toFixed(0)}%` : "-"}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant={product.isActive ? "default" : "secondary"} className="text-[10px]">
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link href={`/dashboard/products/${product.id}`}>
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                </Link>
                                <Link href={`/dashboard/products/${product.id}/edit`}>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Product
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-14 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {searchTerm || selectedCategory ? "No products found" : "No products yet"}
                </h3>
                <p className="mb-4 text-muted-foreground">
                  {searchTerm || selectedCategory
                    ? "Try adjusting your search terms or filters."
                    : "Get started by adding your first product."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
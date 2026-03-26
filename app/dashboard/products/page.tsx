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

  return (
 <DashboardLayout>
  <div className="space-y-8">
    {/* Header */}
    <div className="flex justify-between items-center rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product catalog and inventory
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <BulkProductImport />
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <span>
                <Button disabled={!canCreateProduct} asChild={canCreateProduct} className="bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                  {canCreateProduct ? (
                    <Link href="/dashboard/products/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Link>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            {!canCreateProduct && (
              <TooltipContent side="left">
                <p>You have reached the limit of {productLimit} products for the {currentPlan} plan.</p>
                <p className="font-semibold text-primary mt-1">Upgrade to Pro for unlimited products.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    {/* Search and Filters */}
    <Card className="border border-border/80 shadow-sm rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          Product Catalog
        </CardTitle>
        <CardDescription>Search and manage your products</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, description, or Item Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm shadow-sm"
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

        {/* Products Table */}
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto border border-border/80 rounded-xl">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold text-foreground max-w-[250px]">
                    Product
                  </TableHead>
                  <TableHead className="w-[120px]">Item Code</TableHead>
                  <TableHead className="w-[120px]">Price</TableHead>
                  <TableHead className="w-[150px]">Stock</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead className="w-[150px]">Tax System</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <TableRow
                      key={product.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="max-w-[250px]">
                        <div>
                          <div className="font-medium text-foreground line-clamp-2" title={product.name}>
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground line-clamp-2" title={product.description}>
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.sku && (
                          <div className="flex items-center text-sm text-foreground">
                            {/* <Hash className="h-3 w-3 mr-1 text-gray-400" /> */}
                            {product.sku}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-foreground">
                          {/* <DollarSign className="h-3 w-3 mr-1 text-gray-400" /> */}
                          {formatCurrency(product.price)}
                        </div>
                        {product.cost && (
                          <div className="text-xs text-muted-foreground">
                            Cost: {formatCurrency(product.cost)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {product.stockQuantity === null ? (
                            <span className="text-sm text-muted-foreground">
                              Not tracked
                            </span>
                          ) : (
                            <>
                              <span className="font-medium text-foreground">
                                {product.stockQuantity}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {product.unit}
                              </span>
                              {getStockStatus(product).status === "Low stock" && (
                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              )}
                            </>
                          )}
                        </div>
                        <Badge
                          variant={stockStatus.variant}
                          className="text-xs mt-1"
                        >
                          {stockStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.category && (
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.taxSystem && (
                          <div className="text-sm text-foreground">
                            <div className="font-medium">
                              {product.taxSystem.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(product.taxSystem.rate * 100).toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-muted"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href={`/dashboard/products/${product.id}`}>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/dashboard/products/${product.id}/edit`}>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Product
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
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
          <div className="text-center py-14">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm || selectedCategory
                ? "No products found"
                : "No products yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory
                ? "Try adjusting your search terms or filters."
                : "Get started by adding your first product."}
            </p>
            {!(searchTerm || selectedCategory) && (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <span>
                      <Button disabled={!canCreateProduct} asChild={canCreateProduct} className="bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                        {canCreateProduct ? (
                          <Link href="/dashboard/products/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Product
                          </Link>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Product
                          </>
                        )}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canCreateProduct && (
                    <TooltipContent>
                      <p>Limit reached on {currentPlan} plan.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Summary Stats */}
    {products.length > 0 && (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Products",
            value: products.length,
          },
          {
            title: "Active Products",
            value: products.filter((p) => p.isActive).length,
          },
          {
            title: "Low Stock Items",
            value: products.filter(
              (p) =>
                p.stockQuantity !== null &&
                p.minStockLevel !== null &&
                typeof p.stockQuantity === "number" &&
                typeof p.minStockLevel === "number" &&
                p.stockQuantity <= p.minStockLevel
            ).length,
            color: "text-yellow-600",
          },
          {
            title: "Categories",
            value: categories.length,
          },
        ].map((stat) => (
          <Card
            key={stat.title}
            className="border border-border/80 shadow-sm rounded-xl hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-semibold ${
                  stat.color || "text-foreground"
                }`}
              >
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>
</DashboardLayout>

  );
}
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
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
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    // Get selected business from localStorage or fetch businesses
    const businessId = localStorage.getItem("selectedBusinessId");
    if (businessId) {
      setSelectedBusiness(businessId);
      fetchProducts(businessId);
    } else {
      fetchBusinesses();
    }
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/business");
      if (response.ok) {
        const data = await response.json();
        if (data.businesses?.length > 0) {
          const businessId = data.businesses[0].id;
          setSelectedBusiness(businessId);
          localStorage.setItem("selectedBusinessId", businessId);
          fetchProducts(businessId);
        }
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
      setLoading(false);
    }
  };

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

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
 <DashboardLayout>
  <div className="space-y-8">
    {/* Header */}
    <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="opacity-90 text-sm">
          Manage your product catalog and inventory
        </p>
      </div>
      <Link href="/dashboard/products/new">
        <Button className="bg-white text-blue-700 hover:bg-blue-50 shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </Link>
    </div>

    {/* Search and Filters */}
    <Card className="border border-gray-100 shadow-sm rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Product Catalog
        </CardTitle>
        <CardDescription>Search and manage your products</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products by name, description, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 bg-white rounded-md text-sm shadow-sm"
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
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">
                    Product
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tax System</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <TableRow
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.sku && (
                          <div className="flex items-center text-sm text-gray-700">
                            <Hash className="h-3 w-3 mr-1 text-gray-400" />
                            {product.sku}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-gray-900">
                          <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                          {formatCurrency(product.price)}
                        </div>
                        {product.cost && (
                          <div className="text-xs text-gray-500">
                            Cost: {formatCurrency(product.cost)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {product.stockQuantity !== null ? (
                            <>
                              <span className="font-medium text-gray-900">
                                {product.stockQuantity}
                              </span>
                              <span className="text-xs text-gray-500">
                                {product.unit}
                              </span>
                              {stockStatus.status === "Low stock" && (
                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Not tracked
                            </span>
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
                          <div className="text-sm text-gray-800">
                            <div className="font-medium">
                              {product.taxSystem.name}
                            </div>
                            <div className="text-xs text-gray-500">
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
                              className="h-8 w-8 p-0 hover:bg-gray-100"
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
                              className="text-red-600"
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
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedCategory
                ? "No products found"
                : "No products yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory
                ? "Try adjusting your search terms or filters."
                : "Get started by adding your first product."}
            </p>
            {!(searchTerm || selectedCategory) && (
              <Link href="/dashboard/products/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </Link>
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
        ].map((stat, i) => (
          <Card
            key={i}
            className="border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-semibold ${
                  stat.color || "text-gray-900"
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
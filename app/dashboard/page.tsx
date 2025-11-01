"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Building2,
  Users,
  Package,
  FileText,
  Plus,
} from "lucide-react";

interface BusinessWithRole {
  id: string;
  name: string;
  description?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [businesses, setBusinesses] = useState<BusinessWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalInvoices: 0,
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/business");
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ACCOUNTANT":
        return "secondary";
      case "EMPLOYEE":
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="opacity-90 text-sm mt-1">
              Welcome back, {session?.user?.name}
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Businesses",
              value: businesses.length,
              icon: <Building2 className="h-5 w-5 text-blue-600" />,
              desc: "Businesses you have access to",
            },
            {
              title: "Products",
              value: stats.totalProducts,
              icon: <Package className="h-5 w-5 text-green-600" />,
              desc: "Coming in Phase 3",
            },
            {
              title: "Customers",
              value: stats.totalCustomers,
              icon: <Users className="h-5 w-5 text-yellow-600" />,
              desc: "Coming in Phase 4",
            },
            {
              title: "Invoices",
              value: stats.totalInvoices,
              icon: <FileText className="h-5 w-5 text-purple-600" />,
              desc: "Coming in Phase 6",
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className="hover:shadow-md transition-shadow duration-200 border border-gray-100 rounded-xl"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* BUSINESS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Businesses
            </h2>
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
            >
              <Link href="/dashboard/businesses/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Business
              </Link>
            </Button>
          </div>

          {businesses.length === 0 ? (
            <Card className="border border-gray-200 shadow-sm text-center py-10">
              <CardContent>
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800">
                  No businesses yet
                </h3>
                <p className="text-gray-500 mt-2">
                  Get started by creating your first business
                </p>
                <Button
                  asChild
                  className="mt-5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/dashboard/businesses/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Business
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <Card
                  key={business.id}
                  className="hover:shadow-lg transition-all duration-200 border border-gray-100 rounded-xl"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {business.name}
                      </CardTitle>
                      <Badge
                        variant={getRoleBadgeVariant(business.role)}
                        className="capitalize"
                      >
                        {business.role.toLowerCase()}
                      </Badge>
                    </div>
                    {business.description && (
                      <CardDescription className="line-clamp-2 text-gray-600 mt-1">
                        {business.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-500">
                        Created on{" "}
                        {new Date(business.createdAt).toLocaleDateString()}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        <Link href={`/dashboard/businesses/${business.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* RECENT ACTIVITY */}
        <Card className="border border-gray-200 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Activity</CardTitle>
            <CardDescription>
              Your recent actions across all businesses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-gray-500">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>Activity tracking will be available in future updates</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

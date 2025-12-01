"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Check,
  Loader2 
} from "lucide-react";
import { BusinessWithRole } from "@/lib/business";
import { useBusinessContext } from "@/components/business-context";
import Link from "next/link";

interface BusinessSwitcherProps {
  className?: string;
}



export function BusinessSwitcher({ className }: BusinessSwitcherProps) {
  let businessContext;
  try {
    businessContext = useBusinessContext();
  } catch (error) {
    console.error('BusinessSwitcher: Error accessing business context:', error);
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-red-600">Error loading business data</span>
      </div>
    );
  }

  const { 
    businesses, 
    currentBusiness, 
    isLoading: loading, 
    switchBusiness: contextSwitchBusiness,
    refreshBusinesses 
  } = businessContext;
  
  const [switchingBusiness, setSwitchingBusiness] = useState(false);

  const switchBusiness = async (business: BusinessWithRole) => {
    if (business.id === currentBusiness?.id) return;
    
    try {
      setSwitchingBusiness(true);
      await contextSwitchBusiness(business);
    } catch (error) {
      console.error("Error switching business:", error);
    } finally {
      setSwitchingBusiness(false);
    }
  };



  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-800";
      case "MANAGER":
        return "bg-blue-100 text-blue-800";
      case "ACCOUNTANT":
        return "bg-green-100 text-green-800";
      case "EMPLOYEE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-600">Loading businesses...</span>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <Button variant="outline" className={`${className} w-full`} asChild>
        <Link href="/dashboard/businesses/new">
          <Building2 className="mr-2 h-4 w-4" />
          Create  Business
        </Link>
      </Button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 min-w-[200px] w-full justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {currentBusiness?.name || "Select Business"}
                </span>
                {/* {currentBusiness && (
                  <Badge
                    variant="secondary"
                    className={`text-xs px-1 py-0 ${getRoleColor(currentBusiness.role)}`}
                  >
                    {currentBusiness.role}
                  </Badge>
                )} */}
              </div>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          <DropdownMenuLabel>Your Businesses</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {businesses.map((business) => (
            <DropdownMenuItem
              key={business.id}
              onClick={() => switchBusiness(business)}
              className="flex items-center justify-between py-2"
              disabled={switchingBusiness}
            >
              <div className="flex flex-col">
                <span className="font-medium">{business.name}</span>
                <span className="text-xs text-gray-500">{business.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${getRoleColor(business.role)}`}
                >
                  {business.role}
                </Badge>
                {business.id === currentBusiness?.id && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/dashboard/businesses/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Business
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
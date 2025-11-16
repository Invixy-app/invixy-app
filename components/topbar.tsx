"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BusinessSwitcher } from "@/components/business-switcher";
import { 
  ChevronDown, 
  LogOut, 
  User,
  Bell,
  Building2
} from "lucide-react";

interface TopbarProps {
  className?: string;
  showBusinessSwitcher?: boolean;
}

export function Topbar({ className, showBusinessSwitcher = true }: TopbarProps) {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const userInitials = session?.user?.name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 ${className}`}>
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Left side - Business Switcher */}
        {showBusinessSwitcher && (
          <div className="flex items-center">
            <BusinessSwitcher />
          </div>
        )}
        
        {/* Right side - User actions */}
        <div className={`flex items-center gap-x-4 lg:gap-x-6 ${showBusinessSwitcher ? 'ml-auto' : 'ml-auto'}`}>
          {/* Notifications button */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {/* Notification dot - can be conditionally rendered */}
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
          
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-x-2 pl-2 pr-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex sm:flex-col sm:items-start">
                  <span className="text-sm font-medium text-gray-900">
                    {session?.user?.name || "User"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {session?.user?.email}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <a href="/dashboard/settings" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </a>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <a href="/dashboard/business-settings" className="flex items-center cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4" />
                  Business Settings
                </a>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
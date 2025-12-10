"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  Package,
  Calculator,
  LogOut,
  ChevronRight,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BusinessSwitcher } from "@/components/business-switcher"
import { useBusinessContext } from "@/components/business-context"
import { Separator } from "@/components/ui/separator"
import { GlobalAlert } from "@/components/global-alert"

export function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { currentBusiness, isLoading } = useBusinessContext()

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navItems = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      matchExact: true
    },
    {
      title: "Invoices",
      href: "/dashboard/invoices",
      icon: FileText,
    },
    {
      title: "Customers",
      href: "/dashboard/customers",
      icon: Users,
    },
    {
      title: "Products",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      title: "Tax Systems",
      href: "/dashboard/tax-systems",
      icon: Calculator,
    },
    {
      title: "Settings",
      href: "/dashboard/business-settings",
      icon: Settings,
    },
  ]

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="fixed inset-0 w-full overflow-hidden bg-background font-sans text-foreground flex">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 220 : 72,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground h-full z-30 shadow-xl"
      >
        <div className="p-4 flex items-center justify-between h-16 shrink-0">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 font-bold text-xl tracking-tight"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  IV
                </div>
                <span>Invixy</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  IV
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-3 py-2">
           {isSidebarOpen ? (
             <BusinessSwitcher />
           ) : (
             <div className="flex justify-center">
               <div className="w-10 h-10 rounded-md bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-medium border border-sidebar-border/20">
                 {currentBusiness?.name?.substring(0, 2).toUpperCase() || "B"}
               </div>
             </div>
           )}
        </div>

        <div className={`flex-1 py-4 px-3 space-y-1 ${isSidebarOpen ? "overflow-y-auto" : "overflow-visible"}`}>
          {navItems.map((item) => {
            const isActive = item.matchExact 
              ? pathname === item.href 
              : pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative
                  ${isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"}`} />
                
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="truncate"
                  >
                    {item.title}
                  </motion.span>
                )}

                {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border">
                    {item.title}
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        <div className="p-3 mt-auto border-t border-sidebar-border/20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`w-full justify-start p-2 h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${!isSidebarOpen && "justify-center"}`}>
                <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border/30">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                    {session?.user?.name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {isSidebarOpen && (
                  <div className="flex flex-col items-start ml-3 text-left overflow-hidden">
                    <span className="text-sm font-medium truncate w-full">{session?.user?.name}</span>
                    <span className="text-xs text-sidebar-foreground/60 truncate w-full">{session?.user?.email}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 ml-2">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <div>
                <Settings className="mr-2 h-4 w-4" />
                <Link href="/dashboard/settings">Settings</Link>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            IV
          </div>
          <span>Invixy</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-16 bg-background z-30 p-4 overflow-y-auto"
          >
            <div className="space-y-1">
              <div className="mb-6">
                <BusinessSwitcher />
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              ))}
              <Separator className="my-4" />
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Top Header */}
        <header className="h-16 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className="hidden md:flex text-muted-foreground hover:text-foreground"
            >
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>
            
            {/* Breadcrumbs or Page Title could go here */}
            <div className="hidden md:flex items-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Dashboard</span>
              {pathname !== "/dashboard" && (
                <>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <span className="capitalize">{pathname.split("/").pop()?.replaceAll(/-/g, " ")}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search..." 
                className="w-64 pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1" 
              />
            </div> */}
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background"></span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
      
      {/* Global Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                Loading business data...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <GlobalAlert />
    </div>
  )
}
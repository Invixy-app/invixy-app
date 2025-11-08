"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BusinessWithRole } from "@/lib/business";

interface BusinessContextType {
  businesses: BusinessWithRole[];
  currentBusiness: BusinessWithRole | null;
  isLoading: boolean;
  switchBusiness: (business: BusinessWithRole) => Promise<void>;
  refreshBusinesses: () => Promise<void>;
  setCurrentBusiness: (business: BusinessWithRole | null) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function useBusinessContext() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusinessContext must be used within a BusinessProvider");
  }
  return context;
}

interface BusinessProviderProps {
  children: React.ReactNode;
}

export function BusinessProvider({ children }: BusinessProviderProps) {
  const { data: session } = useSession();
  const [businesses, setBusinesses] = useState<BusinessWithRole[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBusinesses = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/business");
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses);
        
        // Try to restore the last selected business from localStorage (client-side only)
        if (typeof window !== "undefined") {
          const savedBusinessId = localStorage.getItem("currentBusinessId");
          if (savedBusinessId) {
            const savedBusiness = data.businesses.find((b: BusinessWithRole) => b.id === savedBusinessId);
            if (savedBusiness) {
              setCurrentBusiness(savedBusiness);
            } else if (data.businesses.length > 0) {
              // Fallback to first business if saved one doesn't exist
              setCurrentBusiness(data.businesses[0]);
              localStorage.setItem("currentBusinessId", data.businesses[0].id);
            }
          } else if (data.businesses.length > 0) {
            // Set first business as default
            setCurrentBusiness(data.businesses[0]);
            localStorage.setItem("currentBusinessId", data.businesses[0].id);
          }
        } else if (data.businesses.length > 0) {
          // Server-side: just set the first business without localStorage
          setCurrentBusiness(data.businesses[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load businesses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchBusiness = async (business: BusinessWithRole) => {
    if (business.id === currentBusiness?.id) return;
    
    try {
      const response = await fetch("/api/business/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessId: business.id }),
      });

      if (response.ok) {
        setCurrentBusiness(business);
        
        // Only use localStorage on client-side
        if (typeof window !== "undefined") {
          localStorage.setItem("currentBusinessId", business.id);
          
          // Trigger a custom event that components can listen to
          window.dispatchEvent(new CustomEvent("businessSwitched", { 
            detail: { business } 
          }));
        }
      } else {
        throw new Error("Failed to switch business");
      }
    } catch (error) {
      console.error("Error switching business:", error);
      throw error;
    }
  };

  // Load businesses when session is available
  useEffect(() => {
    if (session?.user) {
      refreshBusinesses();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const value: BusinessContextType = {
    businesses,
    currentBusiness,
    isLoading,
    switchBusiness,
    refreshBusinesses,
    setCurrentBusiness,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}
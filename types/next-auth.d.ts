import "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      businesses?: Array<{
        id: string;
        businessId: string;
        role: Role;
        business: {
          id: string;
          name: string;
          description?: string;
        };
      }>;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    businesses?: Array<{
      id: string;
      businessId: string;
      role: Role;
      business: {
        id: string;
        name: string;
        description?: string;
      };
    }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    businesses?: Array<{
      id: string;
      businessId: string;
      role: Role;
      business: {
        id: string;
        name: string;
        description?: string;
      };
    }>;
  }
}
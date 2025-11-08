import { Role } from "@prisma/client";
import prisma from "@/lib/db";

export async function checkBusinessAccess(
  userId: string,
  businessId: string,
  requiredRole?: Role[]
): Promise<boolean> {
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId
      }
    }
  });

  if (!userRole) return false;
  
  if (requiredRole && requiredRole.length > 0) {
    return requiredRole.includes(userRole.role);
  }
  
  return true;
}

export async function requireBusinessAccess(
  userId: string,
  businessId: string,
  requiredRole?: Role[]
): Promise<void> {
  const hasAccess = await checkBusinessAccess(userId, businessId, requiredRole);
  if (!hasAccess) {
    throw new Error("Insufficient permissions");
  }
}

export async function getUserBusinesses(userId: string) {
  return await prisma.businessUserRole.findMany({
    where: { userId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          description: true,
          email: true,
          phone: true,
          website: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });
}

export async function getUserRole(userId: string, businessId: string): Promise<Role | null> {
  const businessUserRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId
      }
    }
  });

  return businessUserRole?.role || null;
}

export const ROLE_HIERARCHY = {
  [Role.OWNER]: 5,
  [Role.ACCOUNTANT]: 4,
  [Role.MANAGER]: 3,
  [Role.EMPLOYEE]: 2,
  [Role.VIEWER]: 1
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Permission checking functions
export function canManageUsers(role: Role): boolean {
  return role === Role.OWNER;
}

export function canManageFinancials(role: Role): boolean {
  return ([Role.OWNER, Role.ACCOUNTANT] as Role[]).includes(role);
}

export function canViewReports(role: Role): boolean {
  return ([Role.OWNER, Role.ACCOUNTANT, Role.MANAGER, Role.EMPLOYEE] as Role[]).includes(role);
}

export function canCreateInvoices(role: Role): boolean {
  return ([Role.OWNER, Role.ACCOUNTANT, Role.MANAGER, Role.EMPLOYEE] as Role[]).includes(role);
}

export function canEditInvoices(role: Role): boolean {
  return ([Role.OWNER, Role.ACCOUNTANT, Role.MANAGER] as Role[]).includes(role);
}

export function canDeleteInvoices(role: Role): boolean {
  return ([Role.OWNER, Role.ACCOUNTANT] as Role[]).includes(role);
}

export function canManageProducts(role: Role): boolean {
  return ([Role.OWNER, Role.MANAGER, Role.EMPLOYEE] as Role[]).includes(role);
}

export function canManageCustomers(role: Role): boolean {
  return ([Role.OWNER, Role.MANAGER, Role.EMPLOYEE] as Role[]).includes(role);
}

export function canManageTaxSystems(role: Role): boolean {
  return ([Role.OWNER, Role.ACCOUNTANT] as Role[]).includes(role);
}

export function canViewDashboard(role: Role): boolean {
  return ([Role.OWNER, Role.ACCOUNTANT, Role.MANAGER, Role.EMPLOYEE] as Role[]).includes(role);
}

export function isReadOnly(role: Role): boolean {
  return role === Role.VIEWER;
}
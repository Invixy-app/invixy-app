import prisma from "@/lib/db";
import { Plan } from "@prisma/client";
import { LIMITS } from "@/lib/constants-limits";

export { LIMITS };

export async function getBusinessSubscription(businessId: string): Promise<Plan> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      businessId,
      status: "ACTIVE",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return subscription?.plan || "FREE";
}

export async function checkBusinessLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const businesses = await prisma.businessUserRole.findMany({
    where: {
      userId,
      role: "OWNER", // Only count businesses owned by the user
    },
    include: {
      business: {
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }
    }
  });

  // Determine the highest plan the user has across their businesses
  let userPlan: "FREE" | "PRO" | "ENTERPRISE" = "FREE";
  for (const b of businesses) {
    const plan = b.business.subscriptions[0]?.plan || "FREE";
    if (plan === "ENTERPRISE") userPlan = "ENTERPRISE";
    else if (plan === "PRO" && userPlan !== "ENTERPRISE") userPlan = "PRO";
  }

  const limit = LIMITS[userPlan].BUSINESSES;

  if (businesses.length < limit) {
    return { allowed: true };
  }

  return { 
    allowed: false, 
    message: `You have reached the limit of ${limit} businesses for the ${userPlan} plan.` 
  };
}

export async function checkInvoiceLimit(businessId: string): Promise<{ allowed: boolean; message?: string }> {
  const plan = await getBusinessSubscription(businessId);
  const limit = LIMITS[plan].INVOICES;
  
  if (limit === Infinity) return { allowed: true };
  
  const count = await prisma.invoice.count({ where: { businessId } });
  
  if (count < limit) return { allowed: true };

  return {
    allowed: false,
    message: `You have reached the limit of ${limit} invoices for the ${plan} plan. Upgrade to create more.`
  };
}

export async function checkProductLimit(businessId: string): Promise<{ allowed: boolean; message?: string }> {
  const plan = await getBusinessSubscription(businessId);
  const limit = LIMITS[plan].PRODUCTS;
  
  if (limit === Infinity) return { allowed: true };
  
  const count = await prisma.product.count({ where: { businessId } });
  
  if (count < limit) return { allowed: true };

  return {
    allowed: false,
    message: `You have reached the limit of ${limit} products for the ${plan} plan. Upgrade to create more.`
  };
}

export async function checkCustomerLimit(businessId: string): Promise<{ allowed: boolean; message?: string }> {
  const plan = await getBusinessSubscription(businessId);
  const limit = LIMITS[plan].CUSTOMERS;
  
  if (limit === Infinity) return { allowed: true };
  
  const count = await prisma.customer.count({ where: { businessId } });
  
  if (count < limit) return { allowed: true };

  return {
    allowed: false,
    message: `You have reached the limit of ${limit} customers for the ${plan} plan. Upgrade to create more.`
  };
}

export async function canSendEmail(businessId: string): Promise<{ allowed: boolean; message?: string }> {
  const plan = await getBusinessSubscription(businessId);
  const allowed = LIMITS[plan].CAN_SEND_EMAIL;
  
  if (allowed) return { allowed: true };

  return {
    allowed: false,
    message: `Email sending is not available on the ${plan} plan. Upgrade to Pro to send emails.`
  };
}

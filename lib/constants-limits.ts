export const LIMITS = {
  FREE: {
    INVOICES: 5,
    PRODUCTS: 5,
    CUSTOMERS: 2,
    BUSINESSES: 1,
    CAN_SEND_EMAIL: false,
  },
  PRO: {
    INVOICES: Infinity,
    PRODUCTS: Infinity,
    CUSTOMERS: Infinity,
    BUSINESSES: 5,
    CAN_SEND_EMAIL: true,
  },
  ENTERPRISE: {
    INVOICES: Infinity,
    PRODUCTS: Infinity,
    CUSTOMERS: Infinity,
    BUSINESSES: Infinity,
    CAN_SEND_EMAIL: true,
  }
} as const;

export type Plan = "FREE" | "PRO" | "ENTERPRISE";

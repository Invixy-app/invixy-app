import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function getCurrencySymbol(currency: string = 'USD'): string {
  // Extract just the symbol using parts
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).formatToParts(0);
  const symbolPart = parts.find(part => part.type === 'currency');
  return symbolPart ? symbolPart.value : '$';
}

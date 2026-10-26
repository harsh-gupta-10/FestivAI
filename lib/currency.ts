/**
 * FestivAI Currency Engine
 * Comprehensive multi-currency formatting, symbols (₹ INR, $, €, £, etc.), and conversions.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  country: string;
  locale: string;
  rateToUsd: number; // approximate benchmark rate for cross-currency parity
  isPrefix: boolean;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    country: "India",
    locale: "en-IN",
    rateToUsd: 86.5,
    isPrefix: true,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    country: "United States",
    locale: "en-US",
    rateToUsd: 1.0,
    isPrefix: true,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    country: "Eurozone",
    locale: "de-DE",
    rateToUsd: 0.92,
    isPrefix: true,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    country: "United Kingdom",
    locale: "en-GB",
    rateToUsd: 0.79,
    isPrefix: true,
  },
  AED: {
    code: "AED",
    symbol: "AED",
    name: "UAE Dirham",
    country: "United Arab Emirates",
    locale: "en-AE",
    rateToUsd: 3.67,
    isPrefix: true,
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar",
    country: "Canada",
    locale: "en-CA",
    rateToUsd: 1.38,
    isPrefix: true,
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    country: "Australia",
    locale: "en-AU",
    rateToUsd: 1.54,
    isPrefix: true,
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    country: "Japan",
    locale: "ja-JP",
    rateToUsd: 152.0,
    isPrefix: true,
  },
};

export const DEFAULT_CURRENCY = "USD";

/**
 * Returns the exact currency symbol (e.g. "₹" for INR, "$" for USD, "€" for EUR, "£" for GBP).
 */
export function getCurrencySymbol(currency?: string): string {
  if (!currency) return "$";
  const upper = currency.toUpperCase().trim();
  return SUPPORTED_CURRENCIES[upper]?.symbol || "$";
}

/**
 * Returns complete metadata for a given currency code.
 */
export function getCurrencyMeta(currency?: string): CurrencyConfig {
  if (!currency) return SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
  const upper = currency.toUpperCase().trim();
  return SUPPORTED_CURRENCIES[upper] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Formats a monetary amount into a clean, localized string with symbol and proper digit grouping.
 * For INR: supports Indian grouping (e.g. ₹1,50,000).
 */
export function formatCurrency(
  amount: number,
  currency?: string,
  options?: {
    compact?: boolean;
    showCode?: boolean;
    includeSign?: boolean;
  }
): string {
  const num = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const meta = getCurrencyMeta(currency);
  const symbol = meta.symbol;

  const sign = options?.includeSign && num > 0 ? "+" : num < 0 ? "-" : "";
  const absAmount = Math.abs(num);

  if (options?.compact) {
    if (meta.code === "INR") {
      // Indian numbering abbreviations (Lakh, Crore, k)
      if (absAmount >= 10000000) {
        return `${sign}${symbol}${(absAmount / 10000000).toFixed(1)} Cr`;
      }
      if (absAmount >= 100000) {
        return `${sign}${symbol}${(absAmount / 100000).toFixed(1)} L`;
      }
      if (absAmount >= 1000) {
        return `${sign}${symbol}${(absAmount / 1000).toFixed(0)}k`;
      }
      return `${sign}${symbol}${Math.round(absAmount)}`;
    }

    if (absAmount >= 1000000) {
      return `${sign}${symbol}${(absAmount / 1000000).toFixed(1)}M`;
    }
    if (absAmount >= 1000) {
      return `${sign}${symbol}${(absAmount / 1000).toFixed(0)}k`;
    }
    return `${sign}${symbol}${Math.round(absAmount)}`;
  }

  // Format with localized numbering
  let formattedNumber: string;
  try {
    formattedNumber = new Intl.NumberFormat(meta.locale, {
      maximumFractionDigits: 0,
    }).format(absAmount);
  } catch {
    formattedNumber = Math.round(absAmount).toLocaleString();
  }

  const base = `${sign}${symbol}${formattedNumber}`;
  if (options?.showCode) {
    return `${base} ${meta.code}`;
  }
  return base;
}

/**
 * Converts budget between currencies based on standard parity ratios.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromMeta = getCurrencyMeta(fromCurrency);
  const toMeta = getCurrencyMeta(toCurrency);

  // Convert to USD first, then to target currency
  const inUsd = amount / fromMeta.rateToUsd;
  const inTarget = inUsd * toMeta.rateToUsd;
  return Math.round(inTarget);
}

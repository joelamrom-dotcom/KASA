/**
 * Multi-Currency Support
 * Currency conversion, exchange rates, and regional pricing
 */

export interface Currency {
  code: string
  name: string
  symbol: string
  decimalPlaces: number
  exchangeRate?: number // To base currency (USD)
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, exchangeRate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, exchangeRate: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, exchangeRate: 0.79 },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', decimalPlaces: 2, exchangeRate: 3.65 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, exchangeRate: 1.35 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, exchangeRate: 1.52 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, exchangeRate: 149.5 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, exchangeRate: 0.88 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, exchangeRate: 7.24 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, exchangeRate: 83.12 }
]

// Get currency by code
export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code)
}

// Convert amount from one currency to another
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  const from = getCurrency(fromCurrency)
  const to = getCurrency(toCurrency)

  if (!from || !to) {
    throw new Error(`Invalid currency: ${fromCurrency} or ${toCurrency}`)
  }

  // Convert to base currency (USD) first
  const amountInUSD = amount / (from.exchangeRate || 1)
  
  // Convert to target currency
  return amountInUSD * (to.exchangeRate || 1)
}

// Format currency amount
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode)
  if (!currency) {
    return `${amount.toFixed(2)} ${currencyCode}`
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces
  }).format(amount)

  return formatted
}

// Get exchange rate between two currencies
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  const from = getCurrency(fromCurrency)
  const to = getCurrency(toCurrency)

  if (!from || !to) {
    return 1
  }

  return (to.exchangeRate || 1) / (from.exchangeRate || 1)
}

// Update exchange rates (would fetch from API in production)
export async function updateExchangeRates(): Promise<void> {
  // In production, fetch from exchange rate API
  // For now, rates are static
  console.log('Exchange rates updated')
}

// Calculate tax by region
export function calculateTax(amount: number, region: string): number {
  const taxRates: Record<string, number> = {
    'US': 0.08, // Average US sales tax
    'CA': 0.13, // HST in Canada
    'GB': 0.20, // VAT in UK
    'IL': 0.17, // VAT in Israel
    'EU': 0.20, // Average EU VAT
    'AU': 0.10, // GST in Australia
  }

  const rate = taxRates[region] || 0
  return amount * rate
}

// Format currency with region-specific formatting
export function formatCurrencyRegional(
  amount: number,
  currencyCode: string,
  region: string
): string {
  const currency = getCurrency(currencyCode)
  if (!currency) {
    return `${amount.toFixed(2)} ${currencyCode}`
  }

  // Use region-specific locale
  const locale = getLocaleForRegion(region)
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces
  }).format(amount)
}

function getLocaleForRegion(region: string): string {
  const localeMap: Record<string, string> = {
    'US': 'en-US',
    'CA': 'en-CA',
    'GB': 'en-GB',
    'IL': 'he-IL',
    'EU': 'en-GB',
    'AU': 'en-AU',
    'JP': 'ja-JP',
    'CN': 'zh-CN',
    'IN': 'en-IN'
  }

  return localeMap[region] || 'en-US'
}


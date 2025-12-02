import { NextRequest, NextResponse } from 'next/server'
import { convertCurrency, formatCurrency, getExchangeRate, CURRENCIES } from '@/lib/currency'

export const dynamic = 'force-dynamic'

// POST - Convert currency
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, fromCurrency, toCurrency } = body

    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json(
        { error: 'Amount, fromCurrency, and toCurrency are required' },
        { status: 400 }
      )
    }

    const converted = convertCurrency(parseFloat(amount), fromCurrency, toCurrency)
    const exchangeRate = getExchangeRate(fromCurrency, toCurrency)
    const formatted = formatCurrency(converted, toCurrency)

    return NextResponse.json({
      originalAmount: parseFloat(amount),
      originalCurrency: fromCurrency,
      convertedAmount: converted,
      convertedCurrency: toCurrency,
      exchangeRate,
      formatted
    })
  } catch (error: any) {
    console.error('Error converting currency:', error)
    return NextResponse.json(
      { error: 'Failed to convert currency', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Get available currencies
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      currencies: CURRENCIES.map(c => ({
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        decimalPlaces: c.decimalPlaces
      }))
    })
  } catch (error: any) {
    console.error('Error fetching currencies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currencies', details: error.message },
      { status: 500 }
    )
  }
}


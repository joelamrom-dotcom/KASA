import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { generateCashFlowForecast } from '@/lib/financial-forecasting'

export const dynamic = 'force-dynamic'

// GET - Get cash flow forecast
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const months = parseInt(searchParams.get('months') || '12')

    const forecast = await generateCashFlowForecast(user.userId, months)

    return NextResponse.json(forecast)
  } catch (error: any) {
    console.error('Error generating cash flow forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate cash flow forecast', details: error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { generateFinancialProjection, ScenarioInput } from '@/lib/financial-forecasting'

export const dynamic = 'force-dynamic'

// GET - Get financial projections
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const years = parseInt(searchParams.get('years') || '5')
    const scenario = searchParams.get('scenario') ? JSON.parse(searchParams.get('scenario')!) : undefined

    const projection = await generateFinancialProjection(
      user.userId,
      years,
      scenario as ScenarioInput | undefined
    )

    return NextResponse.json(projection)
  } catch (error: any) {
    console.error('Error generating financial projection:', error)
    return NextResponse.json(
      { error: 'Failed to generate projection', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Generate projection with scenario
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { years = 5, scenario } = body

    const projection = await generateFinancialProjection(
      user.userId,
      years,
      scenario as ScenarioInput | undefined
    )

    return NextResponse.json(projection)
  } catch (error: any) {
    console.error('Error generating financial projection:', error)
    return NextResponse.json(
      { error: 'Failed to generate projection', details: error.message },
      { status: 500 }
    )
  }
}


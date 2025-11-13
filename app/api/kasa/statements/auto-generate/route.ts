import { NextResponse } from 'next/server'
import { generateMonthlyStatements } from '@/lib/scheduler'

// POST - Auto-generate monthly statements (can be called by cron job)
export async function POST() {
  try {
    const result = await generateMonthlyStatements()
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error auto-generating statements:', error)
    return NextResponse.json(
      { error: 'Failed to auto-generate statements', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Generate statements for a specific month
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    const result = await generateMonthlyStatements(year, month)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error generating statements:', error)
    return NextResponse.json(
      { error: 'Failed to generate statements', details: error.message },
      { status: 500 }
    )
  }
}


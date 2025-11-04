import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../lib/database-adapter.js'

export async function GET() {
  try {
    const statements = await db.getStatements()
    return NextResponse.json(statements)
  } catch (error) {
    console.error('Error fetching statements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statements' },
      { status: 500 }
    )
  }
}

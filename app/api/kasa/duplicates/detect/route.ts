import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { detectDuplicateFamilies } from '@/lib/duplicate-detection'

export const dynamic = 'force-dynamic'

// GET - Detect duplicate families
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const duplicates = await detectDuplicateFamilies(user.userId)

    return NextResponse.json({
      duplicates,
      count: duplicates.length
    })
  } catch (error: any) {
    console.error('Error detecting duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to detect duplicates', details: error.message },
      { status: 500 }
    )
  }
}


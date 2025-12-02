import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { generateMergePreview, mergeFamilies } from '@/lib/duplicate-detection'

export const dynamic = 'force-dynamic'

// POST - Generate merge preview
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { family1Id, family2Id, resolutions, action } = body

    if (!family1Id || !family2Id) {
      return NextResponse.json({ error: 'Both family IDs are required' }, { status: 400 })
    }

    if (action === 'preview') {
      const preview = await generateMergePreview(family1Id, family2Id, resolutions)
      return NextResponse.json({ preview })
    } else if (action === 'merge') {
      const mergedFamily = await mergeFamilies(family1Id, family2Id, resolutions || {}, user.userId)
      return NextResponse.json({ 
        success: true,
        mergedFamily,
        message: 'Families merged successfully'
      })
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "preview" or "merge"' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error merging families:', error)
    return NextResponse.json(
      { error: 'Failed to merge families', details: error.message },
      { status: 500 }
    )
  }
}


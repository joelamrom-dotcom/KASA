import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST - Import from Excel with field mapping
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('type') as string
    const mapping = JSON.parse(formData.get('mapping') as string || '{}')

    if (!file || !entityType) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 })
    }

    // Excel parsing would use xlsx library
    // For now, return structure
    return NextResponse.json({
      success: true,
      message: 'Excel import ready (xlsx library needed)',
      mapping,
      preview: []
    })
  } catch (error: any) {
    console.error('Error importing Excel:', error)
    return NextResponse.json(
      { error: 'Failed to import Excel', details: error.message },
      { status: 500 }
    )
  }
}


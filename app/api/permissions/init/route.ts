import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { initializePermissions } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

/**
 * POST /api/permissions/init
 * Initialize default permissions and roles (super_admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    await initializePermissions()
    
    return NextResponse.json({ message: 'Permissions and roles initialized successfully' })
  } catch (error: any) {
    console.error('Error initializing permissions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize permissions' },
      { status: 500 }
    )
  }
}


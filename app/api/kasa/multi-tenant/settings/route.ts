import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get organization settings
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Organization settings would be stored per user/org
    // This is a placeholder structure

    return NextResponse.json({
      organization: {
        name: 'Kasa Organization',
        branding: {
          logo: null,
          primaryColor: '#3b82f6',
          secondaryColor: '#8b5cf6'
        },
        customDomain: null,
        whiteLabel: false
      }
    })
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update organization settings
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    // Update organization settings logic would go here

    return NextResponse.json({
      success: true,
      message: 'Settings updated (placeholder)'
    })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    )
  }
}


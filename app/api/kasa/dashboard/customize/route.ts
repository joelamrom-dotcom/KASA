import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Dashboard } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get user's dashboard customization
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const dashboard = await Dashboard.findOne({ userId, isActive: true }).lean()

    return NextResponse.json({
      dashboard: dashboard || {
        layout: { type: 'grid', columns: 2, rows: 2 },
        components: []
      }
    })
  } catch (error: any) {
    console.error('Error fetching dashboard customization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update dashboard customization
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { layout, components } = body

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const dashboard = await Dashboard.findOneAndUpdate(
      { userId, isActive: true },
      {
        userId,
        name: 'My Dashboard',
        layout: layout || { type: 'grid', columns: 2, rows: 2 },
        components: components || []
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true, dashboard })
  } catch (error: any) {
    console.error('Error updating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard', details: error.message },
      { status: 500 }
    )
  }
}


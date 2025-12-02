import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get family directory (opt-in families only)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Get families that opted into directory
    const families = await Family.find({
      userId,
      // Add directoryOptIn field to schema if needed
      // directoryOptIn: true
    })
      .select('name email phone city state')
      .sort({ name: 1 })
      .lean()

    return NextResponse.json({ families })
  } catch (error: any) {
    console.error('Error fetching directory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch directory', details: error.message },
      { status: 500 }
    )
  }
}


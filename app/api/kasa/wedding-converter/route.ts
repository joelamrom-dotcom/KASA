import { NextRequest, NextResponse } from 'next/server'
import { convertMembersOnWeddingDate } from '@/lib/wedding-converter'
import connectDB from '@/lib/database'
import { AutomationSettings } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

// POST - Manually trigger wedding date conversions (for testing or manual runs)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Check if automation is enabled (if user is authenticated)
    try {
      const user = getAuthenticatedUser(request)
      if (user) {
        const mongoose = require('mongoose')
        const userObjectId = new mongoose.Types.ObjectId(user.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: userObjectId })
        
        if (automationSettings && !automationSettings.enableWeddingConversion) {
          return NextResponse.json({
            success: false,
            message: 'Wedding conversion automation is disabled for this account',
            converted: 0,
            members: []
          })
        }
      }
    } catch (authError) {
      // If no auth, continue (cron jobs may not have auth)
    }
    
    const result = await convertMembersOnWeddingDate()
    return NextResponse.json({
      message: 'Wedding date conversion completed',
      converted: result.converted,
      members: result.members.map((m: any) => ({
        id: m._id,
        name: `${m.firstName} ${m.lastName}`,
        weddingDate: m.weddingDate
      }))
    })
  } catch (error: any) {
    console.error('Error converting members on wedding date:', error)
    return NextResponse.json(
      { error: 'Failed to convert members on wedding date', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Check for members scheduled for conversion today
export async function GET(request: NextRequest) {
  try {
    const { convertMembersOnWeddingDate } = await import('@/lib/wedding-converter')
    const result = await convertMembersOnWeddingDate()
    return NextResponse.json({
      message: 'Wedding date conversion check completed',
      converted: result.converted,
      members: result.members.map((m: any) => ({
        id: m._id,
        name: `${m.firstName} ${m.lastName}`,
        weddingDate: m.weddingDate
      }))
    })
  } catch (error: any) {
    console.error('Error checking wedding date conversions:', error)
    return NextResponse.json(
      { error: 'Failed to check wedding date conversions', details: error.message },
      { status: 500 }
    )
  }
}


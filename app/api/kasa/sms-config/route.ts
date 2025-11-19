import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { SmsConfig } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

// GET - Get SMS configuration
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Build query - each user sees only their own settings
    const query: any = { 
      isActive: true,
      $and: [
        { userId: { $exists: true } },
        { userId: { $ne: null } },
        { userId: user.userId }
      ]
    }
    
    const config = await SmsConfig.findOne(query)
    
    if (!config) {
      return NextResponse.json({ error: 'SMS configuration not found' }, { status: 404 })
    }

    return NextResponse.json({
      defaultGateway: config.defaultGateway,
      emailSubject: config.emailSubject,
      isActive: config.isActive
    })
  } catch (error: any) {
    console.error('Error fetching SMS config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS configuration', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update SMS configuration
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { defaultGateway, emailSubject, isActive } = body
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const updateData: any = {
      userId: userObjectId,
      lastUpdated: new Date(),
    }
    
    if (defaultGateway) {
      updateData.defaultGateway = defaultGateway
    }
    if (emailSubject) {
      updateData.emailSubject = emailSubject
    }
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }
    
    const config = await SmsConfig.findOneAndUpdate(
      { userId: userObjectId },
      updateData,
      { new: true, upsert: true }
    )
    
    return NextResponse.json({
      defaultGateway: config.defaultGateway,
      emailSubject: config.emailSubject,
      isActive: config.isActive
    })
  } catch (error: any) {
    console.error('Error saving SMS config:', error)
    return NextResponse.json(
      { error: 'Failed to save SMS configuration', details: error.message },
      { status: 500 }
    )
  }
}


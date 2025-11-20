import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { SmsConfig } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

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
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.SETTINGS_VIEW))) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.SETTINGS_UPDATE))) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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
    
    const oldConfig = await SmsConfig.findOne({ userId: userObjectId })
    const config = await SmsConfig.findOneAndUpdate(
      { userId: userObjectId },
      updateData,
      { new: true, upsert: true }
    )
    
    // Create audit log entry
    if (oldConfig && Object.keys(updateData).length > 0) {
      const changedFields: any = {}
      Object.keys(updateData).forEach(key => {
        if (key !== 'lastUpdated' && key !== 'userId') {
          const oldValue = (oldConfig as any)[key]
          const newValue = updateData[key]
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changedFields[key] = { old: oldValue, new: newValue }
          }
        }
      })
      
      if (Object.keys(changedFields).length > 0) {
        await auditLogFromRequest(request, user, 'sms_config_update', 'settings', {
          entityId: config._id.toString(),
          entityName: 'SMS Configuration',
          changes: changedFields,
          description: `Updated SMS configuration - Changed: ${Object.keys(changedFields).join(', ')}`,
          metadata: {
            changedFields: Object.keys(changedFields),
          }
        })
      }
    }
    
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


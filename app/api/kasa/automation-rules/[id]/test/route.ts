import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { AutomationRule } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { executeAutomationRules } from '@/lib/automation-engine'

// POST - Test an automation rule with sample data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!(await hasPermission(user, PERMISSIONS.SETTINGS_UPDATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const { id } = await params
    const body = await request.json()
    const { triggerData } = body
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const rule = await AutomationRule.findOne({
      _id: id,
      userId: userObjectId,
    })
    
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }
    
    // Execute the rule with test data
    const result = await executeAutomationRules(
      triggerData || {
        type: rule.trigger.type,
        familyId: triggerData?.familyId,
        data: triggerData?.data || {},
      },
      user.userId
    )
    
    return NextResponse.json({
      success: true,
      message: 'Rule test executed',
      result,
    })
  } catch (error: any) {
    console.error('Error testing automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to test automation rule', details: error.message },
      { status: 500 }
    )
  }
}

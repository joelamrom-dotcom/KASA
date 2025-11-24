import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { AutomationRule, AutomationRuleExecution } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// GET - Get a specific automation rule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!(await hasPermission(user, PERMISSIONS.SETTINGS_VIEW))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const rule = await AutomationRule.findOne({
      _id: params.id,
      userId: userObjectId,
    })
    
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }
    
    // Get execution history
    const executions = await AutomationRuleExecution.find({
      ruleId: rule._id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
    
    return NextResponse.json({
      ...rule.toObject(),
      recentExecutions: executions,
    })
  } catch (error: any) {
    console.error('Error fetching automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation rule', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update an automation rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!(await hasPermission(user, PERMISSIONS.SETTINGS_UPDATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const rule = await AutomationRule.findOne({
      _id: params.id,
      userId: userObjectId,
    })
    
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }
    
    // Update fields
    if (body.name !== undefined) rule.name = body.name
    if (body.description !== undefined) rule.description = body.description
    if (body.trigger !== undefined) rule.trigger = body.trigger
    if (body.conditions !== undefined) rule.conditions = body.conditions
    if (body.actions !== undefined) {
      rule.actions = body.actions.map((action: any, index: number) => ({
        ...action,
        order: action.order !== undefined ? action.order : index,
      }))
    }
    if (body.isActive !== undefined) rule.isActive = body.isActive
    if (body.onError !== undefined) rule.onError = body.onError
    if (body.maxExecutionsPerDay !== undefined) rule.maxExecutionsPerDay = body.maxExecutionsPerDay
    
    await rule.save()
    
    return NextResponse.json(rule)
  } catch (error: any) {
    console.error('Error updating automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to update automation rule', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete an automation rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!(await hasPermission(user, PERMISSIONS.SETTINGS_UPDATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const rule = await AutomationRule.findOneAndDelete({
      _id: params.id,
      userId: userObjectId,
    })
    
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Rule deleted' })
  } catch (error: any) {
    console.error('Error deleting automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete automation rule', details: error.message },
      { status: 500 }
    )
  }
}


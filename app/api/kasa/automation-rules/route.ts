import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { AutomationRule } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// GET - List all automation rules for current user
export async function GET(request: NextRequest) {
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
    
    const rules = await AutomationRule.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .lean()
    
    return NextResponse.json(rules)
  } catch (error: any) {
    console.error('Error fetching automation rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation rules', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new automation rule
export async function POST(request: NextRequest) {
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
    const { name, description, trigger, conditions, actions, isActive, onError, maxExecutionsPerDay } = body
    
    if (!name || !trigger || !actions || actions.length === 0) {
      return NextResponse.json(
        { error: 'Name, trigger, and at least one action are required' },
        { status: 400 }
      )
    }
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const rule = await AutomationRule.create({
      userId: userObjectId,
      name,
      description,
      trigger,
      conditions: conditions || [],
      actions: actions.map((action: any, index: number) => ({
        ...action,
        order: action.order !== undefined ? action.order : index,
      })),
      isActive: isActive !== undefined ? isActive : true,
      onError: onError || 'notify',
      maxExecutionsPerDay: maxExecutionsPerDay || 100,
    })
    
    return NextResponse.json(rule, { status: 201 })
  } catch (error: any) {
    console.error('Error creating automation rule:', error)
    return NextResponse.json(
      { error: 'Failed to create automation rule', details: error.message },
      { status: 500 }
    )
  }
}


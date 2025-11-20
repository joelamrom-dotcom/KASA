import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Task, Family, FamilyMember } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

// GET - Get all tasks with optional filters (filtered by user)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const dueDate = searchParams.get('dueDate') // Filter by due date (e.g., 'today', 'overdue', 'upcoming')
    
    const query: any = {}
    
    // Check permission
    const canView = await hasPermission(user, PERMISSIONS.TASKS_VIEW)
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Only super_admin sees all tasks, others see only their own
    if (user.role !== 'super_admin') {
      query.userId = user.userId
    }
    
    if (status) {
      query.status = status
    }
    
    if (priority) {
      query.priority = priority
    }
    
    if (dueDate === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      query.dueDate = { $gte: today, $lt: tomorrow }
    } else if (dueDate === 'overdue') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      query.dueDate = { $lt: today }
      query.status = { $ne: 'completed' }
    } else if (dueDate === 'upcoming') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      query.dueDate = { $gte: today }
    }
    
    const tasks = await Task.find(query)
      .populate('relatedFamilyId', 'name')
      .populate('relatedMemberId', 'firstName lastName')
      .sort({ dueDate: 1, priority: -1 })
      .lean()
    
    return NextResponse.json(tasks)
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.TASKS_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { 
      title, 
      description, 
      dueDate, 
      email, 
      status, 
      priority, 
      relatedFamilyId, 
      relatedMemberId, 
      relatedPaymentId,
      notes 
    } = body

    if (!title || !dueDate || !email) {
      return NextResponse.json(
        { error: 'Title, due date, and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // If relatedFamilyId is provided, verify user has access
    if (relatedFamilyId && !isAdmin(user)) {
      const family = await Family.findById(relatedFamilyId)
      if (!family || family.userId?.toString() !== user.userId) {
        return NextResponse.json(
          { error: 'Forbidden - You do not have access to this family' },
          { status: 403 }
        )
      }
    }

    const task = await Task.create({
      userId: user.userId, // Associate task with user
      title,
      description: description || undefined,
      dueDate: new Date(dueDate),
      email,
      status: status || 'pending',
      priority: priority || 'medium',
      relatedFamilyId: relatedFamilyId || undefined,
      relatedMemberId: relatedMemberId || undefined,
      relatedPaymentId: relatedPaymentId || undefined,
      notes: notes || undefined
    })

    const taskObj = task.toObject ? task.toObject() : task
    
    // Create audit log entry
    const family = relatedFamilyId ? await Family.findById(relatedFamilyId) : null
    await auditLogFromRequest(request, user, 'task_create', 'task', {
      entityId: taskObj._id.toString(),
      entityName: title,
      description: `Created task "${title}"${family ? ` for family "${family.name}"` : ''}`,
      metadata: {
        title,
        status: status || 'pending',
        priority: priority || 'medium',
        dueDate: new Date(dueDate),
        relatedFamilyId,
      }
    })
    
    return NextResponse.json(taskObj, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create task' },
      { status: 500 }
    )
  }
}


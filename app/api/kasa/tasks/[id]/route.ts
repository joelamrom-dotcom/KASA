import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Task } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const task = await Task.findById(params.id)
      .populate('relatedFamilyId', 'name')
      .populate('relatedMemberId', 'firstName lastName')
      .lean()
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(task)
  } catch (error: any) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PUT - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
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

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
      updateData.email = email
    }
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (relatedFamilyId !== undefined) updateData.relatedFamilyId = relatedFamilyId || null
    if (relatedMemberId !== undefined) updateData.relatedMemberId = relatedMemberId || null
    if (relatedPaymentId !== undefined) updateData.relatedPaymentId = relatedPaymentId || null
    if (notes !== undefined) updateData.notes = notes

    // If status is being set to completed, set completedAt
    if (status === 'completed' && !body.completedAt) {
      updateData.completedAt = new Date()
    } else if (status !== 'completed' && body.completedAt === null) {
      updateData.completedAt = null
    }

    const task = await Task.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('relatedFamilyId', 'name')
      .populate('relatedMemberId', 'firstName lastName')
      .lean()

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error: any) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const task = await Task.findByIdAndDelete(params.id)
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete task' },
      { status: 500 }
    )
  }
}


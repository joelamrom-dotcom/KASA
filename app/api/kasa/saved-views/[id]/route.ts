import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { SavedView } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const view = await SavedView.findOne({
      _id: params.id,
      $or: [
        { userId: user.userId },
        { isPublic: true },
        { sharedWith: user.userId },
      ],
    }).lean()

    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    return NextResponse.json(view)
  } catch (error: any) {
    console.error('Error fetching saved view:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch saved view' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const view = await SavedView.findById(params.id)

    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    // Check ownership
    if (view.userId.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, filters, isDefault, isPublic } = body

    // If setting as default, unset other defaults for this entity type
    if (isDefault) {
      await SavedView.updateMany(
        { userId: user.userId, entityType: view.entityType, isDefault: true, _id: { $ne: params.id } },
        { $set: { isDefault: false } }
      )
    }

    if (name) view.name = name
    if (description !== undefined) view.description = description
    if (filters) view.filters = filters
    if (isDefault !== undefined) view.isDefault = isDefault
    if (isPublic !== undefined) view.isPublic = isPublic

    const oldView = { ...view.toObject() }
    await view.save()

    // Create audit log entry
    const changedFields: any = {}
    Object.keys(body).forEach(key => {
      if (key !== 'isDefault' && oldView[key] !== body[key]) {
        changedFields[key] = { old: oldView[key], new: body[key] }
      }
    })
    
    if (Object.keys(changedFields).length > 0) {
      await auditLogFromRequest(request, user, 'saved_view_update', 'saved_view', {
        entityId: params.id,
        entityName: view.name,
        changes: changedFields,
        description: `Updated saved view "${view.name}"`,
        metadata: {
          entityType: view.entityType,
          changedFields: Object.keys(changedFields),
        }
      })
    }

    return NextResponse.json(view)
  } catch (error: any) {
    console.error('Error updating saved view:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update saved view' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const view = await SavedView.findById(params.id)

    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    // Check ownership
    if (view.userId.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await SavedView.findByIdAndDelete(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting saved view:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete saved view' },
      { status: 500 }
    )
  }
}


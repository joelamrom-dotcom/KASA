import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { PaymentLink, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET - Get all payment links for user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - users with payments.view see all payment links, others see only their own
    const canViewAll = await hasPermission(user, PERMISSIONS.PAYMENTS_VIEW)
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get('familyId')

    const query: any = canViewAll ? {} : { userId: userObjectId }
    if (familyId) {
      query.familyId = new mongoose.Types.ObjectId(familyId)
    }

    const links = await PaymentLink.find(query)
      .populate('familyId', 'name')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(links.map((l: any) => ({
      ...l,
      _id: l._id.toString(),
      familyId: l.familyId?._id?.toString(),
      familyName: (l.familyId as any)?.name,
      linkUrl: `${request.nextUrl.origin}/pay/${l.linkId}`
    })))
  } catch (error: any) {
    console.error('Error fetching payment links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment links', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create payment link
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.PAYMENTS_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      familyId,
      amount,
      description,
      paymentPlan,
      expiresAt,
      maxUses
    } = body

    if (!familyId) {
      return NextResponse.json({ error: 'familyId is required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    // Generate unique link ID
    const linkId = crypto.randomBytes(16).toString('hex')

    const paymentLink = await PaymentLink.create({
      userId: userObjectId,
      familyId: new mongoose.Types.ObjectId(familyId),
      linkId,
      amount,
      description,
      paymentPlan: paymentPlan || { enabled: false },
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxUses,
      isActive: true
    })

    const linkUrl = `${request.nextUrl.origin}/pay/${linkId}`
    
    // Get family for audit log
    const family = await Family.findById(familyId)

    // Create audit log entry
    await auditLogFromRequest(request, user, 'payment_link_create', 'payment_link', {
      entityId: paymentLink._id.toString(),
      entityName: `Payment link for ${family?.name || familyId}`,
      description: `Created payment link for ${amount ? `$${amount}` : 'payment plan'}${family ? ` for family "${family.name}"` : ''}`,
      metadata: {
        linkId,
        amount,
        familyId,
        familyName: family?.name,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        maxUses,
      }
    })

    return NextResponse.json({
      ...paymentLink.toObject(),
      _id: paymentLink._id.toString(),
      linkUrl
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating payment link:', error)
    return NextResponse.json(
      { error: 'Failed to create payment link', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete payment link
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Payment link ID required' }, { status: 400 })
    }

    // Check permission or ownership
    const canDeleteAll = await hasPermission(user, PERMISSIONS.PAYMENTS_DELETE)
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    // Build query based on permissions
    const query: any = canDeleteAll ? { _id: id } : { _id: id, userId: userObjectId }
    
    // Get link before deleting for audit log
    const link = await PaymentLink.findOne(query).populate('familyId', 'name')
    
    if (!link) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }
    
    // Check ownership if user doesn't have delete permission
    if (!canDeleteAll && link.userId?.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to delete this payment link' },
        { status: 403 }
      )
    }

    await PaymentLink.findOneAndUpdate(
      query,
      { isActive: false },
      { new: true }
    )

    // Create audit log entry
    await auditLogFromRequest(request, user, 'payment_link_delete', 'payment_link', {
      entityId: id,
      entityName: `Payment link ${link.linkId}`,
      description: `Deleted payment link ${link.linkId}${link.familyId ? ` for family "${(link.familyId as any).name}"` : ''}`,
      metadata: {
        linkId: link.linkId,
        familyId: link.familyId?.toString(),
        familyName: (link.familyId as any)?.name,
      }
    })

    return NextResponse.json({ message: 'Payment link deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting payment link:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment link', details: error.message },
      { status: 500 }
    )
  }
}


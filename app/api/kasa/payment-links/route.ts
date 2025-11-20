import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { PaymentLink, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
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

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get('familyId')

    const query: any = { userId: userObjectId }
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

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const link = await PaymentLink.findOneAndUpdate(
      { _id: id, userId: userObjectId },
      { isActive: false },
      { new: true }
    )

    if (!link) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Payment link deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting payment link:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment link', details: error.message },
      { status: 500 }
    )
  }
}


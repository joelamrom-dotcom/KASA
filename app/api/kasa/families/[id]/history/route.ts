import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { AuditLog, Payment, FamilyMember, LifecycleEvent, FamilyNote } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get complete history timeline for a family
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

    const mongoose = require('mongoose')
    const familyId = new mongoose.Types.ObjectId(params.id)

    // Get audit logs for this family
    const auditLogs = await AuditLog.find({
      entityType: 'family',
      entityId: familyId
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    // Get payments
    const payments = await Payment.find({ familyId })
      .sort({ paymentDate: -1 })
      .limit(50)
      .lean()

    // Get member events
    const members = await FamilyMember.find({ familyId }).lean()
    const memberIds = members.map(m => m._id)
    
    const memberAuditLogs = await AuditLog.find({
      entityType: 'member',
      entityId: { $in: memberIds }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    // Get lifecycle events
    const lifecycleEvents = await LifecycleEvent.find({ familyId })
      .sort({ eventDate: -1 })
      .limit(50)
      .lean()

    // Get notes
    const notes = await FamilyNote.find({ familyId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    // Combine and sort all events by date
    const timeline: any[] = []

    auditLogs.forEach((log: any) => {
      timeline.push({
        type: 'audit',
        date: log.createdAt,
        action: log.action,
        description: log.description,
        user: log.userEmail,
        changes: log.changes
      })
    })

    payments.forEach((payment: any) => {
      timeline.push({
        type: 'payment',
        date: payment.paymentDate,
        action: 'payment_created',
        description: `Payment of $${payment.amount.toLocaleString()}`,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod
      })
    })

    memberAuditLogs.forEach((log: any) => {
      timeline.push({
        type: 'member',
        date: log.createdAt,
        action: log.action,
        description: log.description,
        user: log.userEmail
      })
    })

    lifecycleEvents.forEach((event: any) => {
      timeline.push({
        type: 'lifecycle_event',
        date: event.eventDate,
        action: 'lifecycle_event_created',
        description: `${event.eventType} event`,
        eventType: event.eventType,
        amount: event.amount
      })
    })

    notes.forEach((note: any) => {
      timeline.push({
        type: 'note',
        date: note.createdAt,
        action: 'note_created',
        description: note.note,
        checked: note.checked
      })
    })

    // Sort by date (newest first)
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      timeline: timeline.slice(0, 200), // Limit to 200 most recent events
      stats: {
        totalEvents: timeline.length,
        payments: payments.length,
        members: members.length,
        lifecycleEvents: lifecycleEvents.length,
        notes: notes.length
      }
    })
  } catch (error: any) {
    console.error('Error fetching family history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch family history', details: error.message },
      { status: 500 }
    )
  }
}


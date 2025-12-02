import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, FamilyMember, PaymentPlan } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Execute bulk operations
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { operation, filters, updates, messageData } = body

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Get user's families
    const userFamilies = await Family.find({ userId }).select('_id').lean()
    const userFamilyIds = userFamilies.map(f => f._id)

    let results: any = {}

    switch (operation) {
      case 'update_payment_plans': {
        // Bulk update payment plans based on filters
        const memberQuery: any = { familyId: { $in: userFamilyIds } }
        
        if (filters?.ageRange) {
          const members = await FamilyMember.find(memberQuery).lean()
          const filteredMembers = members.filter((m: any) => {
            if (!m.birthDate) return false
            const age = Math.floor((Date.now() - new Date(m.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            return age >= filters.ageRange.min && age <= filters.ageRange.max
          })
          const memberIds = filteredMembers.map((m: any) => m._id)
          memberQuery._id = { $in: memberIds }
        }
        
        if (filters?.currentPlan) {
          memberQuery.paymentPlan = filters.currentPlan
        }
        
        if (filters?.gender) {
          memberQuery.gender = filters.gender
        }

        if (!updates?.newPlan) {
          return NextResponse.json({ error: 'New plan number is required' }, { status: 400 })
        }

        const updateResult = await FamilyMember.updateMany(memberQuery, {
          $set: { paymentPlan: updates.newPlan }
        })

        results = {
          success: true,
          updated: updateResult.modifiedCount,
          matched: updateResult.matchedCount
        }
        break
      }

      case 'send_messages': {
        // Bulk messaging
        if (!messageData?.subject || !messageData?.body) {
          return NextResponse.json({ error: 'Message subject and body are required' }, { status: 400 })
        }

        const familyQuery: any = { userId }
        
        if (filters?.tags) {
          familyQuery.tags = { $in: filters.tags }
        }
        
        if (filters?.paymentPlan) {
          familyQuery.paymentPlanId = filters.paymentPlan
        }

        const families = await Family.find(familyQuery).lean()
        const recipients = families
          .filter((f: any) => f.email && f.receiveEmails !== false)
          .map((f: any) => f.email)

        // Send messages (would integrate with email service)
        results = {
          success: true,
          recipients: recipients.length,
          message: `Prepared to send to ${recipients.length} families`
        }
        break
      }

      case 'update_status': {
        // Bulk status updates
        const familyQuery: any = { userId }
        
        if (filters?.tags) {
          familyQuery.tags = { $in: filters.tags }
        }

        const updateData: any = {}
        if (updates?.isActive !== undefined) updateData.isActive = updates.isActive
        if (updates?.receiveEmails !== undefined) updateData.receiveEmails = updates.receiveEmails
        if (updates?.receiveSMS !== undefined) updateData.receiveSMS = updates.receiveSMS

        const updateResult = await Family.updateMany(familyQuery, { $set: updateData })

        results = {
          success: true,
          updated: updateResult.modifiedCount,
          matched: updateResult.matchedCount
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error executing bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to execute bulk operation', details: error.message },
      { status: 500 }
    )
  }
}


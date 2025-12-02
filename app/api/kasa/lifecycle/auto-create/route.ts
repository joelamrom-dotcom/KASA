import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { FamilyMember, LifecycleEventPayment, Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Auto-create lifecycle events
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventType = 'all' } = body // 'bar_mitzvah', 'bat_mitzvah', 'all'

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const families = await Family.find({ userId }).select('_id').lean()
    const familyIds = families.map((f: any) => f._id)

    const members = await FamilyMember.find({ familyId: { $in: familyIds } })
      .populate('familyId', 'name')
      .lean()

    const created: any[] = []
    const now = new Date()
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

    for (const member of members) {
      if (!member.birthDate) continue

      const birthDate = new Date(member.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear() - 
        (today.getMonth() < birthDate.getMonth() || 
         (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0)
      const barMitzvahDate = member.barMitzvahDate ? new Date(member.barMitzvahDate) : null
      const batMitzvahDate = member.batMitzvahDate ? new Date(member.batMitzvahDate) : null

      // Auto-create Bar Mitzvah event if member is 13 and event doesn't exist
      if ((eventType === 'bar_mitzvah' || eventType === 'all') && 
          age >= 13 && 
          member.gender === 'male' && 
          barMitzvahDate && 
          barMitzvahDate <= oneYearFromNow) {
        
        const existing = await LifecycleEventPayment.findOne({
          familyId: member.familyId,
          memberId: member._id,
          eventType: 'bar_mitzvah',
          eventDate: barMitzvahDate
        })

        if (!existing) {
          const event = await LifecycleEventPayment.create({
            familyId: member.familyId,
            memberId: member._id,
            eventType: 'bar_mitzvah',
            eventDate: barMitzvahDate,
            year: barMitzvahDate.getFullYear(),
            amount: 1800 // Default amount
          })
          created.push(event)
        }
      }

      // Auto-create Bat Mitzvah event
      if ((eventType === 'bat_mitzvah' || eventType === 'all') && 
          age >= 12 && 
          member.gender === 'female' && 
          batMitzvahDate && 
          batMitzvahDate <= oneYearFromNow) {
        
        const existing = await LifecycleEventPayment.findOne({
          familyId: member.familyId,
          memberId: member._id,
          eventType: 'bat_mitzvah',
          eventDate: batMitzvahDate
        })

        if (!existing) {
          const event = await LifecycleEventPayment.create({
            familyId: member.familyId,
            memberId: member._id,
            eventType: 'bat_mitzvah',
            eventDate: batMitzvahDate,
            year: batMitzvahDate.getFullYear(),
            amount: 1800 // Default amount
          })
          created.push(event)
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      events: created
    })
  } catch (error: any) {
    console.error('Error auto-creating events:', error)
    return NextResponse.json(
      { error: 'Failed to auto-create events', details: error.message },
      { status: 500 }
    )
  }
}


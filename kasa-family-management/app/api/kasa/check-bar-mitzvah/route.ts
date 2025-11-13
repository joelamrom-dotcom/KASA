import { NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { FamilyMember, LifecycleEventPayment } from '@/lib/models'
import { hasReachedBarMitzvahAge, calculateBarMitzvahDate } from '@/lib/hebrew-date'

// POST - Check all members and auto-add bar/bat mitzvah events for those who turned 13
export async function POST() {
  try {
    await connectDB()
    
    // Find all members with Hebrew birth dates who haven't had bar mitzvah event added yet
    const members = await FamilyMember.find({
      $and: [
        { hebrewBirthDate: { $exists: true } },
        { hebrewBirthDate: { $ne: null } },
        { hebrewBirthDate: { $ne: '' } }
      ],
      barMitzvahEventAdded: { $ne: true }
    })

    const processed = []
    const errors = []

    for (const member of members) {
      try {
        if (member.hebrewBirthDate && hasReachedBarMitzvahAge(member.hebrewBirthDate)) {
          // Calculate bar mitzvah date
          const barMitzvahDate = calculateBarMitzvahDate(member.hebrewBirthDate) || new Date()
          const eventYear = barMitzvahDate.getFullYear()
          
          // Check if event already exists
          const existingEvent = await LifecycleEventPayment.findOne({
            familyId: member.familyId,
            eventType: 'bar_mitzvah',
            year: eventYear,
            notes: { $regex: member.firstName }
          })

          if (!existingEvent) {
            // Create bar/bat mitzvah lifecycle event
            await LifecycleEventPayment.create({
              familyId: member.familyId,
              eventType: 'bar_mitzvah',
              amount: 1800,
              eventDate: barMitzvahDate,
              year: eventYear,
              notes: `Auto-added: ${member.gender === 'female' ? 'Bat' : 'Bar'} Mitzvah for ${member.firstName} ${member.lastName} (turned 13 in Hebrew calendar)`
            })
          }

          // Update member
          member.barMitzvahDate = barMitzvahDate
          member.barMitzvahEventAdded = true
          await member.save()

          processed.push({
            memberId: member._id.toString(),
            name: `${member.firstName} ${member.lastName}`,
            barMitzvahDate: barMitzvahDate.toISOString()
          })
        }
      } catch (error: any) {
        errors.push({
          memberId: member._id.toString(),
          name: `${member.firstName} ${member.lastName}`,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: processed.length,
      failed: errors.length,
      members: processed,
      errors: errors
    })
  } catch (error: any) {
    console.error('Error checking bar mitzvah:', error)
    return NextResponse.json(
      { error: 'Failed to check bar mitzvah', details: error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { FamilyMember } from '@/lib/models'
import { convertToHebrewDate, calculateBarMitzvahDate, hasReachedBarMitzvahAge } from '@/lib/hebrew-date'
import { LifecycleEventPayment } from '@/lib/models'
import mongoose from 'mongoose'

// PUT - Update a member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    // Ensure database connection is ready
    const db = await connectDB()
    if (!db || db.connection.readyState !== 1) {
      throw new Error('Database connection not ready')
    }
    
    const body = await request.json()
    const { firstName, hebrewFirstName, lastName, hebrewLastName, birthDate, hebrewBirthDate, gender, weddingDate, spouseName } = body

    // Validate required fields
    if (!firstName || !lastName || !birthDate) {
      return NextResponse.json(
        { error: 'First name, last name, and birth date are required' },
        { status: 400 }
      )
    }

    // Validate date format
    const birthDateObj = new Date(birthDate)
    if (isNaN(birthDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid birth date format' },
        { status: 400 }
      )
    }

    // Auto-calculate Hebrew date if not provided
    let finalHebrewBirthDate = hebrewBirthDate
    if (!finalHebrewBirthDate || !finalHebrewBirthDate.trim()) {
      try {
        finalHebrewBirthDate = convertToHebrewDate(birthDateObj)
      } catch (dateError) {
        console.error('Error converting to Hebrew date:', dateError)
        // Continue without Hebrew date if conversion fails
      }
    }

    // Calculate bar mitzvah date if Hebrew date is provided
    let barMitzvahDate: Date | null = null
    if (finalHebrewBirthDate && finalHebrewBirthDate.trim()) {
      try {
        barMitzvahDate = calculateBarMitzvahDate(finalHebrewBirthDate)
      } catch (dateError) {
        console.error('Error calculating bar mitzvah date:', dateError)
        // Continue without bar mitzvah date if calculation fails
      }
    }

    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDateObj,
    }

    // Add Hebrew name fields if provided
    if ('hebrewFirstName' in body) {
      updateData.hebrewFirstName = hebrewFirstName || null
    }
    if ('hebrewLastName' in body) {
      updateData.hebrewLastName = hebrewLastName || null
    }

    // Only add optional fields if they have values
    if (finalHebrewBirthDate && finalHebrewBirthDate.trim()) {
      updateData.hebrewBirthDate = finalHebrewBirthDate.trim()
    }
    if (gender && (gender === 'male' || gender === 'female')) {
      updateData.gender = gender
    }
    if (barMitzvahDate) {
      updateData.barMitzvahDate = barMitzvahDate
    }
    // Handle wedding date - if provided, will trigger auto-conversion
    if (weddingDate) {
      updateData.weddingDate = new Date(weddingDate)
    }
    if (spouseName) {
      updateData.spouseName = spouseName.trim()
    }
    
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(params.memberId) || !mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid member or family ID' },
        { status: 400 }
      )
    }

    // Mongoose automatically converts string IDs to ObjectIds, so we don't need explicit conversion
    const member = await FamilyMember.findOneAndUpdate(
      { _id: params.memberId, familyId: params.id },
      { $set: updateData },
      { new: true, runValidators: true }
    )

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Auto-assign payment plan (Plan 3 - Bucher Plan) when male turns 13 in Hebrew years (only if not already assigned)
    if (gender === 'male' && finalHebrewBirthDate && finalHebrewBirthDate.trim() && hasReachedBarMitzvahAge(finalHebrewBirthDate) && !member.paymentPlanAssigned) {
      try {
        // Assign Plan 3 (Bucher Plan, $1,800/year)
        member.paymentPlan = 3
        member.paymentPlanAssigned = true
        await member.save()
        console.log(`Auto-assigned Plan 3 (Bucher Plan) to ${firstName} ${lastName} (male, turned 13 in Hebrew calendar)`)
      } catch (planError: any) {
        console.error('Error auto-assigning payment plan:', planError)
        // Don't fail the update if plan assignment fails
      }
    }

    // Auto-add bar/bat mitzvah lifecycle event if we can calculate the bar mitzvah date
    // This adds the expense to the yearly calculation for the bar mitzvah year, even if it's in the future
    if (barMitzvahDate && !member.barMitzvahEventAdded) {
      try {
        // Look up bar_mitzvah event type from database
        const { LifecycleEvent } = await import('@/lib/models')
        const barMitzvahEventType = await LifecycleEvent.findOne({ type: 'bar_mitzvah' })
        
        if (barMitzvahEventType) {
          const eventType = 'bar_mitzvah'
          const eventAmount = barMitzvahEventType.amount // Get amount from database
          const eventYear = barMitzvahDate.getFullYear()

          await LifecycleEventPayment.create({
            familyId: params.id, // Mongoose will auto-convert string to ObjectId
            eventType,
            amount: eventAmount,
            eventDate: barMitzvahDate,
            year: eventYear,
            notes: `Auto-added: ${gender === 'female' ? 'Bat' : 'Bar'} Mitzvah for ${firstName} ${lastName} (Bar Mitzvah date: ${barMitzvahDate.toLocaleDateString()})`
          })

          member.barMitzvahEventAdded = true
          await member.save()
          
          console.log(`✅ Added Bar Mitzvah event for ${firstName} ${lastName} (will appear in year ${eventYear} calculation)`)
        } else {
          console.warn('Bar Mitzvah event type not found in database. Skipping auto-add.')
        }
      } catch (eventError: any) {
        console.error('Error auto-adding bar/bat mitzvah event:', eventError)
        // Don't fail the update if event addition fails
      }
    }

    // Note: Conversion happens on the wedding date via scheduled job, not immediately

    return NextResponse.json(member)
  } catch (error: any) {
    console.error('Error updating member:', error)
    console.error('Error stack:', error.stack)
    console.error('MongoDB connection state:', mongoose.connection.readyState)
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to update member'
    if (error.message?.includes('buffering timed out')) {
      errorMessage = 'Database connection timeout. Please check if MongoDB is running.'
    } else if (error.message?.includes('connection not ready')) {
      errorMessage = 'Database connection not ready. Please try again.'
    }
    
    return NextResponse.json(
      { error: 'Failed to update member', details: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE - Delete a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    await connectDB()
    
    const member = await FamilyMember.findOneAndDelete({
      _id: params.memberId,
      familyId: params.id
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Member deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Failed to delete member', details: error.message },
      { status: 500 }
    )
  }
}


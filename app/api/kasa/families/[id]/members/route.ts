import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { FamilyMember, LifecycleEventPayment, Family } from '@/lib/models'
import { calculateBarMitzvahDate, hasReachedBarMitzvahAge } from '@/lib/hebrew-date'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

// GET - Get all members for a family
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check if family exists and user has access
    const family = await Family.findById(params.id)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check permission or ownership
    const canViewAll = await hasPermission(user, PERMISSIONS.MEMBERS_VIEW)
    const isFamilyOwner = family.userId?.toString() === user.userId
    const isFamilyMember = user.role === 'family' && user.familyId === params.id
    
    if (!canViewAll && !isFamilyOwner && !isFamilyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this family' },
        { status: 403 }
      )
    }
    
    const members = await FamilyMember.find({ familyId: params.id }).sort({ birthDate: 1 })
    return NextResponse.json(members)
  } catch (error: any) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Add a new member to a family
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check if family exists and user has access
    const family = await Family.findById(params.id)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check permission or ownership
    const canCreateAll = await hasPermission(user, PERMISSIONS.MEMBERS_CREATE)
    const isFamilyOwner = family.userId?.toString() === user.userId
    
    if (!canCreateAll && !isFamilyOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to add members to this family' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { 
      firstName, hebrewFirstName, lastName, hebrewLastName, birthDate, hebrewBirthDate, gender,
      weddingDate, spouseName, spouseFirstName, spouseHebrewName, spouseFatherHebrewName,
      spouseCellPhone, phone, email, address, city, state, zip
    } = body

    if (!firstName || !lastName || !birthDate) {
      return NextResponse.json(
        { error: 'First name, last name, and birth date are required' },
        { status: 400 }
      )
    }

    // Auto-calculate Hebrew date if not provided
    let finalHebrewBirthDate = hebrewBirthDate
    if (!finalHebrewBirthDate && birthDate) {
      const { convertToHebrewDate } = await import('@/lib/hebrew-date')
      const gregorianDate = new Date(birthDate)
      finalHebrewBirthDate = convertToHebrewDate(gregorianDate)
    }

    // Calculate bar mitzvah date if Hebrew date is provided
    let barMitzvahDate: Date | null = null
    if (finalHebrewBirthDate && finalHebrewBirthDate.trim()) {
      barMitzvahDate = calculateBarMitzvahDate(finalHebrewBirthDate)
    }

    const member = await FamilyMember.create({
      familyId: params.id,
      firstName,
      hebrewFirstName: hebrewFirstName || undefined,
      lastName,
      hebrewLastName: hebrewLastName || undefined,
      birthDate: new Date(birthDate),
      hebrewBirthDate: finalHebrewBirthDate || undefined,
      gender: gender || undefined,
      weddingDate: weddingDate ? new Date(weddingDate) : undefined,
      spouseName: spouseName || undefined,
      spouseFirstName: spouseFirstName || undefined,
      spouseHebrewName: spouseHebrewName || undefined,
      spouseFatherHebrewName: spouseFatherHebrewName || undefined,
      spouseCellPhone: spouseCellPhone || undefined,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zip: zip || undefined,
      barMitzvahDate: barMitzvahDate || undefined,
      barMitzvahEventAdded: false,
      paymentPlan: null,
      paymentPlanAssigned: false
    })

    // Create audit log entry
    await auditLogFromRequest(request, user, 'member_create', 'member', {
      entityId: member._id.toString(),
      entityName: `${firstName} ${lastName}`,
      description: `Created member "${firstName} ${lastName}" for family "${family.name}"`,
      metadata: {
        familyId: params.id,
        familyName: family.name,
        memberName: `${firstName} ${lastName}`,
        gender,
        birthDate: new Date(birthDate),
      }
    })

    // Auto-assign payment plan (Plan 3 - Bucher Plan) when male turns 13 in Hebrew years
    if (gender === 'male' && finalHebrewBirthDate && finalHebrewBirthDate.trim() && hasReachedBarMitzvahAge(finalHebrewBirthDate)) {
      try {
        // Assign Plan 3 (Bucher Plan, $1,800/year)
        member.paymentPlan = 3
        member.paymentPlanAssigned = true
        await member.save()
        console.log(`Auto-assigned Plan 3 (Bucher Plan) to ${firstName} ${lastName} (male, turned 13 in Hebrew calendar)`)
        
        // Auto-create Stripe Customer for the member (male turned 13)
        try {
          const { createStripeCustomerForMember } = await import('@/lib/stripe-customer-helpers')
          await createStripeCustomerForMember(member._id.toString())
        } catch (stripeError: any) {
          // Log error but don't fail member creation if Stripe customer creation fails
          console.error(`⚠️ Failed to create Stripe Customer for member ${firstName} ${lastName}:`, stripeError.message)
        }
      } catch (planError) {
        console.error('Error auto-assigning payment plan:', planError)
        // Don't fail the member creation if plan assignment fails
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
            familyId: params.id,
            eventType,
            amount: eventAmount,
            eventDate: barMitzvahDate,
            year: eventYear,
            notes: `Auto-added: ${gender === 'female' ? 'Bat' : 'Bar'} Mitzvah for ${firstName} ${lastName} (Bar Mitzvah date: ${barMitzvahDate.toLocaleDateString()})`
          })

          // Mark that bar mitzvah event was added
          member.barMitzvahEventAdded = true
          await member.save()
          
          console.log(`✅ Added Bar Mitzvah event for ${firstName} ${lastName} (will appear in year ${eventYear} calculation)`)
        } else {
          console.warn('Bar Mitzvah event type not found in database. Skipping auto-add.')
        }
      } catch (eventError) {
        console.error('Error auto-adding bar/bat mitzvah event:', eventError)
        // Don't fail the member creation if event addition fails
      }
    }

    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Failed to create member', details: error.message },
      { status: 500 }
    )
  }
}


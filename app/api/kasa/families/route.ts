import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember, PaymentPlan } from '@/lib/models'

// GET - Get all families
export async function GET() {
  try {
    await connectDB()
    const families = await Family.find({}).sort({ name: 1 })
    
    // Get member counts and ensure paymentPlanId is set for each family
    const familiesWithMembers = await Promise.all(
      families.map(async (family) => {
        const members = await FamilyMember.find({ familyId: family._id })
        const familyObj = family.toObject()
        
        // If paymentPlanId is missing but currentPlan exists, find and set paymentPlanId
        if (!familyObj.paymentPlanId && familyObj.currentPlan) {
          try {
            const paymentPlan = await PaymentPlan.findOne({ planNumber: familyObj.currentPlan })
            if (paymentPlan) {
              // Update the family in database
              await Family.findByIdAndUpdate(family._id, { paymentPlanId: paymentPlan._id })
              familyObj.paymentPlanId = paymentPlan._id.toString()
              console.log(`✅ Fixed family ${family.name}: set paymentPlanId to ${paymentPlan._id}`)
            }
          } catch (error) {
            console.error(`Error fixing paymentPlanId for family ${family._id}:`, error)
          }
        }
        
        // Ensure all ObjectId fields are converted to strings
        // Explicitly include all fields to ensure Hebrew names are included
        return {
          ...familyObj,
          _id: familyObj._id?.toString() || familyObj._id,
          paymentPlanId: familyObj.paymentPlanId?.toString() || familyObj.paymentPlanId,
          parentFamilyId: familyObj.parentFamilyId?.toString() || familyObj.parentFamilyId, // Include parentFamilyId
          memberCount: members.length,
          // Explicitly include Hebrew name fields
          hebrewName: familyObj.hebrewName,
          husbandHebrewName: familyObj.husbandHebrewName,
          husbandFatherHebrewName: familyObj.husbandFatherHebrewName,
          wifeHebrewName: familyObj.wifeHebrewName,
          wifeFatherHebrewName: familyObj.wifeFatherHebrewName
        }
      })
    )
    
    return NextResponse.json(familiesWithMembers)
  } catch (error: any) {
    console.error('Error fetching families:', error)
    return NextResponse.json(
      { error: 'Failed to fetch families', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new family
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { 
      name, 
      hebrewName,
      weddingDate, 
      husbandFirstName,
      husbandHebrewName,
      husbandFatherHebrewName,
      wifeFirstName,
      wifeHebrewName,
      wifeFatherHebrewName,
      husbandCellPhone,
      wifeCellPhone,
      address, 
      street,
      phone, 
      email, 
      city, 
      state, 
      zip,
      paymentPlanId, // REQUIRED - ID-based system
      currentPayment,
      openBalance
    } = body

    if (!name || !weddingDate) {
      return NextResponse.json(
        { error: 'Name and weddingDate are required' },
        { status: 400 }
      )
    }

    if (!paymentPlanId) {
      return NextResponse.json(
        { error: 'paymentPlanId is required' },
        { status: 400 }
      )
    }

    // Find payment plan by ID only
    let paymentPlan = null
    try {
      paymentPlan = await PaymentPlan.findById(paymentPlanId)
      if (!paymentPlan) {
        return NextResponse.json(
          { error: `Payment plan with ID ${paymentPlanId} not found` },
          { status: 400 }
        )
      }
      console.log(`Using payment plan ID: ${paymentPlan.name} (ID: ${paymentPlanId})`)
    } catch (error) {
      console.error('Error finding payment plan:', error)
      return NextResponse.json(
        { error: 'Failed to find payment plan', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

    const family = await Family.create({
      name,
      hebrewName: hebrewName || undefined,
      weddingDate: new Date(weddingDate),
      husbandFirstName: husbandFirstName || undefined,
      husbandHebrewName: husbandHebrewName || undefined,
      husbandFatherHebrewName: husbandFatherHebrewName || undefined,
      wifeFirstName: wifeFirstName || undefined,
      wifeHebrewName: wifeHebrewName || undefined,
      wifeFatherHebrewName: wifeFatherHebrewName || undefined,
      husbandCellPhone: husbandCellPhone || undefined,
      wifeCellPhone: wifeCellPhone || undefined,
      address: address || undefined,
      street: street || undefined,
      phone: phone || undefined,
      email: email || undefined,
      city: city || undefined,
      state: state || undefined,
      zip: zip || undefined,
      paymentPlanId: paymentPlanId, // Only store ID, no currentPlan
      currentPayment: currentPayment || 0,
      openBalance: openBalance || 0
    })

    return NextResponse.json(family, { status: 201 })
  } catch (error: any) {
    console.error('Error creating family:', error)
    return NextResponse.json(
      { error: 'Failed to create family', details: error.message },
      { status: 500 }
    )
  }
}


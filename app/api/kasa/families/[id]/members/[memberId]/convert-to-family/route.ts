import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember } from '@/lib/models'

// POST - Convert a child/member to their own family
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    await connectDB()
    const body = await request.json()
    const { weddingDate, spouseName } = body

    if (!weddingDate) {
      return NextResponse.json(
        { error: 'Wedding date is required' },
        { status: 400 }
      )
    }

    // Get the member
    const member = await FamilyMember.findById(params.memberId)
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Get the original family
    const originalFamily = await Family.findById(params.id)
    if (!originalFamily) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    // Create new family name
    const newFamilyName = spouseName 
      ? `${member.firstName} ${member.lastName} & ${spouseName}`
      : `${member.firstName} ${member.lastName} Family`

    // Calculate payment plan based on years married
    const weddingDateObj = new Date(weddingDate)
    const today = new Date()
    const yearsMarried = today.getFullYear() - weddingDateObj.getFullYear()
    const monthDiff = today.getMonth() - weddingDateObj.getMonth()
    const actualYearsMarried = monthDiff < 0 || (monthDiff === 0 && today.getDate() < weddingDateObj.getDate()) 
      ? yearsMarried - 1 
      : yearsMarried
    
    // Determine payment plan based on years married (using same logic as age groups)
    // Plan 1: 0-4 years, Plan 2: 5-8 years, Plan 3: 9-16 years, Plan 4: 17+ years
    let paymentPlan = 1
    if (actualYearsMarried >= 0 && actualYearsMarried <= 4) {
      paymentPlan = 1
    } else if (actualYearsMarried >= 5 && actualYearsMarried <= 8) {
      paymentPlan = 2
    } else if (actualYearsMarried >= 9 && actualYearsMarried <= 16) {
      paymentPlan = 3
    } else {
      paymentPlan = 4 // 17+ years
    }

    // Determine spouse information - use new fields if available, otherwise fall back to spouseName
    const spouseFirstName = member.spouseFirstName || (spouseName ? spouseName.trim().split(' ')[0] : '')
    const spouseLastName = spouseName && !member.spouseFirstName 
      ? (spouseName.trim().split(' ').length > 1 ? spouseName.trim().split(' ').slice(1).join(' ') : member.lastName)
      : member.lastName

    // Determine father's Hebrew name based on member gender
    // If male: use current family's husbandHebrewName
    // If female: use current family's wifeHebrewName
    const fatherHebrewName = member.gender === 'male' 
      ? originalFamily.husbandHebrewName || null
      : originalFamily.wifeHebrewName || null

    // Create new family - use address if provided, otherwise use original family address
    const newFamily = await Family.create({
      name: newFamilyName,
      weddingDate: weddingDateObj,
      // Use address if provided, otherwise use original family address
      address: member.address || originalFamily.address,
      street: member.address || originalFamily.street || originalFamily.address,
      phone: member.phone || originalFamily.phone,
      email: member.email || originalFamily.email,
      city: member.city || originalFamily.city,
      state: member.state || originalFamily.state,
      zip: member.zip || originalFamily.zip,
      // Set husband/wife information based on member gender
      ...(member.gender === 'male' ? {
        husbandFirstName: member.firstName,
        husbandHebrewName: member.hebrewFirstName || null,
        husbandFatherHebrewName: fatherHebrewName,
        husbandCellPhone: null,
        wifeFirstName: spouseFirstName || null,
        wifeHebrewName: member.spouseHebrewName || null,
        wifeFatherHebrewName: member.spouseFatherHebrewName || null,
        wifeCellPhone: member.spouseCellPhone || null
      } : {
        husbandFirstName: spouseFirstName || null,
        husbandHebrewName: member.spouseHebrewName || null,
        husbandFatherHebrewName: member.spouseFatherHebrewName || null,
        husbandCellPhone: member.spouseCellPhone || null,
        wifeFirstName: member.firstName,
        wifeHebrewName: member.hebrewFirstName || null,
        wifeFatherHebrewName: fatherHebrewName,
        wifeCellPhone: null
      }),
      currentPlan: paymentPlan, // Calculate based on years married
      currentPayment: 0,
      openBalance: 0
    })

    // Create spouse as a member if name provided
    if (spouseFirstName || spouseName) {
      await FamilyMember.create({
        familyId: newFamily._id,
        firstName: spouseFirstName,
        lastName: spouseLastName,
        hebrewFirstName: member.spouseHebrewName || null,
        birthDate: new Date(weddingDate), // Approximate, can be updated later
        gender: member.gender === 'male' ? 'female' : 'male'
      })
    }

    // Move the member to the new family
    member.familyId = newFamily._id
    await member.save()

    return NextResponse.json({
      message: 'Member converted to family successfully',
      newFamily: newFamily,
      member: member
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error converting member to family:', error)
    return NextResponse.json(
      { error: 'Failed to convert member to family', details: error.message },
      { status: 500 }
    )
  }
}


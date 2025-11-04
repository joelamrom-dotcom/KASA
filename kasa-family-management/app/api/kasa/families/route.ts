import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember } from '@/lib/models'

// GET - Get all families
export async function GET() {
  try {
    await connectDB()
    const families = await Family.find({}).sort({ name: 1 })
    
    // Get member counts for each family
    const familiesWithMembers = await Promise.all(
      families.map(async (family) => {
        const members = await FamilyMember.find({ familyId: family._id })
        return {
          ...family.toObject(),
          memberCount: members.length
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
      weddingDate, 
      address, 
      phone, 
      email, 
      city, 
      state, 
      zip,
      currentPlan,
      currentPayment,
      openBalance
    } = body

    if (!name || !weddingDate) {
      return NextResponse.json(
        { error: 'Name and weddingDate are required' },
        { status: 400 }
      )
    }

    const family = await Family.create({
      name,
      weddingDate: new Date(weddingDate),
      address,
      phone,
      email,
      city,
      state,
      zip,
      currentPlan: currentPlan || 1,
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


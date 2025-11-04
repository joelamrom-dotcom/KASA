import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { FamilyMember } from '@/lib/models'

// GET - Get all members for a family
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
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
    const body = await request.json()
    const { firstName, lastName, birthDate, gender } = body

    if (!firstName || !lastName || !birthDate) {
      return NextResponse.json(
        { error: 'First name, last name, and birth date are required' },
        { status: 400 }
      )
    }

    const member = await FamilyMember.create({
      familyId: params.id,
      firstName,
      lastName,
      birthDate: new Date(birthDate),
      gender: gender || undefined
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Failed to create member', details: error.message },
      { status: 500 }
    )
  }
}


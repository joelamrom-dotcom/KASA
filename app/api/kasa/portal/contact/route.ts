import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get contact information for current family
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only family role users can access this
    if (user.role !== 'family') {
      return NextResponse.json(
        { error: 'Access denied. This endpoint is for family users only.' },
        { status: 403 }
      )
    }

    if (!user.familyId) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const family = await Family.findById(user.familyId).lean()
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    // Type assertion for lean() result
    const familyDoc = family as {
      email?: string
      phone?: string
      husbandCellPhone?: string
      wifeCellPhone?: string
      address?: string
      street?: string
      city?: string
      state?: string
      zip?: string
      receiveEmails?: boolean
      receiveSMS?: boolean
    }

    return NextResponse.json({
      email: familyDoc.email,
      phone: familyDoc.phone,
      husbandCellPhone: familyDoc.husbandCellPhone,
      wifeCellPhone: familyDoc.wifeCellPhone,
      address: familyDoc.address,
      street: familyDoc.street,
      city: familyDoc.city,
      state: familyDoc.state,
      zip: familyDoc.zip,
      receiveEmails: familyDoc.receiveEmails,
      receiveSMS: familyDoc.receiveSMS
    })
  } catch (error: any) {
    console.error('Error fetching contact information:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact information', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update contact information for current family
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only family role users can access this
    if (user.role !== 'family') {
      return NextResponse.json(
        { error: 'Access denied. This endpoint is for family users only.' },
        { status: 403 }
      )
    }

    if (!user.familyId) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const family = await Family.findById(user.familyId)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      email,
      phone,
      husbandCellPhone,
      wifeCellPhone,
      address,
      street,
      city,
      state,
      zip,
      receiveEmails,
      receiveSMS
    } = body

    // Update allowed fields
    if (email !== undefined) family.email = email
    if (phone !== undefined) family.phone = phone
    if (husbandCellPhone !== undefined) family.husbandCellPhone = husbandCellPhone
    if (wifeCellPhone !== undefined) family.wifeCellPhone = wifeCellPhone
    if (address !== undefined) family.address = address
    if (street !== undefined) family.street = street
    if (city !== undefined) family.city = city
    if (state !== undefined) family.state = state
    if (zip !== undefined) family.zip = zip
    if (receiveEmails !== undefined) family.receiveEmails = receiveEmails
    if (receiveSMS !== undefined) family.receiveSMS = receiveSMS

    await family.save()

    return NextResponse.json({
      message: 'Contact information updated successfully',
      family: {
        email: family.email,
        phone: family.phone,
        husbandCellPhone: family.husbandCellPhone,
        wifeCellPhone: family.wifeCellPhone,
        address: family.address,
        street: family.street,
        city: family.city,
        state: family.state,
        zip: family.zip,
        receiveEmails: family.receiveEmails,
        receiveSMS: family.receiveSMS
      }
    })
  } catch (error: any) {
    console.error('Error updating contact information:', error)
    return NextResponse.json(
      { error: 'Failed to update contact information', details: error.message },
      { status: 500 }
    )
  }
}


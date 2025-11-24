import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

/**
 * POST /api/users/link-to-family
 * Link current user to a family by email (for admins who created families with their email)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { familyEmail } = body

    if (!familyEmail) {
      return NextResponse.json(
        { error: 'Family email is required' },
        { status: 400 }
      )
    }

    // Get current user from database
    const dbUser = await User.findById(user.userId)
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find family by email
    const family = await Family.findOne({ email: familyEmail.toLowerCase().trim() })
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found with this email' },
        { status: 404 }
      )
    }

    // Check if user email matches family email (security check)
    if (dbUser.email.toLowerCase().trim() !== familyEmail.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'You can only link to families with your own email address' },
        { status: 403 }
      )
    }

    // Link user to family
    if (!dbUser.familyId || dbUser.familyId.toString() !== family._id.toString()) {
      dbUser.familyId = family._id
      
      // Update phone number from family if not set
      if (!dbUser.phoneNumber && (family.husbandCellPhone || family.wifeCellPhone || family.phone)) {
        dbUser.phoneNumber = family.husbandCellPhone || family.wifeCellPhone || family.phone || ''
      }
      
      await dbUser.save()
      
      return NextResponse.json({
        success: true,
        message: `Linked to family "${family.name}"`,
        family: {
          id: family._id.toString(),
          name: family.name,
          email: family.email,
        },
        user: {
          id: dbUser._id.toString(),
          email: dbUser.email,
          role: dbUser.role,
          familyId: dbUser.familyId.toString(),
          phoneNumber: dbUser.phoneNumber,
        }
      })
    } else {
      return NextResponse.json({
        message: 'Already linked to this family',
        family: {
          id: family._id.toString(),
          name: family.name,
        }
      })
    }
  } catch (error: any) {
    console.error('Error linking user to family:', error)
    return NextResponse.json(
      { error: 'Failed to link to family', details: error.message },
      { status: 500 }
    )
  }
}


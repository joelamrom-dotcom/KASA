import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Document, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get documents for current family (family portal)
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

    // Find family by familyId from user
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

    const familyId = String(family._id)
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Build query - only documents related to this family
    const query: any = { relatedFamilyId: familyId }
    
    if (category) {
      query.category = category
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const documents = await Document.find(query)
      .populate('relatedMemberId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ documents })
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error.message },
      { status: 500 }
    )
  }
}


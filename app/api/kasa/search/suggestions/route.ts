import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, Payment, FamilyMember } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get search suggestions
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''

    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const suggestions: string[] = []

    // Get family name suggestions
    const families = await Family.find({
      userId,
      name: { $regex: q, $options: 'i' }
    })
      .limit(5)
      .select('name')
      .lean()

    families.forEach((f: any) => {
      if (!suggestions.includes(f.name)) {
        suggestions.push(f.name)
      }
    })

    // Get payment-related suggestions
    if (q.toLowerCase().includes('payment')) {
      suggestions.push('payments overdue', 'payments this month', 'payments by family')
    }

    // Get member-related suggestions
    if (q.toLowerCase().includes('member')) {
      suggestions.push('members by age', 'members by family', 'upcoming birthdays')
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 10) })
  } catch (error: any) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', details: error.message },
      { status: 500 }
    )
  }
}


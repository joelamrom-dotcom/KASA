import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, FamilyMember, Payment, LifecycleEventPayment } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Advanced search across all entities
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const entityTypes = searchParams.get('types')?.split(',') || ['family', 'member', 'payment']
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const results: any[] = []

    // Search families
    if (entityTypes.includes('family')) {
      const families = await Family.find({
        userId,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } }
        ]
      }).limit(limit).lean()

      families.forEach((f: any) => {
        results.push({
          type: 'family',
          _id: f._id.toString(),
          title: f.name,
          subtitle: f.email || f.phone || '',
          url: `/families/${f._id}`
        })
      })
    }

    // Search members
    if (entityTypes.includes('member')) {
      const userFamilies = await Family.find({ userId }).select('_id').lean()
      const userFamilyIds = userFamilies.map(f => f._id)

      const members = await FamilyMember.find({
        familyId: { $in: userFamilyIds },
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ]
      }).limit(limit).lean()

      members.forEach((m: any) => {
        results.push({
          type: 'member',
          _id: m._id.toString(),
          title: `${m.firstName} ${m.lastName}`,
          subtitle: `Member of family`,
          url: `/families/${m.familyId}?member=${m._id}`
        })
      })
    }

    // Search payments
    if (entityTypes.includes('payment')) {
      const userFamilies = await Family.find({ userId }).select('_id').lean()
      const userFamilyIds = userFamilies.map(f => f._id)

      const payments = await Payment.find({
        familyId: { $in: userFamilyIds },
        $or: [
          { notes: { $regex: query, $options: 'i' } },
          { paymentMethod: { $regex: query, $options: 'i' } }
        ]
      }).limit(limit).lean()

      payments.forEach((p: any) => {
        results.push({
          type: 'payment',
          _id: p._id.toString(),
          title: `$${(p.amount || 0).toLocaleString()}`,
          subtitle: new Date(p.paymentDate).toLocaleDateString(),
          url: `/families/${p.familyId}?tab=payments`
        })
      })
    }

    return NextResponse.json({
      results: results.slice(0, limit),
      count: results.length
    })
  } catch (error: any) {
    console.error('Error performing advanced search:', error)
    return NextResponse.json(
      { error: 'Failed to perform search', details: error.message },
      { status: 500 }
    )
  }
}


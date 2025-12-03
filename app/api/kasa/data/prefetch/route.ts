import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, Payment } from '@/lib/models'
import { optimizedQuery } from '@/lib/query-optimizer'
import { apiCache, generateCacheKey } from '@/lib/api-cache'

export const dynamic = 'force-dynamic'

// POST - Prefetch data for faster subsequent loads
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resources } = body

    if (!Array.isArray(resources)) {
      return NextResponse.json({ error: 'Resources must be an array' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Prefetch in parallel
    const prefetchPromises = resources.map(async (resource: string) => {
      let data: any = null
      let cacheKey = ''

      switch (resource) {
        case 'families':
          cacheKey = generateCacheKey(`families:${userId}`)
          data = await optimizedQuery(Family, { userId }, {
            select: ['name', 'email', 'phone', 'address'],
            lean: true,
            limit: 50,
          })
          break

        case 'payments':
          cacheKey = generateCacheKey(`payments:${userId}`)
          data = await optimizedQuery(Payment, { userId }, {
            select: ['amount', 'date', 'description', 'familyId'],
            lean: true,
            limit: 100,
            sort: { date: -1 },
          })
          break

        case 'stats':
          cacheKey = generateCacheKey(`stats:${userId}`)
          const [familyCount, paymentCount, totalAmount] = await Promise.all([
            Family.countDocuments({ userId }),
            Payment.countDocuments({ userId }),
            Payment.aggregate([
              { $match: { userId } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
          ])
          data = {
            familyCount,
            paymentCount,
            totalAmount: totalAmount[0]?.total || 0,
          }
          break
      }

      if (data && cacheKey) {
        apiCache.set(cacheKey, data, 300000) // 5 minutes
      }

      return { resource, cached: !!data }
    })

    const results = await Promise.all(prefetchPromises)

    return NextResponse.json({
      message: 'Prefetch completed',
      results,
    })
  } catch (error: any) {
    console.error('Error in prefetch:', error)
    return NextResponse.json(
      { error: 'Failed to prefetch data', details: error.message },
      { status: 500 }
    )
  }
}


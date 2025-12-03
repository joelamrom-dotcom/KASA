import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, Payment, FamilyMember, LifecycleEvent } from '@/lib/models'
import { batchLoad } from '@/lib/data-loader'

export const dynamic = 'force-dynamic'

// POST - Batch load multiple data sources in parallel
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { queries } = body

    if (!Array.isArray(queries)) {
      return NextResponse.json({ error: 'Queries must be an array' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Map query types to models
    const modelMap: Record<string, any> = {
      family: Family,
      payment: Payment,
      member: FamilyMember,
      event: LifecycleEvent,
    }

    // Build batch queries
    const batchQueries = queries.map((q: any) => {
      const model = modelMap[q.type]
      if (!model) {
        throw new Error(`Unknown query type: ${q.type}`)
      }

      return {
        model,
        filter: { ...q.filter, userId },
        options: {
          select: q.select,
          lean: true,
          limit: q.limit || 100,
          sort: q.sort || { createdAt: -1 },
        },
      }
    })

    // Execute all queries in parallel
    const results = await batchLoad(batchQueries)

    // Format response
    const response = queries.reduce((acc: any, q: any, index: number) => {
      acc[q.key || q.type] = results[index]
      return acc
    }, {})

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error: any) {
    console.error('Error in batch load:', error)
    return NextResponse.json(
      { error: 'Failed to load data', details: error.message },
      { status: 500 }
    )
  }
}


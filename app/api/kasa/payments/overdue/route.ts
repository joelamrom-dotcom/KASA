import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getOverduePayments, updateOverdueStatus } from '@/lib/overdue-helpers'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get overdue payments
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }
    
    // Update overdue status before fetching
    await updateOverdueStatus(user.userId)
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const minDaysOverdue = parseInt(searchParams.get('minDaysOverdue') || '1')
    
    const overduePayments = await getOverduePayments(user.userId, limit)
    
    // Filter by minimum days overdue if specified
    const filtered = overduePayments.filter((p: any) => 
      p.daysOverdue >= minDaysOverdue
    )
    
    // Calculate summary statistics
    const stats = {
      total: filtered.length,
      byLevel: {
        level1: filtered.filter((p: any) => p.daysOverdue >= 7 && p.daysOverdue < 14).length,
        level2: filtered.filter((p: any) => p.daysOverdue >= 14 && p.daysOverdue < 30).length,
        level3: filtered.filter((p: any) => p.daysOverdue >= 30).length,
      },
      totalAmount: filtered.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
      averageDaysOverdue: filtered.length > 0
        ? filtered.reduce((sum: number, p: any) => sum + (p.daysOverdue || 0), 0) / filtered.length
        : 0
    }
    
    return NextResponse.json({
      payments: filtered,
      stats
    })
  } catch (error: any) {
    console.error('Error fetching overdue payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overdue payments', details: error.message },
      { status: 500 }
    )
  }
}


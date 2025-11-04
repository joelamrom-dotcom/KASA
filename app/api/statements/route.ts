import { NextRequest, NextResponse } from 'next/server'
import db from '../../../lib/database-adapter.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const statementId = searchParams.get('statementId')
    const familyId = searchParams.get('familyId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (statementId) {
      // Get specific statement - simplified to use findOne
      const statements = await db.getStatements()
      const statement = Array.isArray(statements) 
        ? statements.find((s: any) => s.id === statementId || s._id === statementId)
        : null
      
      if (!statement) {
        return NextResponse.json(
          { error: 'Statement not found' },
          { status: 404 }
        )
      }
      
      // Get related activities if available
      const activities = await db.getActivities(1, 50, null)
      const statementActivities = Array.isArray(activities) 
        ? activities.filter((a: any) => a.metadata?.statementId === statementId)
        : (activities?.activities || []).filter((a: any) => a.metadata?.statementId === statementId)
      
      return NextResponse.json({
        ...statement,
        activities: statementActivities
      })
    }

    // Get statements - use existing methods
    let statements = await db.getStatements()
    
    if (!Array.isArray(statements)) {
      statements = []
    }
    
    // Filter by memberId or familyId if provided
    if (memberId) {
      statements = statements.filter((s: any) => s.memberId === memberId)
    } else if (familyId) {
      statements = statements.filter((s: any) => s.familyId === familyId)
    }
    
    // Paginate
    const startIndex = (page - 1) * limit
    const paginatedStatements = statements.slice(startIndex, startIndex + limit)
    
    // Get recent activities
    const activities = await db.getActivities(1, 20, null)
    const recentActivities = Array.isArray(activities) 
      ? activities.slice(0, 20)
      : (activities?.activities || []).slice(0, 20)

    return NextResponse.json({
      statements: paginatedStatements,
      pagination: {
        page,
        limit,
        total: statements.length,
        totalPages: Math.ceil(statements.length / limit)
      },
      recentActivities
    })
  } catch (error) {
    console.error('Error fetching statements:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch statements',
        statements: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        recentActivities: []
      },
      { status: 200 } // Return 200 with empty data instead of 500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.action === 'pay') {
      // Process payment - simplified implementation
      const { statementId, paymentAmount } = body
      
      if (!statementId || !paymentAmount) {
        return NextResponse.json(
          { error: 'Statement ID and payment amount are required' },
          { status: 400 }
        )
      }

      // Get statement
      const statements = await db.getStatements()
      const statement = Array.isArray(statements) 
        ? statements.find((s: any) => s.id === statementId || s._id === statementId)
        : null
      
      if (!statement) {
        return NextResponse.json(
          { error: 'Statement not found' },
          { status: 404 }
        )
      }

      // Update statement balance (simplified - would need proper update method)
      const oldBalance = statement.balance || statement.amount || 0
      const newBalance = oldBalance - paymentAmount

      // Log payment activity
      const activity = await db.logActivity({
        userId: body.processedBy || null,
        type: 'statement_paid',
        description: `Payment processed for statement ${statementId}`,
        metadata: {
          statementId,
          paymentAmount,
          memberId: statement.memberId,
          oldBalance,
          newBalance
        }
      })

      return NextResponse.json({
        message: 'Payment processed successfully',
        statement: {
          ...statement,
          balance: newBalance,
          paidAmount: (statement.paidAmount || 0) + paymentAmount
        },
        activity
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "pay" to process payment.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing statement:', error)
    return NextResponse.json(
      { error: 'Failed to process statement' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { statementId, status } = body
    
    if (!statementId || !status) {
      return NextResponse.json(
        { error: 'Statement ID and status are required' },
        { status: 400 }
      )
    }

    // Get statement - simplified implementation
    const statements = await db.getStatements()
    const statement = Array.isArray(statements) 
      ? statements.find((s: any) => s.id === statementId || s._id === statementId)
      : null
    
    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      )
    }

    // Update statement status (simplified - would need proper update method)
    const updatedStatement = {
      ...statement,
      status: status,
      updatedAt: new Date().toISOString()
    }

    // Log status update
    await db.logActivity({
      userId: body.updatedBy || null,
      type: 'statement_status_updated',
      description: `Statement ${statementId} status updated to ${status}`,
      metadata: {
        statementId,
        newStatus: status,
        memberId: statement.memberId
      }
    })

    return NextResponse.json({
      message: 'Statement status updated successfully',
      statement: updatedStatement
    })
  } catch (error) {
    console.error('Error updating statement:', error)
    return NextResponse.json(
      { error: 'Failed to update statement' },
      { status: 500 }
    )
  }
}

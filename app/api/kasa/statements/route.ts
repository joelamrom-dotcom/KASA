import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Statement, Family, Payment, Withdrawal, LifecycleEventPayment } from '@/lib/models'
import { calculateFamilyBalance } from '@/lib/calculations'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

// GET - Get all statements or filter by family (filtered by user)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    const familyId = searchParams.get('familyId')
    
    let query: any = {}
    if (familyId) {
      query.familyId = familyId
    }
    
    let statements = await Statement.find(query).sort({ date: -1 }).lean()
    
    // Filter by user ownership - admin sees all, regular users only their families' statements
    if (!isAdmin(user)) {
      let userFamilyIds: string[] = []
      
      if (user.role === 'family' && user.familyId) {
        // Family user - only see their own family's statements
        userFamilyIds = [user.familyId]
      } else {
        // Regular admin user - get their families
        const userFamilies = await Family.find({ userId: user.userId }).select('_id')
        userFamilyIds = userFamilies.map(f => f._id.toString())
      }
      
      // Filter statements to only those belonging to user's families
      statements = statements.filter((statement: any) => {
        const statementFamilyId = statement.familyId?.toString()
        return userFamilyIds.includes(statementFamilyId)
      })
    }
    
    return NextResponse.json(statements)
  } catch (error: any) {
    console.error('Error fetching statements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statements', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Generate a new statement for a family
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { familyId, fromDate, toDate } = body

    if (!familyId || !fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Family ID, from date, and to date are required' },
        { status: 400 }
      )
    }

    const family = await Family.findById(familyId)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check ownership - admin, family owner, or family user accessing their own family
    const isFamilyOwner = family.userId?.toString() === user.userId
    const isFamilyMember = user.role === 'family' && user.familyId === familyId
    
    if (!isAdmin(user) && !isFamilyOwner && !isFamilyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this family' },
        { status: 403 }
      )
    }

    const from = new Date(fromDate)
    const to = new Date(toDate)

    // Get opening balance (balance before fromDate)
    const openingBalanceData = await calculateFamilyBalance(familyId, new Date(from.getTime() - 1))
    const openingBalance = openingBalanceData.balance

    // Get payments in date range
    const payments = await Payment.find({
      familyId,
      paymentDate: { $gte: from, $lte: to }
    })
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)

    // Get withdrawals in date range
    const withdrawals = await Withdrawal.find({
      familyId,
      withdrawalDate: { $gte: from, $lte: to }
    })
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0)

    // Get lifecycle events in date range (for display only, not included in balance)
    const lifecycleEvents = await LifecycleEventPayment.find({
      familyId,
      eventDate: { $gte: from, $lte: to }
    })
    const totalExpenses = lifecycleEvents.reduce((sum, e) => sum + e.amount, 0)

    // Calculate closing balance (lifecycle events are NOT subtracted from balance)
    const closingBalance = openingBalance + totalIncome - totalWithdrawals

    // Generate statement number
    const statementCount = await Statement.countDocuments({ familyId })
    const statementNumber = `STMT-${familyId.slice(-6)}-${statementCount + 1}`

    const statement = await Statement.create({
      familyId,
      statementNumber,
      date: new Date(),
      fromDate: from,
      toDate: to,
      openingBalance,
      income: totalIncome,
      withdrawals: totalWithdrawals,
      expenses: totalExpenses,
      closingBalance
    })

    return NextResponse.json(statement, { status: 201 })
  } catch (error: any) {
    console.error('Error generating statement:', error)
    return NextResponse.json(
      { error: 'Failed to generate statement', details: error.message },
      { status: 500 }
    )
  }
}


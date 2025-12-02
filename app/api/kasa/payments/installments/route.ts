import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Create payment plan with installments
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { familyId, totalAmount, numberOfInstallments, startDate, frequency } = body

    if (!familyId || !totalAmount || !numberOfInstallments || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const installmentAmount = totalAmount / numberOfInstallments
    const installments: any[] = []
    const start = new Date(startDate)

    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(start)
      if (frequency === 'monthly') {
        dueDate.setMonth(dueDate.getMonth() + i)
      } else if (frequency === 'weekly') {
        dueDate.setDate(dueDate.getDate() + (i * 7))
      } else if (frequency === 'biweekly') {
        dueDate.setDate(dueDate.getDate() + (i * 14))
      }

      installments.push({
        installmentNumber: i + 1,
        amount: installmentAmount,
        dueDate,
        status: 'pending'
      })
    }

    // Create payment plan record (would need InstallmentPlan schema)
    return NextResponse.json({
      success: true,
      installments,
      totalAmount,
      numberOfInstallments
    })
  } catch (error: any) {
    console.error('Error creating installments:', error)
    return NextResponse.json(
      { error: 'Failed to create installments', details: error.message },
      { status: 500 }
    )
  }
}


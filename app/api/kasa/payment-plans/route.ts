import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { PaymentPlan, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

// GET - Get all payment plans with family counts
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
    
    // Check permission - users with payment_plans.view see all, others see only their own
    const canViewAll = await hasPermission(user, PERMISSIONS.PAYMENT_PLANS_VIEW)
    
    // Build query - each user sees only their own settings unless they have permission
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    const query = canViewAll ? {} : { userId: userObjectId }
    
    // Sort by planNumber to ensure consistent order (Plan 1, Plan 2, Plan 3, Plan 4)
    const plans = await PaymentPlan.find(query).sort({ planNumber: 1 })
    
    // Get family counts for each plan
    const plansWithFamilies = await Promise.all(
      plans.map(async (plan, index) => {
        try {
          // Find families by paymentPlanId (ID-based system) and userId
          const familyQuery: any = { paymentPlanId: plan._id, userId: user.userId }
          const families = await Family.find(familyQuery)
          const planObj = plan.toObject ? plan.toObject() : plan
          return {
            _id: planObj._id?.toString() || planObj._id,
            name: planObj.name,
            yearlyPrice: planObj.yearlyPrice,
            planNumber: planObj.planNumber, // Include planNumber in response
            createdAt: planObj.createdAt,
            updatedAt: planObj.updatedAt,
            familyCount: families.length,
            families: families.map(f => {
              const familyObj = f.toObject ? f.toObject() : f
              return {
                _id: familyObj._id?.toString() || familyObj._id,
                name: familyObj.name,
                weddingDate: familyObj.weddingDate
              }
            })
          }
        } catch (planError: any) {
          console.error(`Error processing plan ${plan._id}:`, planError)
          console.error('Plan error stack:', planError.stack)
          const planObj = plan.toObject ? plan.toObject() : plan
          return {
            _id: planObj._id?.toString() || planObj._id,
            name: planObj.name,
            yearlyPrice: planObj.yearlyPrice,
            planNumber: planObj.planNumber, // Include planNumber in response
            createdAt: planObj.createdAt,
            updatedAt: planObj.updatedAt,
            familyCount: 0,
            families: []
          }
        }
      })
    )
    
    return NextResponse.json(plansWithFamilies)
  } catch (error: any) {
    console.error('Error fetching payment plans:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to fetch payment plans', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new payment plan
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
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.PAYMENT_PLANS_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { name, yearlyPrice, planNumber } = body

    if (!name || !yearlyPrice) {
      return NextResponse.json(
        { error: 'Name and yearlyPrice are required' },
        { status: 400 }
      )
    }

    // Convert userId to ObjectId for proper MongoDB comparison
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    // If planNumber not provided, auto-assign based on existing plans for this user
    let finalPlanNumber = planNumber
    if (!finalPlanNumber) {
      const query = { userId: userObjectId }
      const existingPlans = await PaymentPlan.find(query).sort({ planNumber: 1 })
      if (existingPlans.length > 0) {
        const maxPlanNumber = Math.max(...existingPlans.map(p => p.planNumber || 0))
        finalPlanNumber = maxPlanNumber + 1
      } else {
        finalPlanNumber = 1
      }
    }

    const plan = await PaymentPlan.create({
      userId: userObjectId, // All users (including super_admins) have their own settings
      name,
      yearlyPrice,
      planNumber: finalPlanNumber
    })

    // Create audit log entry
    await auditLogFromRequest(request, user, 'payment_plan_create', 'payment_plan', {
      entityId: plan._id.toString(),
      entityName: name,
      description: `Created payment plan "${name}" ($${yearlyPrice}/year)`,
      metadata: {
        planName: name,
        yearlyPrice,
        planNumber: finalPlanNumber,
      }
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error: any) {
    console.error('Error creating payment plan:', error)
    return NextResponse.json(
      { error: 'Failed to create payment plan', details: error.message },
      { status: 500 }
    )
  }
}

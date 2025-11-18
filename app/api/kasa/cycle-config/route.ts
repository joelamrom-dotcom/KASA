import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { CycleConfig } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

// GET - Get cycle configuration
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
    
    // Build query - each user sees only their own settings
    // Explicitly require userId to exist and match exactly
    const query: any = { 
      isActive: true, 
      userId: { $exists: true, $eq: user.userId }
    }
    
    console.log(`Cycle config GET - Query for userId: ${user.userId}, email: ${user.email}`)
    const config = await CycleConfig.findOne(query)
    console.log(`Cycle config GET - Found config:`, config ? { id: config._id, userId: config.userId, month: config.cycleStartMonth, day: config.cycleStartDay } : 'none')
    
    // Debug: Check for any configs that might be interfering
    const allActiveConfigs = await CycleConfig.find({ isActive: true })
    console.log(`Cycle config GET - All active configs:`, allActiveConfigs.map(c => ({ id: c._id, userId: c.userId, month: c.cycleStartMonth, day: c.cycleStartDay })))
    
    if (!config) {
      // Return default if no config exists
      return NextResponse.json({
        cycleStartMonth: 9, // September
        cycleStartDay: 1,
        description: 'Membership cycle start date',
        isActive: true
      })
    }

    return NextResponse.json({
      cycleStartMonth: config.cycleStartMonth,
      cycleStartDay: config.cycleStartDay,
      description: config.description,
      isActive: config.isActive
    })
  } catch (error: any) {
    console.error('Error fetching cycle config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cycle configuration', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update cycle configuration
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
    
    const body = await request.json()
    const { cycleStartMonth, cycleStartDay, description } = body

    if (!cycleStartMonth || !cycleStartDay) {
      return NextResponse.json(
        { error: 'Cycle start month and day are required' },
        { status: 400 }
      )
    }

    if (cycleStartMonth < 1 || cycleStartMonth > 12) {
      return NextResponse.json(
        { error: 'Cycle start month must be between 1 and 12' },
        { status: 400 }
      )
    }

    if (cycleStartDay < 1 || cycleStartDay > 31) {
      return NextResponse.json(
        { error: 'Cycle start day must be between 1 and 31' },
        { status: 400 }
      )
    }

    // Build query - each user sees only their own settings
    // Explicitly require userId to exist and match exactly
    const query: any = { 
      isActive: true, 
      userId: { $exists: true, $eq: user.userId }
    }

    // Check if config already exists for this user
    const existingConfig = await CycleConfig.findOne(query)

    if (existingConfig) {
      // Update existing config
      await CycleConfig.findByIdAndUpdate(existingConfig._id, {
        cycleStartMonth,
        cycleStartDay,
        description: description || existingConfig.description || 'Membership cycle start date'
      })
      
      const updatedConfig = await CycleConfig.findById(existingConfig._id)
      
      return NextResponse.json({
        cycleStartMonth: updatedConfig!.cycleStartMonth,
        cycleStartDay: updatedConfig!.cycleStartDay,
        description: updatedConfig!.description,
        isActive: updatedConfig!.isActive
      })
    } else {
      // Deactivate all existing configs for this user (if any)
      const deactivateQuery: any = { userId: user.userId }
      await CycleConfig.updateMany(deactivateQuery, { isActive: false })

      // Create new active config
      const config = await CycleConfig.create({
        userId: user.userId, // All users (including super_admins) have their own settings
        cycleStartMonth,
        cycleStartDay,
        description: description || 'Membership cycle start date',
        isActive: true
      })

      return NextResponse.json({
        cycleStartMonth: config.cycleStartMonth,
        cycleStartDay: config.cycleStartDay,
        description: config.description,
        isActive: config.isActive
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error saving cycle config:', error)
    return NextResponse.json(
      { error: 'Failed to save cycle configuration', details: error.message },
      { status: 500 }
    )
  }
}


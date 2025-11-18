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
    // Explicitly require userId to avoid matching old configs without userId
    const query: any = { isActive: true, userId: user.userId }
    
    const config = await CycleConfig.findOne(query)
    
    // If no config found, check if there are any old configs without userId that might interfere
    // This shouldn't happen, but we want to be explicit
    if (!config) {
      // Double-check: ensure we're not accidentally matching configs without userId
      const oldConfigs = await CycleConfig.find({ isActive: true, userId: { $exists: false } })
      if (oldConfigs.length > 0) {
        console.warn(`Found ${oldConfigs.length} old cycle config(s) without userId - these will be ignored`)
      }
    }
    
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
    const query: any = { isActive: true, userId: user.userId }

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


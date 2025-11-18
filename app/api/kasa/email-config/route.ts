import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { EmailConfig } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

// GET - Get email configuration
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
    
    console.log(`Email config GET - Query for userId: ${user.userId}, email: ${user.email}`)
    const config = await EmailConfig.findOne(query)
    console.log(`Email config GET - Found config:`, config ? { id: config._id, userId: config.userId, email: config.email } : 'none')
    
    // Debug: Check for any configs that might be interfering
    const allActiveConfigs = await EmailConfig.find({ isActive: true })
    console.log(`Email config GET - All active configs:`, allActiveConfigs.map(c => ({ id: c._id, userId: c.userId, email: c.email })))
    
    if (!config) {
      return NextResponse.json({ error: 'Email configuration not found' }, { status: 404 })
    }

    // Don't send password back
    return NextResponse.json({
      email: config.email,
      fromName: config.fromName,
      isActive: config.isActive
    })
  } catch (error: any) {
    console.error('Error fetching email config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email configuration', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update email configuration
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
    const { email, password, fromName } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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
    const existingConfig = await EmailConfig.findOne(query)

    if (existingConfig) {
      // Update existing config
      const updateData: any = {
        email,
        fromName: fromName || existingConfig.fromName || 'Kasa Family Management'
      }
      
      // Only update password if provided
      if (password) {
        updateData.password = password
      }
      
      await EmailConfig.findByIdAndUpdate(existingConfig._id, updateData)
      
      const updatedConfig = await EmailConfig.findById(existingConfig._id)
      
      // Don't send password back
      return NextResponse.json({
        email: updatedConfig!.email,
        fromName: updatedConfig!.fromName,
        isActive: updatedConfig!.isActive
      })
    } else {
      // Create new config (password is required for new configs)
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required for new email configuration' },
          { status: 400 }
        )
      }

      // Deactivate all existing configs for this user (if any)
      const deactivateQuery: any = { userId: user.userId }
      await EmailConfig.updateMany(deactivateQuery, { isActive: false })

      // Create new active config
      const config = await EmailConfig.create({
        userId: user.userId, // All users (including super_admins) have their own settings
        email,
        password,
        fromName: fromName || 'Kasa Family Management',
        isActive: true
      })

      // Don't send password back
      return NextResponse.json({
        email: config.email,
        fromName: config.fromName,
        isActive: config.isActive
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error saving email config:', error)
    return NextResponse.json(
      { error: 'Failed to save email configuration', details: error.message },
      { status: 500 }
    )
  }
}


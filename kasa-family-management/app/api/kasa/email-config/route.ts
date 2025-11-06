import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { EmailConfig } from '@/lib/models'

// GET - Get email configuration
export async function GET() {
  try {
    await connectDB()
    const config = await EmailConfig.findOne({ isActive: true })
    
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
    const body = await request.json()
    const { email, password, fromName } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if config already exists
    const existingConfig = await EmailConfig.findOne({ isActive: true })

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

      // Deactivate all existing configs (if any)
      await EmailConfig.updateMany({}, { isActive: false })

      // Create new active config
      const config = await EmailConfig.create({
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


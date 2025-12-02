import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy load to prevent module-level errors
let connectDB: any
let User: any

async function loadDependencies() {
  if (!connectDB) {
    connectDB = (await import('@/lib/database')).default
  }
  if (!User) {
    const models = await import('@/lib/models')
    User = models.User
  }
}

export async function POST(request: NextRequest) {
  try {
    // Load dependencies
    await loadDependencies()
    
    // Log environment check (for debugging)
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI)
    
    // Connect to database
    try {
      await connectDB()
      console.log('Database connected successfully')
    } catch (dbError: any) {
      console.error('Database connection error:', dbError)
      console.error('Database error details:', {
        message: dbError.message,
        name: dbError.name,
        code: dbError.code,
        stack: dbError.stack
      })
      
      // Provide helpful error message for MongoDB Atlas IP whitelist issues
      let errorMessage = dbError.message || 'Database connection failed'
      let helpfulMessage = ''
      
      if (dbError.message?.includes('whitelist') || dbError.message?.includes('IP') || dbError.code === 'ENOTFOUND' || dbError.code === 'ETIMEDOUT') {
        helpfulMessage = 'Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you\'re trying to access the database from an IP that isn\'t whitelisted. Make sure your current IP address is on your Atlas cluster\'s IP whitelist: https://www.mongodb.com/docs/atlas/security-whitelist/'
      } else if (dbError.message?.includes('authentication failed') || dbError.code === 8000) {
        helpfulMessage = 'MongoDB authentication failed. Please check your connection string credentials in .env.local'
      } else if (!process.env.MONGODB_URI) {
        helpfulMessage = 'MONGODB_URI environment variable is not set. Please add it to your .env.local file.'
      }
      
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: helpfulMessage || errorMessage,
          code: dbError.code,
          name: dbError.name
        },
        { status: 500 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName } = body

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Password validation (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    let user
    try {
      user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'admin', // New users are admins for their own data
        isActive: true,
        emailVerified: false,
      })
    } catch (createError: any) {
      console.error('User creation error:', createError)
      // Handle duplicate email error
      if (createError.code === 11000 || createError.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
      throw createError
    }

    // Return user without password
    const userObj = user.toObject()
    delete userObj.password
    delete userObj.resetPasswordToken
    delete userObj.resetPasswordExpires
    delete userObj.emailVerificationToken
    delete userObj.emailVerificationExpires

    return NextResponse.json({
      message: 'User created successfully',
      user: userObj
    }, { status: 201 })
  } catch (error: any) {
    console.error('Signup error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error name:', error.name)
    console.error('Error code:', error.code)
    
    // Always return error details in development
    const errorDetails = {
      error: 'An error occurred during signup',
      message: error.message || 'Unknown error',
      name: error.name,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack
      })
    }
    
    return NextResponse.json(
      errorDetails,
      { status: 500 }
    )
  }
}


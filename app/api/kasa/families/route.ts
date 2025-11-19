import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember, PaymentPlan, User } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

// GET - Get all families (filtered by user)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    console.log('GET /api/kasa/families - User from token:', user?.email, 'Role:', user?.role, 'UserId:', user?.userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // ALWAYS check DB for current user's role (bypass stale token)
    let userRole = user.role
    let isSuperAdminUser = user.role === 'super_admin'
    let dbUser = null
    
    // Try to find current user in DB by userId first (most reliable)
    if (user.userId) {
      try {
        dbUser = await User.findById(user.userId)
        if (dbUser && dbUser.role === 'super_admin') {
          userRole = 'super_admin'
          isSuperAdminUser = true
        } else if (dbUser) {
          userRole = dbUser.role
        }
      } catch (err) {
        // Continue to email lookup
      }
    }
    
    // If not found by userId, try by email
    if (!isSuperAdminUser && !dbUser && user.email) {
      try {
        const userEmailLower = user.email.toLowerCase().trim()
        dbUser = await User.findOne({ email: userEmailLower })
        if (dbUser && dbUser.role === 'super_admin') {
          userRole = 'super_admin'
          isSuperAdminUser = true
        } else if (dbUser) {
          userRole = dbUser.role
        }
      } catch (err) {
        // Continue - use token role
      }
    }
    
    // Build query - super_admin sees all, admin sees all, regular users see only their data, family users see only their family
    let query: any = {}
    if (isSuperAdminUser || isAdmin(user)) {
      // Super admin and admin see all families
      query = {}
      console.log('GET /api/kasa/families - Super admin/admin: showing all families')
    } else if (user.role === 'family' && user.familyId) {
      // Family users see only their own family
      query = { _id: user.familyId }
      console.log('GET /api/kasa/families - Family user: showing family', user.familyId)
    } else {
      // Regular users see their families
      query = { userId: user.userId }
      console.log('GET /api/kasa/families - Regular user: showing families for userId', user.userId)
    }
    
    const families = await Family.find(query).sort({ name: 1 })
    
    // Get member counts and ensure paymentPlanId is set for each family
    const familiesWithMembers = await Promise.all(
      families.map(async (family) => {
        const members = await FamilyMember.find({ familyId: family._id })
        const familyObj = family.toObject()
        
        // If paymentPlanId is missing but currentPlan exists, find and set paymentPlanId
        if (!familyObj.paymentPlanId && familyObj.currentPlan) {
          try {
            const paymentPlan = await PaymentPlan.findOne({ planNumber: familyObj.currentPlan })
            if (paymentPlan) {
              // Update the family in database
              await Family.findByIdAndUpdate(family._id, { paymentPlanId: paymentPlan._id })
              familyObj.paymentPlanId = paymentPlan._id.toString()
              console.log(`✅ Fixed family ${family.name}: set paymentPlanId to ${paymentPlan._id}`)
            }
          } catch (error) {
            console.error(`Error fixing paymentPlanId for family ${family._id}:`, error)
          }
        }
        
        // Ensure all ObjectId fields are converted to strings
        // Explicitly include all fields to ensure Hebrew names are included
        return {
          ...familyObj,
          _id: familyObj._id?.toString() || familyObj._id,
          paymentPlanId: familyObj.paymentPlanId?.toString() || familyObj.paymentPlanId,
          parentFamilyId: familyObj.parentFamilyId?.toString() || familyObj.parentFamilyId, // Include parentFamilyId
          memberCount: members.length,
          // Explicitly include Hebrew name fields
          hebrewName: familyObj.hebrewName,
          husbandHebrewName: familyObj.husbandHebrewName,
          husbandFatherHebrewName: familyObj.husbandFatherHebrewName,
          wifeHebrewName: familyObj.wifeHebrewName,
          wifeFatherHebrewName: familyObj.wifeFatherHebrewName
        }
      })
    )
    
    return NextResponse.json(familiesWithMembers)
  } catch (error: any) {
    console.error('Error fetching families:', error)
    return NextResponse.json(
      { error: 'Failed to fetch families', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new family
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { 
      name, 
      hebrewName,
      weddingDate, 
      husbandFirstName,
      husbandHebrewName,
      husbandFatherHebrewName,
      wifeFirstName,
      wifeHebrewName,
      wifeFatherHebrewName,
      husbandCellPhone,
      wifeCellPhone,
      address, 
      street,
      phone, 
      email, 
      city, 
      state, 
      zip,
      paymentPlanId, // REQUIRED - ID-based system
      currentPayment,
      openBalance
    } = body

    if (!name || !weddingDate) {
      return NextResponse.json(
        { error: 'Name and weddingDate are required' },
        { status: 400 }
      )
    }

    if (!paymentPlanId) {
      return NextResponse.json(
        { error: 'paymentPlanId is required' },
        { status: 400 }
      )
    }

    // Find payment plan by ID only
    let paymentPlan = null
    try {
      paymentPlan = await PaymentPlan.findById(paymentPlanId)
      if (!paymentPlan) {
        return NextResponse.json(
          { error: `Payment plan with ID ${paymentPlanId} not found` },
          { status: 400 }
        )
      }
      console.log(`Using payment plan ID: ${paymentPlan.name} (ID: ${paymentPlanId})`)
    } catch (error) {
      console.error('Error finding payment plan:', error)
      return NextResponse.json(
        { error: 'Failed to find payment plan', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const family = await Family.create({
      userId: user.userId, // Associate family with user
      name,
      hebrewName: hebrewName || undefined,
      weddingDate: new Date(weddingDate),
      husbandFirstName: husbandFirstName || undefined,
      husbandHebrewName: husbandHebrewName || undefined,
      husbandFatherHebrewName: husbandFatherHebrewName || undefined,
      wifeFirstName: wifeFirstName || undefined,
      wifeHebrewName: wifeHebrewName || undefined,
      wifeFatherHebrewName: wifeFatherHebrewName || undefined,
      husbandCellPhone: husbandCellPhone || undefined,
      wifeCellPhone: wifeCellPhone || undefined,
      address: address || undefined,
      street: street || undefined,
      phone: phone || undefined,
      email: email || undefined,
      city: city || undefined,
      state: state || undefined,
      zip: zip || undefined,
      paymentPlanId: paymentPlanId, // Only store ID, no currentPlan
      currentPayment: currentPayment || 0,
      openBalance: openBalance || 0,
      receiveEmails: body.receiveEmails !== false, // Default to true
      receiveSMS: body.receiveSMS !== false // Default to true
    })

    // Auto-create Stripe Customer for the family
    try {
      const { createStripeCustomerForFamily } = await import('@/lib/stripe-customer-helpers')
      await createStripeCustomerForFamily(family._id.toString())
    } catch (stripeError: any) {
      // Log error but don't fail family creation if Stripe customer creation fails
      console.error(`⚠️ Failed to create Stripe Customer for family ${family.name}:`, stripeError.message)
    }

    // Auto-create user account for family if email exists
    let familyUser = null
    let phoneNumber = ''
    if (email) {
      try {
        // Check if user already exists with this email
        const existingUser = await User.findOne({ email: email.toLowerCase() })
        
        // Get phone number (prefer husbandCellPhone, then wifeCellPhone, then phone)
        phoneNumber = husbandCellPhone || wifeCellPhone || phone || ''
        
        if (!existingUser) {
          // Create user account for family
          familyUser = await User.create({
            email: email.toLowerCase(),
            firstName: husbandFirstName || wifeFirstName || name.split(' ')[0] || 'Family',
            lastName: name.split(' ').slice(1).join(' ') || 'Member',
            role: 'family',
            familyId: family._id,
            phoneNumber: phoneNumber,
            isActive: true,
            emailVerified: false,
            password: null // No password - uses phone authentication
          })
          
          console.log(`✅ Created user account for family ${family.name}: ${familyUser.email}`)
        } else {
          // Update existing user to link to family if not already linked
          if (!existingUser.familyId) {
            existingUser.familyId = family._id
            existingUser.role = 'family'
            if (!existingUser.phoneNumber) {
              existingUser.phoneNumber = phoneNumber
            }
            await existingUser.save()
            familyUser = existingUser
            console.log(`✅ Linked existing user ${existingUser.email} to family ${family.name}`)
          } else {
            familyUser = existingUser
          }
        }
      } catch (error: any) {
        // Log error but don't fail family creation if user creation fails
        console.error(`⚠️ Failed to create user account for family ${family.name}:`, error.message)
      }
    }

    // Send welcome email with login details (if enabled in settings)
    if (email) {
      try {
        // Check if welcome emails are enabled for this admin
        const { AutomationSettings } = await import('@/lib/models')
        const mongoose = require('mongoose')
        const adminObjectId = new mongoose.Types.ObjectId(user.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: adminObjectId })
        
        const shouldSendEmail = automationSettings?.enableFamilyWelcomeEmails !== false // Default to true if not set
        const familyWantsEmails = family.receiveEmails !== false // Default to true if not set
        
        if (shouldSendEmail && familyWantsEmails) {
          const { sendFamilyWelcomeEmail } = await import('@/lib/email-helpers')
          
          // Get base URL from request or environment
          const baseUrl = request.nextUrl.origin || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
            process.env.NEXT_PUBLIC_BASE_URL || 
            'http://localhost:3000'
          
          const loginUrl = `${baseUrl}/login`
          
          await sendFamilyWelcomeEmail(
            email,
            family.name,
            loginUrl,
            phoneNumber
          )
          console.log(`✅ Welcome email sent to ${email}`)
        } else {
          if (!shouldSendEmail) {
            console.log(`ℹ️ Welcome email skipped - disabled in automation settings for admin ${user.userId}`)
          } else if (!familyWantsEmails) {
            console.log(`ℹ️ Welcome email skipped - family has opted out of emails`)
          }
        }
      } catch (emailError: any) {
        // Log error but don't fail family creation if email sending fails
        console.error(`⚠️ Failed to send welcome email to ${email}:`, emailError.message)
      }
    }

    // Send welcome SMS (if enabled in settings and phone number available)
    if (phoneNumber) {
      try {
        const { AutomationSettings } = await import('@/lib/models')
        const mongoose = require('mongoose')
        const adminObjectId = new mongoose.Types.ObjectId(user.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: adminObjectId })
        
        const shouldSendSMS = automationSettings?.enableFamilyWelcomeSMS === true
        const familyWantsSMS = family.receiveSMS !== false // Default to true if not set
        
        if (shouldSendSMS && familyWantsSMS) {
          const { sendFamilyWelcomeSMS } = await import('@/lib/sms-helpers')
          
          // Get base URL from request or environment
          const baseUrl = request.nextUrl.origin || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
            process.env.NEXT_PUBLIC_BASE_URL || 
            'http://localhost:3000'
          
          const loginUrl = `${baseUrl}/login`
          
          await sendFamilyWelcomeSMS(
            phoneNumber,
            family.name,
            loginUrl,
            user.userId
          )
          console.log(`✅ Welcome SMS sent to ${phoneNumber}`)
        } else {
          if (!shouldSendSMS) {
            console.log(`ℹ️ Welcome SMS skipped - disabled in automation settings for admin ${user.userId}`)
          } else if (!familyWantsSMS) {
            console.log(`ℹ️ Welcome SMS skipped - family has opted out of SMS`)
          }
        }
      } catch (smsError: any) {
        // Log error but don't fail family creation if SMS sending fails
        console.error(`⚠️ Failed to send welcome SMS to ${phoneNumber}:`, smsError.message)
      }
    }

    return NextResponse.json(family, { status: 201 })
  } catch (error: any) {
    console.error('Error creating family:', error)
    return NextResponse.json(
      { error: 'Failed to create family', details: error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, Task, Report, User } from '@/lib/models'

/**
 * One-time migration endpoint to assign all existing data to a specific user
 * This should be run once to migrate existing data to joelamrom@gmail.com
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      )
    }
    
    const userId = user._id.toString()
    let migrated = {
      families: 0,
      tasks: 0,
      reports: 0
    }
    
    // Migrate families without userId
    const familiesResult = await Family.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: userId } }
    )
    migrated.families = familiesResult.modifiedCount
    
    // Also migrate families with null userId
    const familiesNullResult = await Family.updateMany(
      { userId: null },
      { $set: { userId: userId } }
    )
    migrated.families += familiesNullResult.modifiedCount
    
    // Migrate tasks without userId
    const tasksResult = await Task.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: userId } }
    )
    migrated.tasks = tasksResult.modifiedCount
    
    // Also migrate tasks with null userId
    const tasksNullResult = await Task.updateMany(
      { userId: null },
      { $set: { userId: userId } }
    )
    migrated.tasks += tasksNullResult.modifiedCount
    
    // Migrate reports without userId
    const reportsResult = await Report.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: userId } }
    )
    migrated.reports = reportsResult.modifiedCount
    
    // Also migrate reports with null userId
    const reportsNullResult = await Report.updateMany(
      { userId: null },
      { $set: { userId: userId } }
    )
    migrated.reports += reportsNullResult.modifiedCount
    
    return NextResponse.json({
      success: true,
      message: `Successfully migrated all data to ${email}`,
      migrated,
      userId: userId,
      userName: `${user.firstName} ${user.lastName}`
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Backup, Family, Payment, FamilyMember, LifecycleEvent, Statement } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get backup history
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const backups = await Backup.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json(backups.map((b: any) => ({
      ...b,
      _id: b._id.toString()
    })))
  } catch (error: any) {
    console.error('Error fetching backups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backups', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create backup
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { backupType, includeData } = body

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    // Create backup record
    const backup = await Backup.create({
      userId: userObjectId,
      backupType: backupType || 'full',
      filename: `backup_${backupType}_${Date.now()}.json`,
      status: 'in_progress',
      recordCount: 0
    })

    try {
      let data: any = {}
      let recordCount = 0

      // Fetch data based on backup type
      if (backupType === 'full' || backupType === 'families') {
        const families = await Family.find({ userId: userObjectId }).lean()
        data.families = families
        recordCount += families.length
      }

      if (backupType === 'full' || backupType === 'payments') {
        // Get payments through families
        const families = await Family.find({ userId: userObjectId }).select('_id').lean()
        const familyIds = families.map((f: any) => f._id)
        const payments = await Payment.find({ familyId: { $in: familyIds } }).lean()
        data.payments = payments
        recordCount += payments.length
      }

      if (backupType === 'full' || backupType === 'members') {
        const families = await Family.find({ userId: userObjectId }).select('_id').lean()
        const familyIds = families.map(f => f._id)
        const members = await FamilyMember.find({ familyId: { $in: familyIds } }).lean()
        data.members = members
        recordCount += members.length
      }

      if (backupType === 'full' || backupType === 'events') {
        const families = await Family.find({ userId: userObjectId }).select('_id').lean()
        const familyIds = families.map(f => f._id)
        const events = await LifecycleEvent.find({ familyId: { $in: familyIds } }).lean()
        data.events = events
        recordCount += events.length
      }

      // Convert to JSON
      const jsonData = JSON.stringify(data, null, 2)
      const fileSize = Buffer.byteLength(jsonData, 'utf8')

      // Update backup record
      await Backup.findByIdAndUpdate(backup._id, {
        status: 'completed',
        recordCount,
        fileSize
      })

      return NextResponse.json({
        ...backup.toObject(),
        _id: backup._id.toString(),
        data: includeData ? jsonData : undefined,
        recordCount,
        fileSize
      })
    } catch (backupError: any) {
      await Backup.findByIdAndUpdate(backup._id, {
        status: 'failed',
        error: backupError.message
      })
      throw backupError
    }
  } catch (error: any) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Failed to create backup', details: error.message },
      { status: 500 }
    )
  }
}


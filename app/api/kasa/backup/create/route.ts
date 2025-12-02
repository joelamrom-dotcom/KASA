import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, FamilyMember, Payment, Backup } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Create backup
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { backupType = 'full' } = body

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Create backup record
    const backup = await Backup.create({
      userId,
      backupType,
      filename: `backup-${backupType}-${Date.now()}.json`,
      status: 'in_progress'
    })

    let backupData: any = {}
    let recordCount = 0

    // Export data based on type
    if (backupType === 'full' || backupType === 'families') {
      const families = await Family.find({ userId }).lean()
      backupData.families = families
      recordCount += families.length
    }

    if (backupType === 'full' || backupType === 'members') {
      const userFamilies = await Family.find({ userId }).select('_id').lean()
      const userFamilyIds = userFamilies.map(f => f._id)
      const members = await FamilyMember.find({ familyId: { $in: userFamilyIds } }).lean()
      backupData.members = members
      recordCount += members.length
    }

    if (backupType === 'full' || backupType === 'payments') {
      const userFamilies = await Family.find({ userId }).select('_id').lean()
      const userFamilyIds = userFamilies.map(f => f._id)
      const payments = await Payment.find({ familyId: { $in: userFamilyIds } }).lean()
      backupData.payments = payments
      recordCount += payments.length
    }

    // Update backup record
    backup.recordCount = recordCount
    backup.status = 'completed'
    backup.metadata = { dataSize: JSON.stringify(backupData).length }
    await backup.save()

    return NextResponse.json({
      success: true,
      backup: {
        _id: backup._id.toString(),
        filename: backup.filename,
        recordCount,
        status: backup.status
      },
      data: backupData // In production, this would be stored separately
    })
  } catch (error: any) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Failed to create backup', details: error.message },
      { status: 500 }
    )
  }
}


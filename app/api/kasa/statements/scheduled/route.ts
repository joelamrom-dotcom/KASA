import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { AutomationSettings } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get scheduled statement settings
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const settings = await AutomationSettings.findOne({ userId }).lean()

    return NextResponse.json({
      autoGenerateStatements: settings?.autoGenerateStatements || false,
      statementFrequency: settings?.statementFrequency || 'monthly',
      statementDay: settings?.statementDay || 1,
      autoSendEmails: settings?.autoSendStatementEmails || false
    })
  } catch (error: any) {
    console.error('Error fetching statement settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update scheduled statement settings
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { autoGenerateStatements, statementFrequency, statementDay, autoSendEmails } = body

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    await AutomationSettings.findOneAndUpdate(
      { userId },
      {
        $set: {
          autoGenerateStatements,
          statementFrequency,
          statementDay,
          autoSendStatementEmails: autoSendEmails
        }
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating statement settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    )
  }
}


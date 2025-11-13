import { NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEvent } from '@/lib/models'

// POST - Initialize default lifecycle event types
export async function POST() {
  try {
    await connectDB()
    
    const defaultEventTypes = [
      {
        type: 'chasena',
        name: 'Chasena (Wedding)',
        amount: 12180
      },
      {
        type: 'bar_mitzvah',
        name: 'Bar/Bat Mitzvah',
        amount: 1800
      },
      {
        type: 'birth_boy',
        name: 'Birth Boy',
        amount: 500
      },
      {
        type: 'birth_girl',
        name: 'Birth Girl',
        amount: 500
      }
    ]

    const created = []
    const skipped = []

    for (const eventType of defaultEventTypes) {
      try {
        // Check if it already exists
        const existing = await LifecycleEvent.findOne({ type: eventType.type })
        if (existing) {
          skipped.push(eventType.type)
        } else {
          await LifecycleEvent.create(eventType)
          created.push(eventType.type)
        }
      } catch (error: any) {
        console.error(`Error creating ${eventType.type}:`, error)
      }
    }

    return NextResponse.json({
      message: 'Default event types initialized',
      created,
      skipped,
      total: created.length + skipped.length
    })
  } catch (error: any) {
    console.error('Error initializing default event types:', error)
    return NextResponse.json(
      { error: 'Failed to initialize default event types', details: error.message },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { initializeDefaultData } from '@/lib/init-data'

// POST - Initialize default data
export async function POST() {
  try {
    await initializeDefaultData()
    return NextResponse.json({ message: 'Default data initialized successfully' })
  } catch (error: any) {
    console.error('Error initializing data:', error)
    return NextResponse.json(
      { error: 'Failed to initialize data', details: error.message },
      { status: 500 }
    )
  }
}


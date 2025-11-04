import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../lib/database-adapter.js'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    switch (action) {
      case 'optimize':
        const optimizationResult = await db.optimize()
        return NextResponse.json({
          message: 'Database optimized successfully',
          result: optimizationResult
        })
        
      case 'clear-cache':
        db.clearCache()
        return NextResponse.json({
          message: 'Cache cleared successfully'
        })
        
      case 'backup':
        const backupPath = await db.backup()
        return NextResponse.json({
          message: 'Database backed up successfully',
          backupPath
        })
        
      case 'stats':
        const stats = await db.getStats()
        return NextResponse.json({
          stats
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: optimize, clear-cache, backup, or stats' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error performing database action:', error)
    return NextResponse.json(
      { error: 'Failed to perform database action' },
      { status: 500 }
    )
  }
}

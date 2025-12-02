import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { InvoiceTemplate } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get document templates
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const templateType = searchParams.get('type') // 'invoice', 'receipt', 'statement', 'contract'

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const query: any = { userId: { $in: [userId, null] } } // Include global templates
    if (templateType) query.templateType = templateType

    const templates = await InvoiceTemplate.find(query).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    )
  }
}


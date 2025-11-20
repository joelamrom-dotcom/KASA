import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { InvoiceTemplate } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// DELETE - Delete invoice template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const template = await InvoiceTemplate.findOneAndDelete({
      _id: params.id,
      userId: userObjectId
    })
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template', details: error.message },
      { status: 500 }
    )
  }
}


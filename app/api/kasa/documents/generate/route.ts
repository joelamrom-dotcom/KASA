import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, Document, InvoiceTemplate } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Generate document
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { familyId, templateId, documentType, variables } = body

    if (!familyId || !documentType) {
      return NextResponse.json({ error: 'Family ID and document type are required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const family = await Family.findById(familyId).lean()
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Generate document content (simplified - would use actual template engine)
    let content = ''
    if (templateId) {
      const template = await InvoiceTemplate.findById(templateId).lean()
      if (template) {
        content = (template as any).content || ''
        // Replace variables
        Object.entries(variables || {}).forEach(([key, value]) => {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
        })
      }
    }

    // Create document record
    const document = await Document.create({
      userId,
      name: `${documentType} - ${(family as any).name}`,
      description: `Generated ${documentType}`,
      fileName: `${documentType}-${Date.now()}.pdf`,
      fileType: 'application/pdf',
      category: documentType === 'invoice' ? 'invoice' : 'other',
      relatedFamilyId: familyId
    })

    return NextResponse.json({
      document,
      content, // In production, this would be PDF binary
      message: 'Document generated successfully'
    })
  } catch (error: any) {
    console.error('Error generating document:', error)
    return NextResponse.json(
      { error: 'Failed to generate document', details: error.message },
      { status: 500 }
    )
  }
}


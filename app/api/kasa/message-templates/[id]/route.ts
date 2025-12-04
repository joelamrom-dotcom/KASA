import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { MessageTemplate } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await MessageTemplate.findById(id)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, subject, body: messageBody, bodyHtml, type, isHtml } = body

    const template = await MessageTemplate.findByIdAndUpdate(
      id,
      {
        name,
        subject: type === 'email' ? subject : undefined,
        body: messageBody,
        bodyHtml: bodyHtml || messageBody,
        type,
        isHtml: isHtml || false
      },
      { new: true, runValidators: true }
    )

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await MessageTemplate.findByIdAndDelete(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template', details: error.message },
      { status: 500 }
    )
  }
}

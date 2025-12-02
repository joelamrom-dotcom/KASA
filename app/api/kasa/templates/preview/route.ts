import { NextRequest, NextResponse } from 'next/server'
import { previewTemplate } from '@/lib/template-engine'

export const dynamic = 'force-dynamic'

// POST - Preview template with sample data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template, category = 'family' } = body

    if (!template) {
      return NextResponse.json({ error: 'Template is required' }, { status: 400 })
    }

    const preview = previewTemplate(template, category)

    return NextResponse.json({ preview })
  } catch (error: any) {
    console.error('Error previewing template:', error)
    return NextResponse.json(
      { error: 'Failed to preview template', details: error.message },
      { status: 500 }
    )
  }
}


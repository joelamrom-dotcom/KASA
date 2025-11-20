import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { MessageTemplate } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - List templates
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const templates = await MessageTemplate.find({ userId }).sort({ createdAt: -1 })

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create template
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, subject, body: messageBody, bodyHtml, type, isHtml } = body

    if (!name || !messageBody) {
      return NextResponse.json({ error: 'Name and body required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Extract variables from template
    const { extractVariables, AVAILABLE_VARIABLES } = await import('@/lib/template-variables')
    const usedVariables = extractVariables(messageBody + (subject || ''))
    const variables = usedVariables.map(varName => {
      const varDef = AVAILABLE_VARIABLES.find(v => v.name === varName)
      return varDef ? {
        name: varDef.name,
        displayName: varDef.displayName,
        category: varDef.category
      } : null
    }).filter(Boolean)

    const template = await MessageTemplate.create({
      userId,
      name,
      subject: type === 'email' ? subject : undefined,
      body: messageBody,
      bodyHtml: bodyHtml || messageBody,
      type,
      isHtml: isHtml || false,
      variables
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    )
  }
}


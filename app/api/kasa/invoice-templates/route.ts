import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { InvoiceTemplate } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get invoice/receipt templates for user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('templateType') as 'invoice' | 'receipt' | null
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const query: any = { userId: userObjectId, isActive: true }
    if (templateType) {
      query.templateType = templateType
    }
    
    const templates = await InvoiceTemplate.find(query).sort({ isDefault: -1, createdAt: -1 }).lean()
    
    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Error fetching invoice templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update invoice/receipt template
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const {
      templateType,
      templateName,
      headerLogo,
      headerText,
      headerSubtext,
      headerColor,
      primaryColor,
      secondaryColor,
      fontFamily,
      footerText,
      footerSubtext,
      customCSS,
      isDefault
    } = body
    
    if (!templateType || !['invoice', 'receipt'].includes(templateType)) {
      return NextResponse.json(
        { error: 'templateType must be "invoice" or "receipt"' },
        { status: 400 }
      )
    }
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    // If setting as default, unset other defaults for this user and template type
    if (isDefault) {
      await InvoiceTemplate.updateMany(
        { userId: userObjectId, templateType, isDefault: true },
        { $set: { isDefault: false } }
      )
    }
    
    // Check if template with same name exists
    const existingTemplate = await InvoiceTemplate.findOne({
      userId: userObjectId,
      templateType,
      templateName: templateName || 'Default'
    })
    
    if (existingTemplate) {
      // Update existing template
      const updated = await InvoiceTemplate.findByIdAndUpdate(
        existingTemplate._id,
        {
          headerLogo,
          headerText,
          headerSubtext,
          headerColor,
          primaryColor,
          secondaryColor,
          fontFamily,
          footerText,
          footerSubtext,
          customCSS,
          isDefault: isDefault || false,
          isActive: true
        },
        { new: true }
      )
      return NextResponse.json(updated)
    } else {
      // Create new template
      const template = await InvoiceTemplate.create({
        userId: userObjectId,
        templateType,
        templateName: templateName || 'Default',
        headerLogo,
        headerText,
        headerSubtext,
        headerColor,
        primaryColor,
        secondaryColor,
        fontFamily,
        footerText,
        footerSubtext,
        customCSS,
        isDefault: isDefault || false,
        isActive: true
      })
      return NextResponse.json(template, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error saving invoice template:', error)
    return NextResponse.json(
      { error: 'Failed to save template', details: error.message },
      { status: 500 }
    )
  }
}


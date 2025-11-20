import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { InvoiceTemplate } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

// DELETE - Delete invoice template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.SETTINGS_UPDATE))) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    // Get template before deleting for audit log
    const template = await InvoiceTemplate.findOne({
      _id: params.id,
      userId: userObjectId
    })
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    await InvoiceTemplate.findOneAndDelete({
      _id: params.id,
      userId: userObjectId
    })
    
    // Create audit log entry
    await auditLogFromRequest(request, user, 'invoice_template_delete', 'invoice_template', {
      entityId: params.id,
      entityName: template.templateName,
      description: `Deleted invoice template "${template.templateName}"`,
      metadata: {
        templateType: template.templateType,
        templateName: template.templateName,
      }
    })
    
    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template', details: error.message },
      { status: 500 }
    )
  }
}


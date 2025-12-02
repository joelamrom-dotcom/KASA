import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Export families to CSV/Excel
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const families = await Family.find({ userId }).lean()

    const exportData = families.map((f: any) => ({
      Name: f.name || '',
      'Hebrew Name': f.hebrewName || '',
      'Wedding Date': f.weddingDate ? new Date(f.weddingDate).toLocaleDateString() : '',
      'Husband First Name': f.husbandFirstName || '',
      'Wife First Name': f.wifeFirstName || '',
      Email: f.email || '',
      Phone: f.phone || '',
      Address: f.address || f.street || '',
      City: f.city || '',
      State: f.state || '',
      ZIP: f.zip || '',
      'Payment Plan': f.paymentPlanId || f.currentPlan || '',
      'Receive Emails': f.receiveEmails ? 'Yes' : 'No',
      'Receive SMS': f.receiveSMS ? 'Yes' : 'No'
    }))

    if (format === 'csv') {
      const headers = Object.keys(exportData[0] || {})
      const csvRows = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            return typeof value === 'string' && value.includes(',') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ]
      
      const csv = csvRows.join('\n')
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="families-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      return NextResponse.json({ data: exportData, count: exportData.length })
    }
  } catch (error: any) {
    console.error('Error exporting families:', error)
    return NextResponse.json(
      { error: 'Failed to export families', details: error.message },
      { status: 500 }
    )
  }
}


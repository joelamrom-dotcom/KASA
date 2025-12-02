import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Export payments to CSV/Excel
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const year = searchParams.get('year')

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Get user's families
    const userFamilies = await Family.find({ userId }).select('_id name').lean()
    const userFamilyIds = userFamilies.map(f => f._id)
    const familyMap = new Map(userFamilies.map((f: any) => [f._id.toString(), f.name]))

    // Build query
    const query: any = { familyId: { $in: userFamilyIds } }
    
    if (year) {
      query.year = parseInt(year)
    }
    
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    const payments = await Payment.find(query)
      .sort({ paymentDate: -1 })
      .lean()

    // Format data for export
    const exportData = payments.map((p: any) => ({
      Date: new Date(p.paymentDate).toLocaleDateString(),
      Family: familyMap.get(p.familyId.toString()) || 'Unknown',
      Amount: p.amount || 0,
      Method: p.paymentMethod || 'N/A',
      Type: p.type || 'N/A',
      Year: p.year || 'N/A',
      Notes: p.notes || ''
    }))

    if (format === 'csv') {
      // Generate CSV
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
          'Content-Disposition': `attachment; filename="payments-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // Return JSON for Excel processing
      return NextResponse.json({ data: exportData, count: exportData.length })
    }
  } catch (error: any) {
    console.error('Error exporting payments:', error)
    return NextResponse.json(
      { error: 'Failed to export payments', details: error.message },
      { status: 500 }
    )
  }
}


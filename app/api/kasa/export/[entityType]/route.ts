import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, Payment, FamilyMember, Invoice } from '@/lib/models'
import { format } from 'fast-csv'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

// POST - Export entity data in various formats
export async function POST(
  request: NextRequest,
  { params }: { params: { entityType: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { format: exportFormat = 'csv', fields, filters } = body

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    let data: any[] = []
    let Model: any

    switch (params.entityType) {
      case 'families':
        Model = Family
        break
      case 'payments':
        Model = Payment
        break
      case 'members':
        Model = FamilyMember
        break
      case 'invoices':
        Model = Invoice
        break
      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    const query: any = { userId }
    if (filters) {
      Object.assign(query, filters)
    }

    data = await Model.find(query).lean()

    if (exportFormat === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${params.entityType}-${new Date().toISOString()}.json"`
        }
      })
    }

    if (exportFormat === 'xml') {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<data>
${data.map(item => `  <item>
${Object.entries(item).map(([key, value]) => `    <${key}>${value}</${key}>`).join('\n')}
  </item>`).join('\n')}
</data>`
      
      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="${params.entityType}-${new Date().toISOString()}.xml"`
        }
      })
    }

    if (exportFormat === 'excel') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet(params.entityType)

      if (data.length > 0) {
        const headers = fields || Object.keys(data[0])
        worksheet.columns = headers.map((h: string) => ({ header: h, key: h }))
        data.forEach((row: any) => {
          worksheet.addRow(headers.map((h: string) => row[h] || ''))
        })
      }

      const buffer = await workbook.xlsx.writeBuffer()
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${params.entityType}-${new Date().toISOString()}.xlsx"`
        }
      })
    }

    // CSV format (default)
    const csvRows: string[] = []
    if (data.length > 0) {
      const headers = fields || Object.keys(data[0])
      csvRows.push(headers.join(','))
      data.forEach((row: any) => {
        csvRows.push(headers.map((h: string) => {
          const value = row[h]
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || ''
        }).join(','))
      })
    }

    return new NextResponse(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${params.entityType}-${new Date().toISOString()}.csv"`
      }
    })
  } catch (error: any) {
    console.error('Error exporting:', error)
    return NextResponse.json(
      { error: 'Failed to export', details: error.message },
      { status: 500 }
    )
  }
}


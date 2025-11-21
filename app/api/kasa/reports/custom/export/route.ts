import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { CustomReport } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST - Export report in specified format (PDF, Excel, CSV)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, format, reportData } = body // reportData from generate endpoint

    if (!['pdf', 'excel', 'csv'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use pdf, excel, or csv' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const report = await CustomReport.findOne({
      _id: reportId,
      userId: userObjectId
    }).lean()

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Generate export based on format
    if (format === 'csv') {
      return generateCSV(reportData, report)
    } else if (format === 'excel') {
      return await generateExcel(reportData, report)
    } else if (format === 'pdf') {
      return await generatePDF(reportData, report)
    }

    return NextResponse.json({ error: 'Format not implemented' }, { status: 400 })
  } catch (error: any) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Failed to export report', details: error.message },
      { status: 500 }
    )
  }
}

function generateCSV(reportData: any, report: any): NextResponse {
  const lines: string[] = []
  
  // Header
  lines.push(report.name)
  if (report.description) {
    lines.push(report.description)
  }
  lines.push(`Generated: ${new Date().toLocaleString()}`)
  lines.push('')

  // Summary
  if (reportData.summary && Object.keys(reportData.summary).length > 0) {
    lines.push('SUMMARY')
    Object.entries(reportData.summary).forEach(([key, value]) => {
      lines.push(`${key},${value}`)
    })
    lines.push('')
  }

  // Data headers
  if (reportData.data && reportData.data.length > 0) {
    const headers = report.fields.map((f: any) => f.label)
    lines.push(headers.join(','))
    
    // Data rows
    reportData.data.forEach((row: any) => {
      const values = report.fields.map((f: any) => {
        const val = row[f.label] || ''
        // Escape commas and quotes in CSV
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      })
      lines.push(values.join(','))
    })
  }

  // Comparison data
  if (reportData.comparison) {
    lines.push('')
    lines.push('COMPARISON PERIOD')
    if (reportData.comparison.summary) {
      Object.entries(reportData.comparison.summary).forEach(([key, value]) => {
        lines.push(`${key},${value}`)
      })
    }
  }

  const csvContent = lines.join('\n')
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}

async function generateExcel(reportData: any, report: any): Promise<NextResponse> {
  try {
    const ExcelJS = require('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Report')
    
    // Add title
    worksheet.mergeCells('A1', `${String.fromCharCode(64 + report.fields.length)}1`)
    const titleCell = worksheet.getCell('A1')
    titleCell.value = report.name
    titleCell.font = { size: 16, bold: true }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    
    let currentRow = 2
    
    // Add description if available
    if (report.description) {
      worksheet.mergeCells(`A${currentRow}`, `${String.fromCharCode(64 + report.fields.length)}${currentRow}`)
      const descCell = worksheet.getCell(`A${currentRow}`)
      descCell.value = report.description
      descCell.alignment = { wrapText: true }
      currentRow++
    }
    
    // Add generated date
    worksheet.mergeCells(`A${currentRow}`, `${String.fromCharCode(64 + report.fields.length)}${currentRow}`)
    const dateCell = worksheet.getCell(`A${currentRow}`)
    dateCell.value = `Generated: ${new Date().toLocaleString()}`
    currentRow += 2
    
    // Add summary if available
    if (reportData.summary && Object.keys(reportData.summary).length > 0) {
      worksheet.mergeCells(`A${currentRow}`, `${String.fromCharCode(64 + report.fields.length)}${currentRow}`)
      const summaryTitle = worksheet.getCell(`A${currentRow}`)
      summaryTitle.value = 'SUMMARY'
      summaryTitle.font = { bold: true, size: 12 }
      currentRow++
      
      Object.entries(reportData.summary).forEach(([key, value]) => {
        worksheet.getCell(`A${currentRow}`).value = key
        worksheet.getCell(`B${currentRow}`).value = typeof value === 'number' ? value : String(value)
        if (typeof value === 'number') {
          worksheet.getCell(`B${currentRow}`).numFmt = '#,##0.00'
        }
        currentRow++
      })
      currentRow++
    }
    
    // Add data headers
    if (reportData.data && reportData.data.length > 0) {
      const headers = report.fields.map((f: any) => f.label)
      headers.forEach((header: string, index: number) => {
        const cell = worksheet.getCell(currentRow, index + 1)
        cell.value = header
        cell.font = { bold: true }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
      currentRow++
      
      // Add data rows
      reportData.data.forEach((row: any) => {
        report.fields.forEach((field: any, index: number) => {
          const val = row[field.label] || ''
          const cell = worksheet.getCell(currentRow, index + 1)
          
          if (typeof val === 'number') {
            cell.value = val
            if (field.dataType === 'currency') {
              cell.numFmt = '$#,##0.00'
            } else {
              cell.numFmt = '#,##0.00'
            }
          } else if (val instanceof Date) {
            cell.value = val
            cell.numFmt = 'mm/dd/yyyy'
          } else {
            cell.value = String(val)
          }
          
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        })
        currentRow++
      })
      
      // Auto-size columns
      report.fields.forEach((field: any, index: number) => {
        worksheet.getColumn(index + 1).width = 15
      })
    }
    
    // Add comparison data if available
    if (reportData.comparison) {
      currentRow++
      worksheet.mergeCells(`A${currentRow}`, `${String.fromCharCode(64 + report.fields.length)}${currentRow}`)
      const compTitle = worksheet.getCell(`A${currentRow}`)
      compTitle.value = 'COMPARISON PERIOD'
      compTitle.font = { bold: true, size: 12 }
      currentRow++
      
      const compPeriod = worksheet.getCell(`A${currentRow}`)
      compPeriod.value = `Period: ${new Date(reportData.comparison.period.start).toLocaleDateString()} - ${new Date(reportData.comparison.period.end).toLocaleDateString()}`
      currentRow++
      
      if (reportData.comparison.summary) {
        Object.entries(reportData.comparison.summary).forEach(([key, value]) => {
          worksheet.getCell(`A${currentRow}`).value = key
          worksheet.getCell(`B${currentRow}`).value = typeof value === 'number' ? value : String(value)
          if (typeof value === 'number') {
            worksheet.getCell(`B${currentRow}`).numFmt = '#,##0.00'
          }
          currentRow++
        })
      }
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  } catch (error: any) {
    console.error('Error generating Excel file:', error)
    // Fallback to CSV if Excel generation fails
    console.warn('Falling back to CSV format')
    return generateCSV(reportData, report)
  }
}

async function generatePDF(reportData: any, report: any): Promise<NextResponse> {
  try {
    // Generate HTML content
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${report.name}</title>
  <style>
    @media print {
      @page { margin: 1cm; size: ${report.exportSettings?.pageSize || 'letter'} ${report.exportSettings?.pageOrientation || 'portrait'}; }
    }
    body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
    h1 { color: #333; margin-bottom: 10px; }
    h2 { color: #666; margin-top: 20px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    .summary { background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #333; }
    .summary-item { margin: 5px 0; }
    .comparison { background: #f0f9ff; padding: 15px; margin: 20px 0; border-left: 4px solid #3b82f6; }
  </style>
</head>
<body>
  <h1>${report.name}</h1>
  ${report.description ? `<p>${report.description}</p>` : ''}
  <p>Generated: ${new Date().toLocaleString()}</p>
  
  ${reportData.summary && Object.keys(reportData.summary).length > 0 ? `
    <div class="summary">
      <h2>Summary</h2>
      ${Object.entries(reportData.summary).map(([key, value]) => 
        `<div class="summary-item"><strong>${key}:</strong> ${typeof value === 'number' ? `$${value.toLocaleString()}` : value}</div>`
      ).join('')}
    </div>
  ` : ''}
  
  ${reportData.data && reportData.data.length > 0 ? `
    <h2>Data</h2>
    <table>
      <thead>
        <tr>
          ${report.fields.map((f: any) => `<th>${f.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${reportData.data.map((row: any) => `
          <tr>
            ${report.fields.map((f: any) => {
              const val = row[f.label] || ''
              return `<td>${typeof val === 'number' ? `$${val.toLocaleString()}` : String(val).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}
  
  ${reportData.comparison ? `
    <div class="comparison">
      <h2>Comparison Period</h2>
      <p>Period: ${new Date(reportData.comparison.period.start).toLocaleDateString()} - ${new Date(reportData.comparison.period.end).toLocaleDateString()}</p>
      ${reportData.comparison.summary ? `
        ${Object.entries(reportData.comparison.summary).map(([key, value]) => 
          `<div class="summary-item"><strong>${key}:</strong> ${typeof value === 'number' ? `$${value.toLocaleString()}` : value}</div>`
        ).join('')}
      ` : ''}
    </div>
  ` : ''}
</body>
</html>
    `
    
    // Try to use puppeteer if available, otherwise fall back to HTML
    try {
      let browser: any
      let puppeteer: any
      
      // Try puppeteer-core with chromium for serverless environments
      try {
        puppeteer = require('puppeteer-core')
        const chromium = require('@sparticuz/chromium')
        chromium.setGraphicsMode(false)
        
        browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        })
      } catch (e) {
        // Fallback to regular puppeteer if available
        try {
          puppeteer = require('puppeteer')
          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          })
        } catch (e2) {
          throw new Error('No PDF generator available')
        }
      }
      
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      
      const pdf = await page.pdf({
        format: report.exportSettings?.pageSize === 'a4' ? 'A4' : 'Letter',
        landscape: report.exportSettings?.pageOrientation === 'landscape',
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      })
      
      await browser.close()
      
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`
        }
      })
    } catch (puppeteerError: any) {
      // Fallback: return HTML that can be printed to PDF
      console.warn('PDF generator not available, returning HTML:', puppeteerError.message)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.html"`
        }
      })
    }
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    throw error
  }
}


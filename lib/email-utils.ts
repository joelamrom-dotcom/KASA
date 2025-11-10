import { Statement } from './models'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface StatementTransaction {
  type: 'payment' | 'withdrawal' | 'event'
  date: Date | string
  description: string
  amount: number
  notes?: string
}

export async function generateStatementPDF(
  statement: any,
  familyName: string,
  transactions: StatementTransaction[]
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([612, 792]) // US Letter size
    const { width, height } = page.getSize()
    
    const margin = 50
    const maxWidth = width - 2 * margin
    let yPosition = height - margin

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const formatDate = (date: Date | string) => {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)
    }

    // Helper function to add text with word wrapping
    const addText = (text: string, x: number, options: {
      font?: any
      size?: number
      color?: any
      maxWidth?: number
      align?: 'left' | 'center' | 'right'
    } = {}) => {
      const {
        font = helveticaFont,
        size = 10,
        color = rgb(0, 0, 0),
        maxWidth: textMaxWidth = maxWidth,
        align = 'left'
      } = options

      let textWidth = font.widthOfTextAtSize(text, size)
      let displayText = text

      // Handle text wrapping
      if (textWidth > textMaxWidth && textMaxWidth > 0) {
        const words = text.split(' ')
        let line = ''
        let lines: string[] = []
        
        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word
          const testWidth = font.widthOfTextAtSize(testLine, size)
          
          if (testWidth > textMaxWidth && line) {
            lines.push(line)
            line = word
          } else {
            line = testLine
          }
        }
        if (line) lines.push(line)
        displayText = lines.join('\n')
      }

      // Calculate x position for alignment
      let xPos = x
      if (align === 'center') {
        textWidth = font.widthOfTextAtSize(displayText.split('\n')[0] || displayText, size)
        xPos = x + (textMaxWidth - textWidth) / 2
      } else if (align === 'right') {
        textWidth = font.widthOfTextAtSize(displayText.split('\n')[0] || displayText, size)
        xPos = x + textMaxWidth - textWidth
      }

      page.drawText(displayText, {
        x: xPos,
        y: yPosition,
        size,
        font,
        color,
        maxWidth: textMaxWidth > 0 ? textMaxWidth : undefined
      })

      // Return the height used (approximate)
      const lines = displayText.split('\n').length
      const heightUsed = lines * size * 1.2
      yPosition -= heightUsed
      return heightUsed
    }

    // Header
    addText('Kasa Family Management', margin, {
      font: helveticaBoldFont,
      size: 24,
      color: rgb(0.31, 0.27, 0.90), // #4F46E5
      align: 'center',
      maxWidth: maxWidth
    })
    
    addText('Monthly Statement', margin, {
      size: 14,
      color: rgb(0.4, 0.4, 0.4),
      align: 'center',
      maxWidth: maxWidth
    })
    
    yPosition -= 20

    // Statement Info
    addText(`Family: ${familyName}`, margin, { size: 10 })
    yPosition -= 5
    addText(`Statement Number: ${statement.statementNumber}`, margin, { size: 10 })
    yPosition -= 5
    addText(`Statement Date: ${formatDate(statement.date)}`, margin, { size: 10 })
    yPosition -= 5
    addText(`Period: ${formatDate(statement.fromDate)} - ${formatDate(statement.toDate)}`, margin, { size: 10 })
    yPosition -= 20

    // Summary Section
    addText('Summary', margin, {
      font: helveticaBoldFont,
      size: 14,
      color: rgb(0.31, 0.27, 0.90)
    })
    yPosition -= 10

    const summaryLeft = margin
    const summaryRight = margin + 200

    const balanceY = yPosition
    addText('Opening Balance:', summaryLeft, { size: 10 })
    yPosition = balanceY
    addText(formatCurrency(statement.openingBalance), summaryRight, { size: 10, align: 'right', maxWidth: 100 })
    yPosition = balanceY - 20

    const incomeY = yPosition
    addText('Income:', summaryLeft, { size: 10, color: rgb(0.06, 0.73, 0.51) }) // #10b981
    yPosition = incomeY
    addText(formatCurrency(statement.income), summaryRight, { size: 10, color: rgb(0.06, 0.73, 0.51), align: 'right', maxWidth: 100 })
    yPosition = incomeY - 20

    const withdrawalsY = yPosition
    addText('Withdrawals:', summaryLeft, { size: 10, color: rgb(0.94, 0.27, 0.27) }) // #ef4444
    yPosition = withdrawalsY
    addText(formatCurrency(statement.withdrawals), summaryRight, { size: 10, color: rgb(0.94, 0.27, 0.27), align: 'right', maxWidth: 100 })
    yPosition = withdrawalsY - 20

    const expensesY = yPosition
    addText('Expenses:', summaryLeft, { size: 10, color: rgb(0.94, 0.27, 0.27) })
    yPosition = expensesY
    addText(formatCurrency(statement.expenses), summaryRight, { size: 10, color: rgb(0.94, 0.27, 0.27), align: 'right', maxWidth: 100 })
    yPosition = expensesY - 20

    const closingY = yPosition
    addText('Closing Balance:', summaryLeft, { font: helveticaBoldFont, size: 12 })
    yPosition = closingY
    addText(formatCurrency(statement.closingBalance), summaryRight, { font: helveticaBoldFont, size: 12, align: 'right', maxWidth: 100 })
    yPosition = closingY - 30

    // Transactions Section
    if (transactions.length > 0) {
      // Check if we need a new page
      if (yPosition < 200) {
        page = pdfDoc.addPage([612, 792])
        yPosition = height - margin
      }

      addText('Transaction Details', margin, {
        font: helveticaBoldFont,
        size: 14,
        color: rgb(0.31, 0.27, 0.90)
      })
      yPosition -= 10

      // Table headers
      const tableTop = yPosition
      const tableLeft = margin
      const dateWidth = 80
      const descWidth = 200
      const amountWidth = 100
      const notesWidth = 100

      addText('Date', tableLeft, { font: helveticaBoldFont, size: 9, maxWidth: dateWidth })
      yPosition = tableTop
      addText('Description', tableLeft + dateWidth, { font: helveticaBoldFont, size: 9, maxWidth: descWidth })
      yPosition = tableTop
      addText('Amount', tableLeft + dateWidth + descWidth, { font: helveticaBoldFont, size: 9, maxWidth: amountWidth })
      yPosition = tableTop
      addText('Notes', tableLeft + dateWidth + descWidth + amountWidth, { font: helveticaBoldFont, size: 9, maxWidth: notesWidth })

      // Draw line under headers
      yPosition = tableTop - 15
      page.drawLine({
        start: { x: tableLeft, y: yPosition },
        end: { x: tableLeft + dateWidth + descWidth + amountWidth + notesWidth, y: yPosition },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      })

      yPosition -= 10

      transactions.forEach((transaction) => {
        // Check if we need a new page
        if (yPosition < 100) {
          page = pdfDoc.addPage([612, 792])
          yPosition = height - margin
        }

        const rowY = yPosition
        addText(formatDate(transaction.date), tableLeft, { size: 9, maxWidth: dateWidth })
        
        const desc = transaction.description.length > 30 
          ? transaction.description.substring(0, 27) + '...' 
          : transaction.description
        yPosition = rowY
        addText(desc, tableLeft + dateWidth, { size: 9, maxWidth: descWidth })
        
        const amountText = `${transaction.amount >= 0 ? '+' : ''}${formatCurrency(transaction.amount)}`
        const amountColor = transaction.amount >= 0 
          ? rgb(0.06, 0.73, 0.51) 
          : rgb(0.94, 0.27, 0.27)
        yPosition = rowY
        addText(amountText, tableLeft + dateWidth + descWidth, { 
          size: 9, 
          color: amountColor, 
          maxWidth: amountWidth 
        })
        
        const notes = (transaction.notes || '-').length > 20
          ? (transaction.notes || '-').substring(0, 17) + '...'
          : (transaction.notes || '-')
        yPosition = rowY
        addText(notes, tableLeft + dateWidth + descWidth + amountWidth, { size: 9, maxWidth: notesWidth })

        yPosition = rowY - 20
      })

      yPosition -= 10
    }

    // Footer
    yPosition -= 30
    addText('This is an automated statement from Kasa Family Management System.', margin, {
      size: 8,
      color: rgb(0.42, 0.45, 0.50),
      align: 'center',
      maxWidth: maxWidth
    })
    addText('If you have any questions, please contact us.', margin, {
      size: 8,
      color: rgb(0.42, 0.45, 0.50),
      align: 'center',
      maxWidth: maxWidth
    })

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

export function formatStatementAsHTML(
  statement: any,
  familyName: string,
  transactions: StatementTransaction[]
): string {
  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #4F46E5;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 5px 0;
    }
    .statement-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 6px;
    }
    .info-section {
      flex: 1;
    }
    .info-section h3 {
      margin: 0 0 10px 0;
      color: #4F46E5;
      font-size: 14px;
      text-transform: uppercase;
    }
    .info-section p {
      margin: 5px 0;
      color: #333;
    }
    .summary {
      margin: 30px 0;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .summary-table th {
      background-color: #4F46E5;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    .summary-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .summary-table tr:last-child td {
      border-bottom: none;
      font-weight: bold;
      background-color: #f9fafb;
    }
    .transactions {
      margin-top: 30px;
    }
    .transactions h2 {
      color: #4F46E5;
      border-bottom: 2px solid #4F46E5;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .transaction-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .transaction-table th {
      background-color: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    .transaction-table td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .transaction-table tr:hover {
      background-color: #f9fafb;
    }
    .amount-positive {
      color: #10b981;
      font-weight: 600;
    }
    .amount-negative {
      color: #ef4444;
      font-weight: 600;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kasa Family Management</h1>
      <p>Monthly Statement</p>
    </div>

    <div class="statement-info">
      <div class="info-section">
        <h3>Family</h3>
        <p>${familyName}</p>
      </div>
      <div class="info-section">
        <h3>Statement Number</h3>
        <p>${statement.statementNumber}</p>
      </div>
      <div class="info-section">
        <h3>Statement Date</h3>
        <p>${formatDate(statement.date)}</p>
      </div>
    </div>

    <div class="summary">
      <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; margin-bottom: 20px;">Summary</h2>
      <table class="summary-table">
        <tr>
          <th>Period</th>
          <td>${formatDate(statement.fromDate)} - ${formatDate(statement.toDate)}</td>
        </tr>
        <tr>
          <th>Opening Balance</th>
          <td>${formatCurrency(statement.openingBalance)}</td>
        </tr>
        <tr>
          <th>Income</th>
          <td class="amount-positive">${formatCurrency(statement.income)}</td>
        </tr>
        <tr>
          <th>Withdrawals</th>
          <td class="amount-negative">${formatCurrency(statement.withdrawals)}</td>
        </tr>
        <tr>
          <th>Expenses</th>
          <td class="amount-negative">${formatCurrency(statement.expenses)}</td>
        </tr>
        <tr>
          <th>Closing Balance</th>
          <td style="font-weight: bold; font-size: 16px;">${formatCurrency(statement.closingBalance)}</td>
        </tr>
      </table>
    </div>

    ${transactions.length > 0 ? `
    <div class="transactions">
      <h2>Transaction Details</h2>
      <table class="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(t => `
            <tr>
              <td>${formatDate(t.date)}</td>
              <td>${t.description}</td>
              <td class="${t.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                ${t.amount >= 0 ? '+' : ''}${formatCurrency(t.amount)}
              </td>
              <td>${t.notes || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <p>This is an automated statement from Kasa Family Management System.</p>
      <p>If you have any questions, please contact us.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}


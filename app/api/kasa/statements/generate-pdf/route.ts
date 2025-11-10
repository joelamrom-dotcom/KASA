import { NextRequest, NextResponse } from 'next/server'
import { generateStatementPDF, StatementTransaction } from '@/lib/email-utils'

// POST - Generate PDF for a statement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { statement, familyName, transactions } = body

    if (!statement || !familyName) {
      return NextResponse.json(
        { error: 'Statement and family name are required' },
        { status: 400 }
      )
    }

    const pdfBuffer = await generateStatementPDF(
      statement,
      familyName,
      transactions || []
    )

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Statement_${statement.statementNumber}.pdf"`
      }
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    )
  }
}


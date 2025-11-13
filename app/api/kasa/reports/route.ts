import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Report } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get all reports
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const reports = await Report.find({})
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(reports.map((report: any) => ({
      ...report,
      _id: report._id.toString()
    })))
  } catch (error: any) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new report from chat conversation
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { title, question, answer, reportType, metadata, tags, notes } = body

    if (!title || !question || !answer) {
      return NextResponse.json(
        { error: 'Title, question, and answer are required' },
        { status: 400 }
      )
    }

    const report = await Report.create({
      title,
      question,
      answer,
      reportType: reportType || 'chat',
      metadata: metadata || {},
      tags: tags || [],
      notes: notes || ''
    })

    return NextResponse.json({
      message: 'Report created successfully',
      report: {
        ...report.toObject(),
        _id: report._id.toString()
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report', details: error.message },
      { status: 500 }
    )
  }
}


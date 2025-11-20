import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, Payment, FamilyMember, LifecycleEvent, Statement, Withdrawal, Task, FamilyNote } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Export all data in various formats
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const dataType = searchParams.get('type') || 'full' // full, families, payments, etc.

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    let data: any = {}

    // Fetch data based on type
    if (dataType === 'full' || dataType === 'families') {
      const families = await Family.find({ userId: userObjectId }).lean()
      data.families = families.map((f: any) => ({
        ...f,
        _id: f._id.toString()
      }))
    }

    if (dataType === 'full' || dataType === 'payments') {
      const families = await Family.find({ userId: userObjectId }).select('_id').lean()
      const familyIds = families.map(f => f._id)
      const payments = await Payment.find({ familyId: { $in: familyIds } }).lean()
      data.payments = payments.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
        familyId: p.familyId?.toString()
      }))
    }

    if (dataType === 'full' || dataType === 'members') {
      const families = await Family.find({ userId: userObjectId }).select('_id').lean()
      const familyIds = families.map(f => f._id)
      const members = await FamilyMember.find({ familyId: { $in: familyIds } }).lean()
      data.members = members.map((m: any) => ({
        ...m,
        _id: m._id.toString(),
        familyId: m.familyId?.toString()
      }))
    }

    if (dataType === 'full' || dataType === 'events') {
      const families = await Family.find({ userId: userObjectId }).select('_id').lean()
      const familyIds = families.map(f => f._id)
      const events = await LifecycleEvent.find({ familyId: { $in: familyIds } }).lean()
      data.events = events.map((e: any) => ({
        ...e,
        _id: e._id.toString(),
        familyId: e.familyId?.toString()
      }))
    }

    if (dataType === 'full') {
      // Include all other data types
      const families = await Family.find({ userId: userObjectId }).select('_id').lean()
      const familyIds = families.map(f => f._id)
      
      const statements = await Statement.find({ familyId: { $in: familyIds } }).lean()
      data.statements = statements.map((s: any) => ({
        ...s,
        _id: s._id.toString(),
        familyId: s.familyId?.toString()
      }))

      const tasks = await Task.find({ userId: userObjectId }).lean()
      data.tasks = tasks.map((t: any) => ({
        ...t,
        _id: t._id.toString()
      }))

      const notes = await FamilyNote.find({ familyId: { $in: familyIds } }).lean()
      data.notes = notes.map((n: any) => ({
        ...n,
        _id: n._id.toString(),
        familyId: n.familyId?.toString()
      }))
    }

    // Export in requested format
    if (format === 'csv') {
      return exportToCSV(data, dataType)
    } else if (format === 'excel') {
      return exportToCSV(data, dataType) // For now, return CSV (can be enhanced)
    } else {
      // JSON format
      const jsonData = JSON.stringify(data, null, 2)
      return new NextResponse(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="kasa_export_${dataType}_${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }
  } catch (error: any) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data', details: error.message },
      { status: 500 }
    )
  }
}

function exportToCSV(data: any, dataType: string): NextResponse {
  const lines: string[] = []
  
  if (data.families && data.families.length > 0) {
    lines.push('FAMILIES')
    const headers = Object.keys(data.families[0]).filter(k => !k.startsWith('_'))
    lines.push(headers.join(','))
    data.families.forEach((family: any) => {
      const values = headers.map(h => {
        const val = family[h]
        if (val === null || val === undefined) return ''
        if (typeof val === 'object') return JSON.stringify(val)
        return String(val).replace(/,/g, ';')
      })
      lines.push(values.join(','))
    })
    lines.push('')
  }

  if (data.payments && data.payments.length > 0) {
    lines.push('PAYMENTS')
    const headers = Object.keys(data.payments[0]).filter(k => !k.startsWith('_'))
    lines.push(headers.join(','))
    data.payments.forEach((payment: any) => {
      const values = headers.map(h => {
        const val = payment[h]
        if (val === null || val === undefined) return ''
        if (typeof val === 'object') return JSON.stringify(val)
        return String(val).replace(/,/g, ';')
      })
      lines.push(values.join(','))
    })
    lines.push('')
  }

  const csvContent = lines.join('\n')
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="kasa_export_${dataType}_${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}


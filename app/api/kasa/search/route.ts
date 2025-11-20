import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember, Payment, LifecycleEvent, Task, Statement } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.toLowerCase().trim()
    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const results: any[] = []

    // Search Families
    const families = await Family.find({
      userId,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { hebrewName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { husbandFirstName: { $regex: searchTerm, $options: 'i' } },
        { wifeFirstName: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
        { city: { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(5).select('name hebrewName email phone')

    families.forEach((family: any) => {
      results.push({
        type: 'family',
        id: family._id.toString(),
        title: family.name || family.hebrewName || 'Unnamed Family',
        subtitle: `${family.email || ''} ${family.phone || ''}`.trim() || undefined,
        url: `/families/${family._id}`
      })
    })

    // Search Members
    const members = await FamilyMember.find({
      userId,
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { hebrewName: { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(5).populate('familyId', 'name').select('firstName lastName hebrewName familyId')

    members.forEach((member: any) => {
      results.push({
        type: 'member',
        id: member._id.toString(),
        title: `${member.firstName} ${member.lastName}`.trim() || member.hebrewName || 'Unnamed Member',
        subtitle: member.familyId?.name || 'No family',
        url: `/families/${member.familyId?._id || ''}`
      })
    })

    // Search Payments
    const payments = await Payment.find({
      userId,
      $or: [
        { notes: { $regex: searchTerm, $options: 'i' } },
        { paymentMethod: { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(5).populate('familyId', 'name').select('amount date notes paymentMethod familyId')

    payments.forEach((payment: any) => {
      results.push({
        type: 'payment',
        id: payment._id.toString(),
        title: `$${payment.amount?.toLocaleString() || '0'} - ${payment.familyId?.name || 'Unknown'}`,
        subtitle: payment.date ? new Date(payment.date).toLocaleDateString() : undefined,
        url: `/families/${payment.familyId?._id || ''}`
      })
    })

    // Search Lifecycle Events
    const events = await LifecycleEvent.find({
      userId,
      $or: [
        { eventType: { $regex: searchTerm, $options: 'i' } },
        { notes: { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(5).populate('familyId', 'name').select('eventType date notes familyId')

    events.forEach((event: any) => {
      results.push({
        type: 'event',
        id: event._id.toString(),
        title: `${event.eventType || 'Event'} - ${event.familyId?.name || 'Unknown'}`,
        subtitle: event.date ? new Date(event.date).toLocaleDateString() : undefined,
        url: `/families/${event.familyId?._id || ''}`
      })
    })

    // Search Tasks
    const tasks = await Task.find({
      userId,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(5).populate('relatedFamilyId', 'name').select('title description dueDate relatedFamilyId')

    tasks.forEach((task: any) => {
      results.push({
        type: 'task',
        id: task._id.toString(),
        title: task.title || 'Untitled Task',
        subtitle: task.relatedFamilyId?.name || (task.dueDate ? new Date(task.dueDate).toLocaleDateString() : undefined),
        url: `/tasks`
      })
    })

    // Search Statements
    const statements = await Statement.find({
      userId,
      $or: [
        { statementNumber: { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(5).populate('familyId', 'name').select('statementNumber startDate endDate familyId')

    statements.forEach((statement: any) => {
      results.push({
        type: 'statement',
        id: statement._id.toString(),
        title: `Statement ${statement.statementNumber || ''} - ${statement.familyId?.name || 'Unknown'}`,
        subtitle: statement.startDate && statement.endDate 
          ? `${new Date(statement.startDate).toLocaleDateString()} - ${new Date(statement.endDate).toLocaleDateString()}`
          : undefined,
        url: `/statements`
      })
    })

    // Sort by relevance (exact matches first, then partial)
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()
      const aExact = aTitle === searchTerm || aTitle.startsWith(searchTerm)
      const bExact = bTitle === searchTerm || bTitle.startsWith(searchTerm)
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return 0
    })

    return NextResponse.json({ results: results.slice(0, 20) })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    )
  }
}


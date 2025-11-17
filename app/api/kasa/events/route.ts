import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEventPayment, Family } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

// GET - Get all lifecycle events with family details (filtered by user)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Build query - admin sees all, regular users only their families' events
    let query: any = {}
    if (!isAdmin(user)) {
      // Get user's family IDs
      const userFamilies = await Family.find({ userId: user.userId }).select('_id')
      const userFamilyIds = userFamilies.map(f => f._id)
      query.familyId = { $in: userFamilyIds }
    }
    
    // Find lifecycle events
    const events = await LifecycleEventPayment.find(query)
      .sort({ eventDate: -1 })
      .populate('familyId', 'name')
    
    // Format the response with family details
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const eventObj = event.toObject()
        let familyName = 'Unknown Family'
        
        // Handle populated family or fetch it separately
        if (eventObj.familyId && typeof eventObj.familyId === 'object' && 'name' in eventObj.familyId) {
          familyName = (eventObj.familyId as any).name
        } else if (eventObj.familyId) {
          // If not populated, fetch the family
          try {
            const family = await Family.findById(eventObj.familyId)
            if (family) {
              familyName = family.name
            }
          } catch (err) {
            console.error('Error fetching family:', err)
          }
        }
        
        // Format event type for display
        const eventTypeLabels: { [key: string]: string } = {
          'chasena': 'Chasena (Wedding)',
          'bar_mitzvah': 'Bar/Bat Mitzvah',
          'birth_boy': 'Birth Boy',
          'birth_girl': 'Birth Girl'
        }
        
        return {
          _id: eventObj._id.toString(),
          familyId: eventObj.familyId?._id?.toString() || eventObj.familyId?.toString(),
          familyName,
          eventType: eventObj.eventType,
          eventTypeLabel: eventTypeLabels[eventObj.eventType] || eventObj.eventType,
          eventDate: eventObj.eventDate,
          year: eventObj.year,
          amount: eventObj.amount,
          notes: eventObj.notes || ''
        }
      })
    )
    
    return NextResponse.json(formattedEvents)
  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message },
      { status: 500 }
    )
  }
}


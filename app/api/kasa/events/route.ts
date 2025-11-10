import { NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEventPayment, Family } from '@/lib/models'

// GET - Get all lifecycle events with family details
export async function GET() {
  try {
    await connectDB()
    
    // Find all lifecycle events
    const events = await LifecycleEventPayment.find({})
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


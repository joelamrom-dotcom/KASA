import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEventPayment, Family } from '@/lib/models'
import { getAuthenticatedUser, isAdmin, isImpersonating } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

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
    
    // Check if impersonating - if so, use impersonated user's permissions
    const impersonating = isImpersonating(request)
    
    // Always filter by user's families (unless impersonating, in which case filter by impersonated user's families)
    // Include legacy families (without userId) for backward compatibility
    const userFamilies = await Family.find({
      $or: [
        { userId: user.userId },
        { userId: { $exists: false } }, // Legacy families without userId
        { userId: null } // Families with null userId
      ]
    }).select('_id').lean()
    const userFamilyIds = userFamilies.map((f: any) => f._id.toString())
    
    // Build query - always filter by user's families
    let query: any = {}
    if (userFamilyIds.length > 0) {
      query.familyId = { $in: userFamilyIds }
    } else {
      // If user has no families, return empty array
      return NextResponse.json([])
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


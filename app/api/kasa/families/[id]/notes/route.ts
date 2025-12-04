import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { FamilyNote } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get all notes for a family
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const notes = await FamilyNote.find({ familyId: id })
      .sort({ createdAt: -1 }) // Newest first
      .lean()
    
    return NextResponse.json(notes)
  } catch (error: any) {
    console.error('Error fetching family notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { note } = body
    
    if (!note || !note.trim()) {
      return NextResponse.json(
        { error: 'Note is required' },
        { status: 400 }
      )
    }
    
    const familyNote = await FamilyNote.create({
      familyId: id,
      note: note.trim(),
      checked: false
    })
    
    // Trigger automation rules for note added
    try {
      const { executeAutomationRules } = await import('@/lib/automation-engine')
      const { getAuthenticatedUser } = await import('@/lib/middleware')
      const user = getAuthenticatedUser(request)
      
      if (user) {
        await executeAutomationRules(
          {
            type: 'note_added',
            familyId: id,
            data: {
              note: note.trim(),
              noteId: familyNote._id.toString(),
            },
          },
          user.userId
        )
      }
    } catch (automationError) {
      console.error('Error executing automation rules for note:', automationError)
      // Don't fail the note creation if automation fails
    }
    
    return NextResponse.json(familyNote, { status: 201 })
  } catch (error: any) {
    console.error('Error creating family note:', error)
    return NextResponse.json(
      { error: 'Failed to create note', details: error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { FamilyNote } from '@/lib/models'
import { moveToRecycleBin } from '@/lib/recycle-bin'

export const dynamic = 'force-dynamic'

// PUT - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { note, checked, checkedBy } = body
    
    const updateData: any = {}
    
    if (note !== undefined) {
      if (!note || !note.trim()) {
        return NextResponse.json(
          { error: 'Note cannot be empty' },
          { status: 400 }
        )
      }
      updateData.note = note.trim()
    }
    
    if (checked !== undefined) {
      updateData.checked = checked
      if (checked) {
        updateData.checkedAt = new Date()
        updateData.checkedBy = checkedBy || 'System'
      } else {
        updateData.checkedAt = undefined
        updateData.checkedBy = undefined
      }
    }
    
    const updatedNote = await FamilyNote.findByIdAndUpdate(
      params.noteId,
      updateData,
      { new: true }
    )
    
    if (!updatedNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updatedNote)
  } catch (error: any) {
    console.error('Error updating family note:', error)
    return NextResponse.json(
      { error: 'Failed to update note', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a note (move to recycle bin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    await connectDB()
    
    const note = await FamilyNote.findById(params.noteId)
    
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    // Move to recycle bin
    await moveToRecycleBin('note', params.noteId, note.toObject())
    
    // Delete from database
    await FamilyNote.findByIdAndDelete(params.noteId)
    
    return NextResponse.json({ message: 'Note moved to recycle bin successfully' })
  } catch (error: any) {
    console.error('Error deleting family note:', error)
    return NextResponse.json(
      { error: 'Failed to delete note', details: error.message },
      { status: 500 }
    )
  }
}


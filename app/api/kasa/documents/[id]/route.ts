import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Document } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// GET - Download document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)
    const documentId = new mongoose.Types.ObjectId(params.id)

    const document = await Document.findOne({ _id: documentId, userId })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Read file
    const filePath = join(process.cwd(), document.filePath)
    const fileBuffer = await readFile(filePath)

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.fileSize?.toString() || fileBuffer.length.toString()
      }
    })
  } catch (error: any) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { error: 'Failed to download document', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)
    const documentId = new mongoose.Types.ObjectId(params.id)

    const document = await Document.findOne({ _id: documentId, userId })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), document.filePath)
      await unlink(filePath)
    } catch (fileError) {
      console.warn('File not found, continuing with database deletion:', fileError)
    }

    // Delete document record
    await Document.findByIdAndDelete(documentId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document', details: error.message },
      { status: 500 }
    )
  }
}


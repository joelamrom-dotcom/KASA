import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Document } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

// GET - List documents
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const familyId = searchParams.get('familyId')
    const search = searchParams.get('search')

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const query: any = { userId }
    
    if (category) {
      query.category = category
    }
    
    if (familyId) {
      query.relatedFamilyId = new mongoose.Types.ObjectId(familyId)
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    const documents = await Document.find(query)
      .populate('relatedFamilyId', 'name')
      .populate('relatedMemberId', 'firstName lastName')
      .sort({ createdAt: -1 })

    return NextResponse.json({ documents })
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Upload document
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const relatedFamilyId = formData.get('relatedFamilyId') as string
    const relatedMemberId = formData.get('relatedMemberId') as string
    const tags = formData.get('tags') as string

    if (!file || !name) {
      return NextResponse.json({ error: 'File and name required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'documents')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${originalName}`
    const filePath = join(uploadsDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create document record
    const document = await Document.create({
      userId,
      name,
      description,
      fileName: originalName,
      fileSize: file.size,
      fileType: file.type,
      filePath: filePath.replace(process.cwd(), ''), // Relative path
      category: category || 'other',
      relatedFamilyId: relatedFamilyId ? new mongoose.Types.ObjectId(relatedFamilyId) : undefined,
      relatedMemberId: relatedMemberId ? new mongoose.Types.ObjectId(relatedMemberId) : undefined,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : []
    })

    return NextResponse.json({ document })
  } catch (error: any) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Failed to upload document', details: error.message },
      { status: 500 }
    )
  }
}


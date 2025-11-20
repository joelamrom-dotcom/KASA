import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import webpush from 'web-push'

export const dynamic = 'force-dynamic'

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@kasa.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

// POST - Send push notification
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, title, body: message, url, tag } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and body required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    let targetUsers: any[] = []

    if (userId) {
      // Send to specific user
      const targetUser = await User.findById(userId)
      if (targetUser && targetUser.pushSubscription && targetUser.pushEnabled) {
        targetUsers = [targetUser]
      }
    } else {
      // Send to all users with push enabled
      targetUsers = await User.find({
        pushEnabled: true,
        pushSubscription: { $exists: true, $ne: null }
      })
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const targetUser of targetUsers) {
      try {
        if (!targetUser.pushSubscription) continue

        const payload = JSON.stringify({
          title,
          body: message,
          url: url || '/',
          tag: tag || 'notification',
          icon: '/kasa-logo.png',
          badge: '/kasa-logo.png',
          vibrate: [200, 100, 200]
        })

        await webpush.sendNotification(
          targetUser.pushSubscription,
          payload
        )

        results.sent++
      } catch (error: any) {
        results.failed++
        results.errors.push(`User ${targetUser.email}: ${error.message}`)
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          await User.findByIdAndUpdate(targetUser._id, {
            $unset: {
              pushSubscription: '',
              pushEnabled: ''
            }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error: any) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send push notification', details: error.message },
      { status: 500 }
    )
  }
}


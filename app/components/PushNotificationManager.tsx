'use client'

import { useState, useEffect } from 'react'
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline'
import { getUser } from '@/lib/auth'

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true)
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications')
      return
    }

    const permission = await Notification.requestPermission()
    setPermission(permission)

    if (permission === 'granted') {
      await subscribeToPush()
    }
  }

  const subscribeToPush = async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready

      // Get VAPID public key from server
      const response = await fetch('/api/kasa/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to get subscription key')
      }

      const { publicKey } = await response.json()

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      })

      // Send subscription to server
      const user = getUser()
      await fetch('/api/kasa/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: user?.userId
        })
      })

      setIsSubscribed(true)
      localStorage.setItem('push-subscribed', 'true')
    } catch (error) {
      console.error('Error subscribing to push:', error)
      alert('Failed to enable notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        // Notify server
        const user = getUser()
        await fetch('/api/kasa/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(user ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
          },
          body: JSON.stringify({
            userId: user?.userId
          })
        })

        setIsSubscribed(false)
        localStorage.removeItem('push-subscribed')
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error)
    } finally {
      setLoading(false)
    }
  }

  // Convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {permission === 'default' && (
        <button
          onClick={requestPermission}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Enable notifications"
        >
          <BellSlashIcon className="h-5 w-5" />
        </button>
      )}
      {permission === 'granted' && (
        <button
          onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
          disabled={loading}
          className={`p-2 rounded-lg transition-colors ${
            isSubscribed
              ? 'text-blue-600 hover:text-red-600 hover:bg-red-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
        >
          {isSubscribed ? <BellIcon className="h-5 w-5" /> : <BellSlashIcon className="h-5 w-5" />}
        </button>
      )}
      {permission === 'denied' && (
        <span className="text-xs text-gray-500">Notifications blocked</span>
      )}
    </div>
  )
}


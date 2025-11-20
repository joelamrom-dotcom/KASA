'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CreditCardIcon, CheckIcon } from '@heroicons/react/24/outline'
import StripePaymentForm from '@/app/components/StripePaymentForm'

export default function PaymentPortalPage() {
  const params = useParams()
  const [linkData, setLinkData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [amount, setAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'ach' | 'other'>('credit_card')

  useEffect(() => {
    if (params.linkId) {
      fetchLinkData()
    }
  }, [params.linkId])

  const fetchLinkData = async () => {
    try {
      const res = await fetch(`/api/pay/${params.linkId}`)
      if (res.ok) {
        const data = await res.json()
        setLinkData(data)
        setAmount(data.amount || 0)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Payment link not found')
      }
    } catch (error) {
      console.error('Error fetching link:', error)
      setError('Failed to load payment link')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const res = await fetch(`/api/pay/${params.linkId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: 'credit_card',
          paymentData: { paymentIntentId }
        })
      })

      if (res.ok) {
        setPaymentSuccess(true)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Payment processing failed')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      setError('Failed to process payment')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment link...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-6xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Link Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-4">Thank you for your payment of ${amount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">A receipt has been sent to your email.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Portal</h1>
            <p className="text-gray-600">Family: {linkData?.familyName || 'N/A'}</p>
            {linkData?.description && (
              <p className="text-gray-500 mt-2">{linkData.description}</p>
            )}
          </div>

          <div className="mb-6 p-6 bg-blue-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Amount Due</p>
              {linkData?.amount ? (
                <p className="text-4xl font-bold text-blue-600">${linkData.amount.toLocaleString()}</p>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Enter Amount</label>
                  <input
                    type="number"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg px-4 py-2 text-2xl text-center"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          </div>

          {linkData?.paymentPlan?.enabled && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800 mb-2">Payment Plan Available</p>
              <p className="text-sm text-yellow-700">
                {linkData.paymentPlan.installments} installments of ${(amount / linkData.paymentPlan.installments).toLocaleString()} 
                {' '}({linkData.paymentPlan.frequency})
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="credit_card">Credit Card</option>
              <option value="ach">ACH/Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {paymentMethod === 'credit_card' && amount > 0 && (
            <StripePaymentForm
              amount={amount}
              familyId={linkData?.familyId}
              paymentDate={new Date().toISOString()}
              year={new Date().getFullYear()}
              type="membership"
              notes={linkData?.description || 'Payment via link'}
              onSuccess={handlePaymentSuccess}
              onError={(error) => alert(error)}
            />
          )}

          {paymentMethod === 'ach' && (
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-4">ACH payment processing coming soon. Please use credit card for now.</p>
            </div>
          )}

          {linkData?.expiresAt && (
            <p className="text-xs text-gray-500 text-center mt-6">
              This link expires on {new Date(linkData.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface StripePaymentFormProps {
  amount: number
  familyId: string
  paymentDate: string
  year: number
  type: string
  notes?: string
  saveCard?: boolean
  paymentFrequency?: 'one-time' | 'monthly'
  onSuccess: (paymentIntentId: string, paymentMethodId?: string) => void
  onError: (error: string) => void
}

function PaymentForm({
  amount,
  familyId,
  paymentDate,
  year,
  type,
  notes,
  saveCard = false,
  paymentFrequency = 'one-time',
  onSuccess,
  onError
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [paymentIntentId, setPaymentIntentId] = useState<string>('')

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const res = await fetch('/api/kasa/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            familyId,
            description: `${type} payment for family ${familyId}`
          })
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }))
          console.error('Payment intent creation failed:', errorData)
          onError(errorData.error || `Server error: ${res.status} ${res.statusText}`)
          return
        }

        const data = await res.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
          setPaymentIntentId(data.paymentIntentId)
        } else {
          console.error('No clientSecret in response:', data)
          onError(data.error || 'Failed to create payment intent - no client secret returned')
        }
      } catch (error: any) {
        console.error('Error creating payment intent:', error)
        onError(error.message || 'Failed to initialize payment')
      }
    }

    if (amount > 0) {
      createPaymentIntent()
    }
  }, [amount, familyId, type, onError])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      onError('Card element not found')
      setProcessing(false)
      return
    }

    try {
      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      )

      if (confirmError) {
        onError(confirmError.message || 'Payment failed')
        setProcessing(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        let savedPaymentMethodId = undefined

        // Save payment method if requested
        if (saveCard && paymentIntent.payment_method) {
          try {
            const saveRes = await fetch(`/api/kasa/families/${familyId}/saved-payment-methods`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentMethodId: paymentIntent.payment_method as string,
                setAsDefault: true
              })
            })
            if (saveRes.ok) {
              const saved = await saveRes.json()
              savedPaymentMethodId = saved._id
            }
          } catch (err) {
            console.error('Error saving payment method:', err)
            // Continue even if saving fails
          }
        }

        // Confirm payment in our backend
        const res = await fetch('/api/kasa/stripe/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            familyId,
            paymentDate,
            year,
            type,
            notes,
            paymentFrequency,
            savedPaymentMethodId: savedPaymentMethodId || (saveCard && paymentIntent.payment_method ? 'will_be_saved' : undefined)
          })
        })

        const data = await res.json()
        if (res.ok && data.success) {
          onSuccess(paymentIntent.id, savedPaymentMethodId)
        } else {
          onError(data.error || 'Failed to save payment')
        }
      } else {
        onError(`Payment status: ${paymentIntent?.status}`)
      }
    } catch (error: any) {
      onError(error.message || 'Payment processing failed')
    } finally {
      setProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || processing || !clientSecret}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </div>
  )
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: Math.round(props.amount * 100),
    currency: 'usd',
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.
        </p>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  )
}


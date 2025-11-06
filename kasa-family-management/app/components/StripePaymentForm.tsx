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
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

function PaymentForm({
  amount,
  familyId,
  paymentDate,
  year,
  type,
  notes,
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

        const data = await res.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
          setPaymentIntentId(data.paymentIntentId)
        } else {
          onError(data.error || 'Failed to create payment intent')
        }
      } catch (error: any) {
        onError(error.message || 'Failed to initialize payment')
      }
    }

    if (amount > 0) {
      createPaymentIntent()
    }
  }, [amount, familyId, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
            notes
          })
        })

        const data = await res.json()
        if (res.ok && data.success) {
          onSuccess(paymentIntent.id)
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
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


'use client'

import { useState, useEffect } from 'react'
import { LinkIcon, CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function PaymentMatchingPage() {
  const [unmatchedPayments, setUnmatchedPayments] = useState<any[]>([])
  const [unmatchedInvoices, setUnmatchedInvoices] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUnmatched()
    fetchMatches()
  }, [])

  const fetchUnmatched = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payments/matching/unmatched', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setUnmatchedPayments(data.payments || [])
        setUnmatchedInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error fetching unmatched:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payments/matching/matches', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setMatches(data.matches || [])
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }

  const autoMatch = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payments/matching/auto-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      if (res.ok) {
        fetchUnmatched()
        fetchMatches()
      }
    } catch (error) {
      console.error('Error auto-matching:', error)
    }
  }

  const manualMatch = async (paymentId: string, invoiceId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payments/matching/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ paymentId, invoiceId })
      })
      if (res.ok) {
        fetchUnmatched()
        fetchMatches()
      }
    } catch (error) {
      console.error('Error matching:', error)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Payment Matching
          </h1>
          <button
            onClick={autoMatch}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Auto-Match
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Unmatched Payments ({unmatchedPayments.length})</h2>
            {unmatchedPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">All payments matched</p>
            ) : (
              <div className="space-y-3">
                {unmatchedPayments.map((payment) => (
                  <div key={payment._id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">${payment.amount}</p>
                        <p className="text-sm text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Unmatched</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Unmatched Invoices ({unmatchedInvoices.length})</h2>
            {unmatchedInvoices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">All invoices matched</p>
            ) : (
              <div className="space-y-3">
                {unmatchedInvoices.map((invoice) => (
                  <div key={invoice._id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-500">${invoice.total} • {new Date(invoice.dueDate).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Unmatched</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Matched Payments & Invoices</h2>
          {matches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No matches yet</p>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div key={match._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">Payment: ${match.payment?.amount}</p>
                        <p className="text-sm text-gray-500">{new Date(match.payment?.paymentDate).toLocaleDateString()}</p>
                      </div>
                      <LinkIcon className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-medium">Invoice: {match.invoice?.invoiceNumber}</p>
                        <p className="text-sm text-gray-500">${match.invoice?.total}</p>
                      </div>
                    </div>
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


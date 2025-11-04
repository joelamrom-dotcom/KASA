'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, CalculatorIcon } from '@heroicons/react/24/outline'

interface YearlyCalculation {
  _id: string
  year: number
  ageGroup0to4: number
  ageGroup5to8: number
  ageGroup9to16: number
  ageGroup17plus: number
  incomeAgeGroup0to4: number
  incomeAgeGroup5to8: number
  incomeAgeGroup9to16: number
  incomeAgeGroup17plus: number
  totalIncome: number
  extraDonation: number
  calculatedIncome: number
  chasenaCount: number
  chasenaAmount: number
  barMitzvahCount: number
  barMitzvahAmount: number
  birthBoyCount: number
  birthBoyAmount: number
  birthGirlCount: number
  birthGirlAmount: number
  totalExpenses: number
  extraExpense: number
  calculatedExpenses: number
  balance: number
}

export default function CalculationsPage() {
  const [calculations, setCalculations] = useState<YearlyCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    extraDonation: 0,
    extraExpense: 0
  })

  useEffect(() => {
    fetchCalculations()
  }, [])

  const fetchCalculations = async () => {
    try {
      const res = await fetch('/api/kasa/calculations')
      const data = await res.json()
      setCalculations(data)
    } catch (error) {
      console.error('Error fetching calculations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/kasa/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowModal(false)
        setFormData({ year: new Date().getFullYear(), extraDonation: 0, extraExpense: 0 })
        fetchCalculations()
      }
    } catch (error) {
      console.error('Error calculating:', error)
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Yearly Calculations</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <CalculatorIcon className="h-5 w-5" />
            Calculate Year
          </button>
        </div>

        <div className="space-y-6">
          {calculations.map((calc) => (
            <div key={calc._id} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Year {calc.year}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income Section */}
                <div className="border-r pr-6">
                  <h3 className="text-lg font-semibold mb-4 text-green-600">Income</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Age 0-4 ({calc.ageGroup0to4} members):</span>
                      <span className="font-medium">${calc.incomeAgeGroup0to4.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Age 5-8 ({calc.ageGroup5to8} members):</span>
                      <span className="font-medium">${calc.incomeAgeGroup5to8.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Age 9-16 ({calc.ageGroup9to16} members):</span>
                      <span className="font-medium">${calc.incomeAgeGroup9to16.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Age 17+ ({calc.ageGroup17plus} members):</span>
                      <span className="font-medium">${calc.incomeAgeGroup17plus.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span>Total Income:</span>
                      <span className="font-bold">${calc.totalIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extra Donation:</span>
                      <span className="font-medium">${calc.extraDonation.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-bold">Calculated Income:</span>
                      <span className="font-bold text-green-600">${calc.calculatedIncome.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-red-600">Expenses</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Chasena ({calc.chasenaCount}):</span>
                      <span className="font-medium">${calc.chasenaAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bar Mitzvah ({calc.barMitzvahCount}):</span>
                      <span className="font-medium">${calc.barMitzvahAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Birth Boy ({calc.birthBoyCount}):</span>
                      <span className="font-medium">${calc.birthBoyAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Birth Girl ({calc.birthGirlCount}):</span>
                      <span className="font-medium">${calc.birthGirlAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span>Total Expenses:</span>
                      <span className="font-bold">${calc.totalExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extra Expense:</span>
                      <span className="font-medium">${calc.extraExpense.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-bold">Calculated Expenses:</span>
                      <span className="font-bold text-red-600">${calc.calculatedExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold">Balance (Income - Expenses):</span>
                  <span className={`text-2xl font-bold ${calc.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${calc.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Calculate Year</h2>
              <form onSubmit={handleCalculate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Year *</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Extra Donation</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.extraDonation}
                    onChange={(e) => setFormData({ ...formData, extraDonation: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Extra Expense</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.extraExpense}
                    onChange={(e) => setFormData({ ...formData, extraExpense: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Calculate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}


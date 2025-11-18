'use client'

import { useState, useEffect, useMemo } from 'react'
import { PlusIcon, CalculatorIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import TableImportExport from '@/app/components/TableImportExport'
import Link from 'next/link'

interface YearlyCalculation {
  _id: string
  year: number
  // Plan-based data
  plan1: number
  plan2: number
  plan3: number
  plan4: number
  plan1Name?: string
  plan2Name?: string
  plan3Name?: string
  plan4Name?: string
  incomePlan1: number
  incomePlan2: number
  incomePlan3: number
  incomePlan4: number
  totalPayments?: number
  planIncome?: number
  // Backward compatibility
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
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    extraDonation: 0,
    extraExpense: 0
  })

  const allZero = useMemo(() => {
    if (calculations.length === 0) return false
    return calculations.every((calc) => {
      const income = calc.calculatedIncome || 0
      const expenses = calc.calculatedExpenses || 0
      const balance = calc.balance || 0
      return income === 0 && expenses === 0 && balance === 0
    })
  }, [calculations])

  useEffect(() => {
    fetchCalculations()
  }, [])

  const fetchCalculations = async () => {
    try {
      const res = await fetch('/api/kasa/calculations')
      const data = await res.json()
      const sorted = data.sort((a: YearlyCalculation, b: YearlyCalculation) => b.year - a.year)
      setCalculations(sorted)
      // Auto-select the most recent year if available and none selected
      if (sorted.length > 0) {
        setSelectedYear(prev => prev || sorted[0].year)
      }
    } catch (error) {
      console.error('Error fetching calculations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async (e: any) => {
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
        await fetchCalculations()
        // Select the newly calculated year
        setSelectedYear(formData.year)
      }
    } catch (error) {
      console.error('Error calculating:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading calculations...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Yearly Calculations
            </h1>
            <p className="text-gray-600">View and manage yearly financial calculations</p>
          </div>
          <div className="flex items-center gap-3">
            <TableImportExport
              data={calculations}
              filename="calculations"
              headers={[
                { key: 'year', label: 'Year' },
                { key: 'totalIncome', label: 'Total Income' },
                { key: 'calculatedIncome', label: 'Calculated Income' },
                { key: 'totalExpenses', label: 'Total Expenses' },
                { key: 'calculatedExpenses', label: 'Calculated Expenses' },
                { key: 'balance', label: 'Balance' }
              ]}
            />
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <CalculatorIcon className="h-5 w-5" />
            Calculate Year
          </button>
        </div>

        {/* Info Banner */}
        {calculations.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">How Calculations Work</h3>
                <p className="text-blue-800 mb-3">
                  Yearly calculations are automatically generated based on:
                </p>
                <ul className="list-disc list-inside text-blue-800 space-y-1 mb-4">
                  <li>Families and their assigned payment plans</li>
                  <li>Family members and their ages (determines which plan they're on)</li>
                  <li>Lifecycle events (weddings, bar mitzvahs, births) for expense calculations</li>
                  <li>Payments received during the year</li>
                </ul>
                <div className="flex gap-3">
                  <Link
                    href="/families"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Families
                  </Link>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Calculate Year Anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - All calculations are $0 */}
        {allZero && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Data Found</h3>
                <p className="text-yellow-800 mb-3">
                  All calculations show $0 because there are no families or payments in the system yet. 
                  Calculations are based on families with payment plans assigned to them.
                </p>
                <Link
                  href="/families"
                  className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Add Your First Family
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Year Selector and Summary */}
        {calculations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium">Select Year:</label>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                className="border rounded px-4 py-2"
              >
                <option value="">View All Years Summary</option>
                {calculations.map((calc) => (
                  <option key={calc._id} value={calc.year}>
                    {calc.year}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calculations.map((calc) => (
                    <tr 
                      key={calc._id} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedYear === calc.year ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedYear(calc.year)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {calc.year}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                        ${(calc.calculatedIncome || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                        ${(calc.calculatedExpenses || 0).toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-bold ${
                        (calc.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${(calc.balance || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedYear(calc.year)
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed View - Show selected year only */}
        {selectedYear && calculations.filter(calc => calc.year === selectedYear).length > 0 && (
          <div className="space-y-6">
            {calculations.filter(calc => calc.year === selectedYear).map((calc) => (
              <div key={calc._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Year {calc.year}</h2>
                  <button
                    onClick={() => setSelectedYear(null)}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Close Details
                  </button>
                </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income Section */}
                <div className="border-r pr-6">
                  <h3 className="text-lg font-semibold mb-4 text-green-600">Income</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{calc.plan1Name || 'Plan 1'} ({calc.plan1 || calc.ageGroup0to4 || 0} members):</span>
                      <span className="font-medium">${(calc.incomePlan1 || calc.incomeAgeGroup0to4 || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{calc.plan2Name || 'Plan 2'} ({calc.plan2 || calc.ageGroup5to8 || 0} members):</span>
                      <span className="font-medium">${(calc.incomePlan2 || calc.incomeAgeGroup5to8 || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{calc.plan3Name || 'Plan 3'} ({calc.plan3 || calc.ageGroup9to16 || 0} members):</span>
                      <span className="font-medium">${(calc.incomePlan3 || calc.incomeAgeGroup9to16 || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{calc.plan4Name || 'Plan 4'} ({calc.plan4 || calc.ageGroup17plus || 0} members):</span>
                      <span className="font-medium">${(calc.incomePlan4 || calc.incomeAgeGroup17plus || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span>Plan Income:</span>
                      <span className="font-medium">${(calc.planIncome || (calc.incomePlan1 || calc.incomeAgeGroup0to4 || 0) + (calc.incomePlan2 || calc.incomeAgeGroup5to8 || 0) + (calc.incomePlan3 || calc.incomeAgeGroup9to16 || 0) + (calc.incomePlan4 || calc.incomeAgeGroup17plus || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-sm">
                      <span>Payments (from year) - informational only:</span>
                      <span className="font-medium">${(calc.totalPayments || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extra Donation:</span>
                      <span className="font-medium">${(calc.extraDonation || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-bold">Calculated Income:</span>
                      <span className="font-bold text-green-600">${(calc.calculatedIncome || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 italic">
                      Note: Payments fulfill plan commitments and are not additional income. Income = Plan Income + Extra Donation.
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-red-600">Expenses</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Chasena ({calc.chasenaCount || 0}):</span>
                      <span className="font-medium">${(calc.chasenaAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bar Mitzvah ({calc.barMitzvahCount || 0}):</span>
                      <span className="font-medium">${(calc.barMitzvahAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Birth Boy ({calc.birthBoyCount || 0}):</span>
                      <span className="font-medium">${(calc.birthBoyAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Birth Girl ({calc.birthGirlCount || 0}):</span>
                      <span className="font-medium">${(calc.birthGirlAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span>Total Expenses:</span>
                      <span className="font-bold">${(calc.totalExpenses || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extra Expense:</span>
                      <span className="font-medium">${(calc.extraExpense || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-bold">Calculated Expenses:</span>
                      <span className="font-bold text-red-600">${(calc.calculatedExpenses || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold">Balance (Income - Expenses):</span>
                  <span className={`text-2xl font-bold ${(calc.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(calc.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

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
    </div>
    </>
  )
}


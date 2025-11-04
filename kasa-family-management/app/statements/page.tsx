'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, DocumentTextIcon, PrinterIcon } from '@heroicons/react/24/outline'

interface Statement {
  _id: string
  familyId: string
  statementNumber: string
  date: string
  fromDate: string
  toDate: string
  openingBalance: number
  income: number
  withdrawals: number
  expenses: number
  closingBalance: number
}

interface Family {
  _id: string
  name: string
}

export default function StatementsPage() {
  const [statements, setStatements] = useState<Statement[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    familyId: '',
    fromDate: '',
    toDate: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statementsRes, familiesRes] = await Promise.all([
        fetch('/api/kasa/statements'),
        fetch('/api/kasa/families')
      ])
      const statementsData = await statementsRes.json()
      const familiesData = await familiesRes.json()
      setStatements(statementsData)
      setFamilies(familiesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/kasa/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowModal(false)
        setFormData({ familyId: '', fromDate: '', toDate: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Error generating statement:', error)
    }
  }

  const handlePrint = (statement: Statement) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const family = families.find(f => f._id === statement.familyId)
      printWindow.document.write(`
        <html>
          <head><title>Statement ${statement.statementNumber}</title></head>
          <body style="font-family: Arial; padding: 40px;">
            <h1>Statement</h1>
            <p><strong>Statement Number:</strong> ${statement.statementNumber}</p>
            <p><strong>Date:</strong> ${new Date(statement.date).toLocaleDateString()}</p>
            <p><strong>Family:</strong> ${family?.name || 'N/A'}</p>
            <hr>
            <p><strong>From Date:</strong> ${new Date(statement.fromDate).toLocaleDateString()}</p>
            <p><strong>To Date:</strong> ${new Date(statement.toDate).toLocaleDateString()}</p>
            <hr>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Opening Balance:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${statement.openingBalance.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Income:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${statement.income.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Withdrawals:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${statement.withdrawals.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Expenses:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${statement.expenses.toLocaleString()}</td>
              </tr>
              <tr style="background-color: #f0f0f0;">
                <td style="padding: 8px; font-weight: bold;">Closing Balance:</td>
                <td style="padding: 8px; text-align: right; font-weight: bold;">$${statement.closingBalance.toLocaleString()}</td>
              </tr>
            </table>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Statements</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" />
            Generate Statement
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statement #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Family</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opening Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closing Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statements.map((statement) => {
                const family = families.find(f => f._id === statement.familyId)
                return (
                  <tr key={statement._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{statement.statementNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{family?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(statement.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(statement.fromDate).toLocaleDateString()} - {new Date(statement.toDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">${statement.openingBalance.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600">${statement.income.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">${statement.expenses.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">
                      ${statement.closingBalance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePrint(statement)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Print"
                      >
                        <PrinterIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Generate Statement</h2>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Family *</label>
                  <select
                    required
                    value={formData.familyId}
                    onChange={(e) => setFormData({ ...formData, familyId: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select a family</option>
                    {families.map(family => (
                      <option key={family._id} value={family._id}>{family.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.fromDate}
                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.toDate}
                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
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
                    Generate
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


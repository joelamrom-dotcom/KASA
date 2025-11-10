'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, DocumentTextIcon, PrinterIcon, CalendarIcon, ChevronDownIcon, ChevronUpIcon, DocumentArrowDownIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import Pagination from '@/app/components/Pagination'
import Link from 'next/link'

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

interface Transaction {
  type: string
  date: string
  description: string
  amount: number
  notes: string
}

export default function StatementsPage() {
  const [statements, setStatements] = useState<Statement[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null)
  const [expandedStatement, setExpandedStatement] = useState<string | null>(null)
  const [statementDetails, setStatementDetails] = useState<{ [key: string]: Transaction[] }>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    familyId: '',
    fromDate: '',
    toDate: ''
  })
  const [emailFormData, setEmailFormData] = useState({
    email: '',
    password: '',
    fromName: 'Kasa Family Management',
    fromDate: '',
    toDate: ''
  })
  const [emailConfig, setEmailConfig] = useState<any>(null)
  const [saveEmailConfig, setSaveEmailConfig] = useState(false)

  useEffect(() => {
    fetchData()
    // Set default date range to last month
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    setEmailFormData(prev => ({
      ...prev,
      fromDate: lastMonth.toISOString().split('T')[0],
      toDate: lastMonthEnd.toISOString().split('T')[0]
    }))
    
    // Load saved email config
    fetch('/api/kasa/email-config')
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        return null
      })
      .then(data => {
        if (data && data.email) {
          setEmailConfig(data)
          setEmailFormData(prev => ({
            ...prev,
            email: data.email,
            fromName: data.fromName || 'Kasa Family Management'
          }))
        }
      })
      .catch(err => console.error('Error loading email config:', err))
  }, [])

  const fetchData = async () => {
    try {
      const [statementsRes, familiesRes] = await Promise.all([
        fetch('/api/kasa/statements'),
        fetch('/api/kasa/families')
      ])
      const statementsData = await statementsRes.json()
      const familiesData = await familiesRes.json()
      
      // Filter to last month's statements
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      
      const lastMonthStatements = statementsData.filter((stmt: Statement) => {
        const stmtDate = new Date(stmt.fromDate)
        return stmtDate >= lastMonth && stmtDate <= lastMonthEnd
      })
      
      // Sort by date (newest first)
      lastMonthStatements.sort((a: Statement, b: Statement) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      
      setStatements(lastMonthStatements)
      setFamilies(familiesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatementDetails = async (statementId: string) => {
    if (statementDetails[statementId]) {
      // Already loaded, just toggle
      setExpandedStatement(expandedStatement === statementId ? null : statementId)
      return
    }

    try {
      const res = await fetch(`/api/kasa/statements/${statementId}`)
      const data = await res.json()
      if (res.ok && data.transactions) {
        setStatementDetails(prev => ({
          ...prev,
          [statementId]: data.transactions
        }))
        setExpandedStatement(statementId)
      }
    } catch (error) {
      console.error('Error fetching statement details:', error)
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

  const handlePrint = async (statement: Statement) => {
    const family = families.find(f => f._id === statement.familyId)
    const transactions = statementDetails[statement._id] || []
    
    // Fetch transactions if not already loaded
    if (transactions.length === 0) {
      try {
        const res = await fetch(`/api/kasa/statements/${statement._id}`)
        const data = await res.json()
        if (res.ok && data.transactions) {
          transactions.push(...data.transactions)
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
      }
    }

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const transactionsHTML = transactions.length > 0 ? `
        <h2 style="margin-top: 30px; margin-bottom: 15px;">Transaction Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Type</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Description</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map((t: Transaction) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(t.date).toLocaleDateString()}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${t.type === 'payment' ? 'Payment' : t.type === 'withdrawal' ? 'Withdrawal' : 'Event'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${t.description}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; ${t.amount >= 0 ? 'color: green;' : 'color: red;'}">${t.amount >= 0 ? '+' : ''}$${t.amount.toLocaleString()}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${t.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''

      printWindow.document.write(`
        <html>
          <head>
            <title>Statement ${statement.statementNumber}</title>
            <style>
              @media print {
                @page { margin: 1cm; }
                body { margin: 0; }
              }
            </style>
          </head>
          <body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
              <h1 style="margin: 0; color: #333;">Kasa Family Management</h1>
              <h2 style="margin: 10px 0 0 0; color: #666; font-weight: normal;">Statement</h2>
            </div>
            
            <div style="margin-bottom: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0;"><strong>Statement Number:</strong> ${statement.statementNumber}</td>
                  <td style="padding: 5px 0; text-align: right;"><strong>Date:</strong> ${new Date(statement.date).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Family:</strong> ${family?.name || 'N/A'}</td>
                  <td style="padding: 5px 0; text-align: right;"><strong>Period:</strong> ${new Date(statement.fromDate).toLocaleDateString()} - ${new Date(statement.toDate).toLocaleDateString()}</td>
                </tr>
              </table>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Opening Balance:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${statement.openingBalance.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Income:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: green;">$${statement.income.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Withdrawals:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: orange;">$${statement.withdrawals.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Expenses:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: red;">$${statement.expenses.toLocaleString()}</td>
              </tr>
              <tr style="background-color: #f0f0f0;">
                <td style="padding: 10px; font-weight: bold; font-size: 1.1em;">Closing Balance:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 1.1em;">$${statement.closingBalance.toLocaleString()}</td>
              </tr>
            </table>
            
            ${transactionsHTML}
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 0.9em;">
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              <p>Kasa Family Management System</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleSavePDF = async (statement: Statement) => {
    await handlePrint(statement)
    // Browser's print dialog allows saving as PDF
  }

  const handleSendEmails = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendingEmails(true)
    setEmailResult(null)
    
    try {
      // Save email config if requested (one-time setup)
        if (saveEmailConfig) {
          const saveRes = await fetch('/api/kasa/email-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: emailFormData.email,
              password: emailFormData.password,
              fromName: emailFormData.fromName
            })
          })
          
          const savedConfig = await saveRes.json()
          
          if (!saveRes.ok) {
            throw new Error(savedConfig.error || 'Failed to save email configuration')
          }
          
          // Update emailConfig state after saving
          setEmailConfig(savedConfig)
        }

      // Send emails (email config is automatically retrieved from database)
      const res = await fetch('/api/kasa/statements/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromDate: emailFormData.fromDate,
          toDate: emailFormData.toDate
          // Email config is automatically retrieved from database
        })
      })
      
      const result = await res.json()
      if (res.ok) {
        setEmailResult({
          sent: result.sent || 0,
          failed: result.failed || 0,
          errors: result.errors || []
        })
        if (result.sent > 0) {
          fetchData() // Refresh statements
        }
        if (saveEmailConfig) {
          // Clear password field after saving
          setEmailFormData(prev => ({ ...prev, password: '' }))
        }
      } else {
        alert(`Error: ${result.error || 'Failed to send emails'}`)
      }
    } catch (error: any) {
      console.error('Error sending emails:', error)
      alert(`Error: ${error.message || 'Failed to send emails'}`)
    } finally {
      setSendingEmails(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Statements
            </h1>
            <p className="text-gray-600">View and generate financial statements</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <EnvelopeIcon className="h-5 w-5" />
              Send Statements via Email
            </button>
            <button
              onClick={async () => {
                if (confirm('Generate monthly statements for all families for the current month?')) {
                  try {
                    const res = await fetch('/api/kasa/statements/auto-generate', { method: 'POST' })
                    const result = await res.json()
                    if (res.ok) {
                      alert(`Successfully generated ${result.generated} statements!`)
                      fetchData()
                    } else {
                      alert(`Error: ${result.error}`)
                    }
                  } catch (error) {
                    alert('Error generating statements')
                  }
                }
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <CalendarIcon className="h-5 w-5" />
              Auto-Generate Monthly
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5" />
              Generate Statement
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Last Month's Statements</h2>
            <p className="text-sm text-gray-500">
              Showing statements from {new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString()} to {new Date(new Date().getFullYear(), new Date().getMonth(), 0).toLocaleDateString()}
            </p>
          </div>
          
          {statements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No statements found for last month.
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {statements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((statement) => {
                const family = families.find(f => f._id === statement.familyId)
                const isExpanded = expandedStatement === statement._id
                const transactions = statementDetails[statement._id] || []
                
                return (
                  <div key={statement._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-5 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Statement #</div>
                          <div className="font-medium">{statement.statementNumber}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Family</div>
                          {family ? (
                            <Link
                              href={`/families/${family._id}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                            >
                              {family.name}
                            </Link>
                          ) : (
                            <div className="font-medium">N/A</div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Period</div>
                          <div className="text-sm">
                            {new Date(statement.fromDate).toLocaleDateString()} - {new Date(statement.toDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Opening Balance</div>
                          <div className="font-medium">${statement.openingBalance.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Closing Balance</div>
                          <div className="font-bold text-lg">${statement.closingBalance.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => fetchStatementDetails(statement._id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                          {isExpanded ? 'Hide' : 'View'} Details
                        </button>
                        <button
                          onClick={() => handlePrint(statement)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Print"
                        >
                          <PrinterIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleSavePDF(statement)}
                          className="text-green-600 hover:text-green-800"
                          title="Save as PDF"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Summary Row */}
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Income: </span>
                        <span className="font-medium text-green-600">${statement.income.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Withdrawals: </span>
                        <span className="font-medium text-orange-600">${statement.withdrawals.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Expenses: </span>
                        <span className="font-medium text-red-600">${statement.expenses.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && transactions.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="font-semibold mb-4">Transaction Details (Sorted by Date)</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {transactions.map((transaction, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(transaction.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      transaction.type === 'payment' 
                                        ? 'bg-green-100 text-green-800'
                                        : transaction.type === 'withdrawal'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {transaction.type === 'payment' ? 'Payment' : transaction.type === 'withdrawal' ? 'Withdrawal' : 'Event'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {transaction.description}
                                  </td>
                                  <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                    transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    ${transaction.amount.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">
                                    {transaction.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
              {statements.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(statements.length / itemsPerPage)}
                  totalItems={statements.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
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

        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Send Statements via Email</h2>
              <p className="text-sm text-gray-600 mb-4">
                This will send PDF statements to all families with email addresses for the selected date range. Each email will include a PDF attachment with the complete statement.
              </p>
              
              {emailResult && (
                <div className={`mb-4 p-4 rounded-lg ${emailResult.failed > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`font-semibold ${emailResult.failed > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                    Sent: {emailResult.sent} | Failed: {emailResult.failed}
                  </p>
                  {emailResult.errors.length > 0 && (
                    <div className="mt-2 text-sm text-yellow-700">
                      <p className="font-semibold">Errors:</p>
                      <ul className="list-disc list-inside mt-1">
                        {emailResult.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSendEmails} className="space-y-4">
                {!emailConfig?.email ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gmail Address *</label>
                      <input
                        type="email"
                        required
                        value={emailFormData.email}
                        onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                        placeholder="your-email@gmail.com"
                        className="w-full border rounded px-3 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">Gmail account to send from</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gmail App Password *</label>
                      <input
                        type="password"
                        required
                        value={emailFormData.password}
                        onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                        placeholder="16-character app password"
                        className="w-full border rounded px-3 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Generate an app password from{' '}
                        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          Google Account Settings
                        </a>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">From Name</label>
                      <input
                        type="text"
                        value={emailFormData.fromName}
                        onChange={(e) => setEmailFormData({ ...emailFormData, fromName: e.target.value })}
                        placeholder="Kasa Family Management"
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="saveEmailConfig"
                        checked={saveEmailConfig}
                        onChange={(e) => setSaveEmailConfig(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="saveEmailConfig" className="text-sm text-gray-700">
                        Save email configuration (one-time setup - will be used for all future emails)
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>✓ Email configuration saved:</strong> {emailConfig.email}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Your email settings are stored and will be used automatically. You can send emails directly below.
                      </p>
                    </div>
                    <details className="border rounded-lg p-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                        Update Email Configuration (Optional)
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Gmail Address</label>
                          <input
                            type="email"
                            value={emailFormData.email}
                            onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                            placeholder="your-email@gmail.com"
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Gmail App Password</label>
                          <input
                            type="password"
                            value={emailFormData.password}
                            onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                            placeholder="Leave empty to keep current password"
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">From Name</label>
                          <input
                            type="text"
                            value={emailFormData.fromName}
                            onChange={(e) => setEmailFormData({ ...emailFormData, fromName: e.target.value })}
                            placeholder="Kasa Family Management"
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="updateEmailConfig"
                            checked={saveEmailConfig}
                            onChange={(e) => setSaveEmailConfig(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <label htmlFor="updateEmailConfig" className="text-sm text-gray-700">
                            Update saved configuration
                          </label>
                        </div>
                      </div>
                    </details>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Statement Period - From Date *</label>
                  <input
                    type="date"
                    required
                    value={emailFormData.fromDate}
                    onChange={(e) => setEmailFormData({ ...emailFormData, fromDate: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Statement Period - To Date *</label>
                  <input
                    type="date"
                    required
                    value={emailFormData.toDate}
                    onChange={(e) => setEmailFormData({ ...emailFormData, toDate: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false)
                      setEmailResult(null)
                    }}
                    className="px-4 py-2 border rounded"
                    disabled={sendingEmails}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
                    disabled={sendingEmails}
                  >
                    {sendingEmails ? 'Sending...' : 'Send Emails'}
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


'use client'

import { useState, useEffect } from 'react'
import { 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  CalculatorIcon, 
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface Customer {
  id: string
  customerId: string
  name: string
  familyName: string
  address?: string
  phone?: string
  email?: string
  familySize: number
  firstYear: number
  memberRate: number
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface IncomeRecord {
  id: string
  customerId: string
  date: string
  amount: number
  source: string
  description?: string
  category: string
  createdAt: string
}

interface LifeEvent {
  id: string
  customerId: string
  eventType: string
  date: string
  description?: string
  impact: number
  createdAt: string
}

interface Statement {
  id: string
  customerId: string
  statementNumber?: string
  statementDate: string
  totalIncome: number
  totalExpenses: number
  netAmount: number
  totalDue?: number
  remittanceAmount?: number
  status: string
  description: string
  content?: string
  createdAt: string
  updatedAt: string
}

export default function FamilyCasePage() {
  const [activeTab, setActiveTab] = useState('customers')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([])
  const [calculations, setCalculations] = useState<any[]>([])
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
  const [showCreateIncomeModal, setShowCreateIncomeModal] = useState(false)
  const [showCreateCalculationModal, setShowCreateCalculationModal] = useState(false)
  const [showCreateStatementModal, setShowCreateStatementModal] = useState(false)
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false)
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
  const [showEditIncomeModal, setShowEditIncomeModal] = useState(false)
  const [showEditCalculationModal, setShowEditCalculationModal] = useState(false)
  const [showEditStatementModal, setShowEditStatementModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedIncomeRecord, setSelectedIncomeRecord] = useState<IncomeRecord | null>(null)
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null)
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [createCustomerForm, setCreateCustomerForm] = useState({
    customerId: '',
    name: '',
    familyName: '',
    address: '',
    phone: '',
    email: '',
    familySize: 1,
    firstYear: new Date().getFullYear(),
    memberRate: 0,
    memberRateDisplay: '',
    notes: ''
  })
  const [createIncomeForm, setCreateIncomeForm] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    amountDisplay: '',
    source: '',
    description: '',
    category: 'general'
  })
  const [createCalculationForm, setCreateCalculationForm] = useState({
    customerId: '',
    calculationType: 'eligibility',
    baseAmount: 0,
    baseAmountDisplay: '',
    rate: 0,
    result: 0,
    notes: ''
  })
  const [createStatementForm, setCreateStatementForm] = useState({
    customerId: '',
    statementDate: new Date().toISOString().split('T')[0],
    totalIncome: 0,
    totalIncomeDisplay: '',
    totalExpenses: 0,
    totalExpensesDisplay: '',
    netAmount: 0,
    netAmountDisplay: '',
    description: '',
    status: 'draft'
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch customers
      const customersResponse = await fetch('/api/family-case/customers')
      const customersData = await customersResponse.json()
      
      if (customersResponse.ok) {
        setCustomers(customersData.customers)
      }

      // Fetch income records
      const incomeResponse = await fetch('/api/family-case/income-records')
      const incomeData = await incomeResponse.json()
      
      if (incomeResponse.ok) {
        setIncomeRecords(incomeData.incomeRecords)
      }

      // Fetch life events
      const eventsResponse = await fetch('/api/family-case/life-events')
      const eventsData = await eventsResponse.json()
      
      if (eventsResponse.ok) {
        setLifeEvents(eventsData.lifeEvents)
      }

      // Fetch calculations
      const calculationsResponse = await fetch('/api/family-case/calculations')
      const calculationsData = await calculationsResponse.json()
      
      if (calculationsResponse.ok) {
        setCalculations(calculationsData.calculations)
      }

      // Fetch statements
      const statementsResponse = await fetch('/api/family-case/statements')
      const statementsData = await statementsResponse.json()
      
      if (statementsResponse.ok) {
        setStatements(statementsData.statements || statementsData)
      }

    } catch (error) {
      setError('Failed to fetch data')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/family-case/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createCustomerForm),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateCustomerModal(false)
        setCreateCustomerForm({
          customerId: '',
          name: '',
          familyName: '',
          address: '',
          phone: '',
          email: '',
          familySize: 1,
          firstYear: new Date().getFullYear(),
          memberRate: 0,
          memberRateDisplay: '',
          notes: ''
        })
        fetchData() // Refresh the data
      } else {
        setError(data.error || 'Failed to create customer')
      }
    } catch (error) {
      setError('Failed to create customer')
      console.error('Error:', error)
    }
  }

  const handleCreateIncomeRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/family-case/income-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createIncomeForm),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateIncomeModal(false)
        setCreateIncomeForm({
          customerId: '',
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          amountDisplay: '',
          source: '',
          description: '',
          category: 'general'
        })
        fetchData() // Refresh the data
      } else {
        setError(data.error || 'Failed to create income record')
      }
    } catch (error) {
      setError('Failed to create income record')
      console.error('Error:', error)
    }
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    return customer ? `${customer.name} ${customer.familyName}` : 'Unknown Customer'
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'salary': 'bg-blue-100 text-blue-800',
      'business': 'bg-green-100 text-green-800',
      'investment': 'bg-purple-100 text-purple-800',
      'benefits': 'bg-yellow-100 text-yellow-800',
      'other': 'bg-gray-100 text-gray-800',
      'general': 'bg-indigo-100 text-indigo-800'
    }
    return colors[category] || colors['general']
  }

  const handleCreateCalculation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Calculate result based on type
    let calculatedResult = 0
    switch (createCalculationForm.calculationType) {
      case 'eligibility':
        calculatedResult = createCalculationForm.baseAmount * (createCalculationForm.rate / 100)
        break
      case 'benefit_amount':
        calculatedResult = createCalculationForm.baseAmount * createCalculationForm.rate
        break
      case 'family_support':
        calculatedResult = createCalculationForm.baseAmount + (createCalculationForm.baseAmount * createCalculationForm.rate)
        break
      case 'rate_calculation':
        calculatedResult = (createCalculationForm.baseAmount / createCalculationForm.rate) * 100
        break
      default:
        calculatedResult = createCalculationForm.result
    }
    
    try {
      const response = await fetch('/api/family-case/calculations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createCalculationForm,
          result: calculatedResult
        }),
      })

      const data = await response.json()

             if (response.ok) {
         setShowCreateCalculationModal(false)
         setCreateCalculationForm({
           customerId: '',
           calculationType: 'eligibility',
           baseAmount: 0,
           baseAmountDisplay: '',
           rate: 0,
           result: 0,
           notes: ''
         })
         fetchData() // Refresh the data
       } else {
        setError(data.error || 'Failed to create calculation')
      }
    } catch (error) {
      setError('Failed to create calculation')
      console.error('Error:', error)
    }
  }

  const getCalculationTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'eligibility': 'bg-blue-100 text-blue-800',
      'benefit_amount': 'bg-green-100 text-green-800',
      'family_support': 'bg-purple-100 text-purple-800',
      'rate_calculation': 'bg-yellow-100 text-yellow-800',
      'member_rate': 'bg-indigo-100 text-indigo-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getCalculationTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'eligibility': 'Eligibility',
      'benefit_amount': 'Benefit Amount',
      'family_support': 'Family Support',
      'rate_calculation': 'Rate Calculation',
      'member_rate': 'Member Rate'
    }
    return labels[type] || type
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const handleAmountChange = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '')
    
    // Ensure only one decimal point
    const parts = numericValue.split('.')
    const cleanValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue
    
    // Convert to number
    const amount = parseFloat(cleanValue) || 0
    
    // Format for display
    const formattedValue = formatCurrency(amount)
    
    setCreateIncomeForm({
      ...createIncomeForm,
      amount: amount,
      amountDisplay: value === '' ? '' : formattedValue
    })
  }

  const handleBaseAmountChange = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '')
    
    // Ensure only one decimal point
    const parts = numericValue.split('.')
    const cleanValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue
    
    // Convert to number
    const amount = parseFloat(cleanValue) || 0
    
    // Format for display
    const formattedValue = formatCurrency(amount)
    
    setCreateCalculationForm({
      ...createCalculationForm,
      baseAmount: amount,
      baseAmountDisplay: value === '' ? '' : formattedValue
    })
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCustomerDetailModal(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCreateCustomerForm({
      customerId: customer.customerId,
      name: customer.name,
      familyName: customer.familyName,
      address: customer.address || '',
      phone: customer.phone || '',
      email: customer.email || '',
      familySize: customer.familySize,
      firstYear: customer.firstYear,
      memberRate: customer.memberRate,
      memberRateDisplay: formatCurrency(customer.memberRate),
      notes: customer.notes || ''
    })
    setShowEditCustomerModal(true)
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCustomer) return
    
    try {
      const response = await fetch(`/api/family-case/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createCustomerForm),
      })

      const data = await response.json()

      if (response.ok) {
        setShowEditCustomerModal(false)
        setSelectedCustomer(null)
        setCreateCustomerForm({
          customerId: '',
          name: '',
          familyName: '',
          address: '',
          phone: '',
          email: '',
          familySize: 1,
          firstYear: new Date().getFullYear(),
          memberRate: 0,
          memberRateDisplay: '',
          notes: ''
        })
        fetchData() // Refresh the data
      } else {
        setError(data.error || 'Failed to update customer')
      }
    } catch (error) {
      setError('Failed to update customer')
      console.error('Error:', error)
    }
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.name} ${customer.familyName}?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/family-case/customers/${customer.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData() // Refresh the data
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete customer')
      }
    } catch (error) {
      setError('Failed to delete customer')
      console.error('Error:', error)
    }
  }

  const handleEditIncomeRecord = (record: IncomeRecord) => {
    setSelectedIncomeRecord(record)
    setCreateIncomeForm({
      customerId: record.customerId,
      date: record.date,
      amount: record.amount,
      amountDisplay: formatCurrency(record.amount),
      source: record.source,
      description: record.description || '',
      category: record.category
    })
    setShowEditIncomeModal(true)
  }

  const handleUpdateIncomeRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedIncomeRecord) return
    
    try {
      const response = await fetch(`/api/family-case/income-records/${selectedIncomeRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createIncomeForm),
      })

      const data = await response.json()

      if (response.ok) {
        setShowEditIncomeModal(false)
        setSelectedIncomeRecord(null)
        setCreateIncomeForm({
          customerId: '',
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          amountDisplay: '',
          source: '',
          description: '',
          category: 'general'
        })
        fetchData() // Refresh the data
      } else {
        setError(data.error || 'Failed to update income record')
      }
    } catch (error) {
      setError('Failed to update income record')
      console.error('Error:', error)
    }
  }

  const handleDeleteIncomeRecord = async (record: IncomeRecord) => {
    if (!confirm(`Are you sure you want to delete this income record?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/family-case/income-records/${record.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData() // Refresh the data
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete income record')
      }
    } catch (error) {
      setError('Failed to delete income record')
      console.error('Error:', error)
    }
  }

  const handleEditCalculation = (calculation: any) => {
    setSelectedCalculation(calculation)
    setCreateCalculationForm({
      customerId: calculation.customerId,
      calculationType: calculation.calculationType,
      baseAmount: calculation.baseAmount,
      baseAmountDisplay: formatCurrency(calculation.baseAmount),
      rate: calculation.rate,
      result: calculation.result,
      notes: calculation.notes || ''
    })
    setShowEditCalculationModal(true)
  }

  const handleUpdateCalculation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCalculation) return
    
    // Calculate result based on type
    let calculatedResult = 0
    switch (createCalculationForm.calculationType) {
      case 'eligibility':
        calculatedResult = createCalculationForm.baseAmount * (createCalculationForm.rate / 100)
        break
      case 'benefit_amount':
        calculatedResult = createCalculationForm.baseAmount * createCalculationForm.rate
        break
      case 'family_support':
        calculatedResult = createCalculationForm.baseAmount + (createCalculationForm.baseAmount * createCalculationForm.rate)
        break
      case 'rate_calculation':
        calculatedResult = (createCalculationForm.baseAmount / createCalculationForm.rate) * 100
        break
      default:
        calculatedResult = createCalculationForm.result
    }
    
    try {
      const response = await fetch(`/api/family-case/calculations/${selectedCalculation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createCalculationForm,
          result: calculatedResult
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowEditCalculationModal(false)
        setSelectedCalculation(null)
        setCreateCalculationForm({
          customerId: '',
          calculationType: 'eligibility',
          baseAmount: 0,
          baseAmountDisplay: '',
          rate: 0,
          result: 0,
          notes: ''
        })
        fetchData() // Refresh the data
      } else {
        setError(data.error || 'Failed to update calculation')
      }
    } catch (error) {
      setError('Failed to update calculation')
      console.error('Error:', error)
    }
  }

  const handleDeleteCalculation = async (calculation: any) => {
    if (!confirm(`Are you sure you want to delete this calculation?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/family-case/calculations/${calculation.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData() // Refresh the data
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete calculation')
      }
    } catch (error) {
      setError('Failed to delete calculation')
      console.error('Error:', error)
    }
  }

  // Statement handlers
  const handleCreateStatement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/family-case/statements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createStatementForm),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateStatementModal(false)
        setCreateStatementForm({
          customerId: '',
          statementDate: new Date().toISOString().split('T')[0],
          totalIncome: 0,
          totalIncomeDisplay: '',
          totalExpenses: 0,
          totalExpensesDisplay: '',
          netAmount: 0,
          netAmountDisplay: '',
          description: '',
          status: 'draft'
        })
        fetchData() // Refresh the data
      } else {
        setError(data.error || 'Failed to create statement')
      }
    } catch (error) {
      setError('Failed to create statement')
      console.error('Error:', error)
    }
  }

  const handleViewStatement = (statement: Statement) => {
    setSelectedStatement(statement)
    // You can add a view modal here if needed
  }

  const handleEditStatement = (statement: Statement) => {
    setSelectedStatement(statement)
    setCreateStatementForm({
      customerId: statement.customerId,
      statementDate: statement.statementDate.split('T')[0],
      totalIncome: statement.totalIncome,
      totalIncomeDisplay: formatCurrency(statement.totalIncome),
      totalExpenses: statement.totalExpenses,
      totalExpensesDisplay: formatCurrency(statement.totalExpenses),
      netAmount: statement.netAmount,
      netAmountDisplay: formatCurrency(statement.netAmount),
      description: statement.description,
      status: statement.status
    })
    setShowEditStatementModal(true)
  }

  const handleUpdateStatement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStatement) return
    
    try {
      const response = await fetch(`/api/family-case/statements/${selectedStatement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createStatementForm),
      })

      const data = await response.json()

      if (response.ok) {
        setShowEditStatementModal(false)
        setSelectedStatement(null)
        setCreateStatementForm({
          customerId: '',
          statementDate: new Date().toISOString().split('T')[0],
          totalIncome: 0,
          totalIncomeDisplay: '',
          totalExpenses: 0,
          totalExpensesDisplay: '',
          netAmount: 0,
          netAmountDisplay: '',
          description: '',
          status: 'draft'
        })
        fetchData() // Refresh the data
      } else {
        setError(data.error || 'Failed to update statement')
      }
    } catch (error) {
      setError('Failed to update statement')
      console.error('Error:', error)
    }
  }

  const handleDeleteStatement = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this statement?')) {
      try {
        const response = await fetch(`/api/family-case/statements/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchData() // Refresh the data
        } else {
          const data = await response.json()
          setError(data.error || 'Failed to delete statement')
        }
      } catch (error) {
        setError('Failed to delete statement')
        console.error('Error:', error)
      }
    }
  }

  const handleTotalIncomeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '')
    const parts = numericValue.split('.')
    const cleanValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue
    const amount = parseFloat(cleanValue) || 0
    const formattedValue = formatCurrency(amount)
    
    const netAmount = amount - createStatementForm.totalExpenses
    
    setCreateStatementForm({
      ...createStatementForm,
      totalIncome: amount,
      totalIncomeDisplay: value === '' ? '' : formattedValue,
      netAmount: netAmount,
      netAmountDisplay: formatCurrency(netAmount)
    })
  }

  const handleTotalExpensesChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '')
    const parts = numericValue.split('.')
    const cleanValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue
    const amount = parseFloat(cleanValue) || 0
    const formattedValue = formatCurrency(amount)
    
    const netAmount = createStatementForm.totalIncome - amount
    
    setCreateStatementForm({
      ...createStatementForm,
      totalExpenses: amount,
      totalExpensesDisplay: value === '' ? '' : formattedValue,
      netAmount: netAmount,
      netAmountDisplay: formatCurrency(netAmount)
    })
  }

  const handleMemberRateChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '')
    const parts = numericValue.split('.')
    const cleanValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue
    const amount = parseFloat(cleanValue) || 0
    const formattedValue = formatCurrency(amount)
    
    setCreateCustomerForm({
      ...createCustomerForm,
      memberRate: amount,
      memberRateDisplay: value === '' ? '' : formattedValue
    })
  }

  const getCustomerIncomeRecords = (customerId: string) => {
    return incomeRecords.filter(record => record.customerId === customerId)
  }

  const getCustomerCalculations = (customerId: string) => {
    return calculations.filter(calc => calc.customerId === customerId)
  }

  const getCustomerLifeEvents = (customerId: string) => {
    return lifeEvents.filter(event => event.customerId === customerId)
  }

  const getCustomerStatements = (customerId: string) => {
    return statements.filter(statement => statement.customerId === customerId)
  }

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setUser(user)
        setIsAuthenticated(true)
        fetchData()
      } else {
        setIsAuthenticated(false)
        setLoading(false)
        // Redirect to login
        window.location.href = '/login'
      }
    }

    checkAuth()
  }, [])

  // Calculate dashboard stats
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const totalIncome = incomeRecords.reduce((sum, record) => sum + record.amount, 0)
  const totalLifeEvents = lifeEvents.length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading family case management system...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Family Case Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={fetchData}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="Refresh data"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'customers', name: 'Customers', icon: UserGroupIcon },
              { id: 'income', name: 'Income Records', icon: CurrencyDollarIcon },
              { id: 'calculations', name: 'Calculations', icon: CalculatorIcon },
              { id: 'statements', name: 'Statements', icon: DocumentTextIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 inline mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'customers' && (
          <div className="px-4 sm:px-0">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-md bg-primary-500 flex items-center justify-center">
                      <UserGroupIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Customers</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalCustomers}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">{activeCustomers} active customers</span>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-md bg-green-500 flex items-center justify-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Income</p>
                                         <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalIncome)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">Across all customers</span>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-md bg-yellow-500 flex items-center justify-center">
                      <CalculatorIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Life Events</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalLifeEvents}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-blue-600">Tracked events</span>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-md bg-purple-500 flex items-center justify-center">
                      <DocumentTextIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Family Size</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {customers.length > 0 
                        ? Math.round(customers.reduce((sum, c) => sum + c.familySize, 0) / customers.length)
                        : 0
                      }
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-purple-600">Per customer</span>
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Customers</h3>
                  <button
                    onClick={() => setShowCreateCustomerModal(true)}
                    className="btn-primary flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Customer
                  </button>
                </div>
              </div>
              
              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <UserGroupIcon className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first customer</p>
                  <button
                    onClick={() => setShowCreateCustomerModal(true)}
                    className="btn-primary"
                  >
                    Add Customer
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Family Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name} {customer.familyName}
                              </div>
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.customerId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.familySize}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              customer.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {customer.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </td>
                                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                             <div className="flex space-x-2">
                               <button 
                                 onClick={() => handleViewCustomer(customer)}
                                 className="text-blue-600 hover:text-blue-900" 
                                 title="View Customer"
                               >
                                 <EyeIcon className="h-4 w-4" />
                               </button>
                                                               <button 
                                  onClick={() => handleEditCustomer(customer)}
                                  className="text-green-600 hover:text-green-900" 
                                  title="Edit Customer"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCustomer(customer)}
                                  className="text-red-600 hover:text-red-900" 
                                  title="Delete Customer"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                             </div>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="px-4 sm:px-0">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Income Records Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Income Records</h3>
                  <button
                    onClick={() => setShowCreateIncomeModal(true)}
                    className="btn-primary flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Income Record
                  </button>
                </div>
              </div>
              
              {incomeRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <CurrencyDollarIcon className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No income records yet</h3>
                  <p className="text-gray-500 mb-4">Start tracking income by adding your first record</p>
                  <button
                    onClick={() => setShowCreateIncomeModal(true)}
                    className="btn-primary"
                  >
                    Add Income Record
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {incomeRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getCustomerName(record.customerId)}
                            </div>
                          </td>
                                                     <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm font-semibold text-green-600">
                               {formatCurrency(record.amount)}
                             </div>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{record.source}</div>
                            {record.description && (
                              <div className="text-sm text-gray-500">{record.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(record.category)}`}>
                              {record.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                         <div className="flex space-x-2">
                               <button className="text-blue-600 hover:text-blue-900" title="View Record">
                                 <EyeIcon className="h-4 w-4" />
                               </button>
                               <button 
                                 onClick={() => handleEditIncomeRecord(record)}
                                 className="text-green-600 hover:text-green-900" 
                                 title="Edit Record"
                               >
                                 <PencilIcon className="h-4 w-4" />
                               </button>
                               <button 
                                 onClick={() => handleDeleteIncomeRecord(record)}
                                 className="text-red-600 hover:text-red-900" 
                                 title="Delete Record"
                               >
                                 <TrashIcon className="h-4 w-4" />
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calculations' && (
          <div className="px-4 sm:px-0">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Calculations Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Calculations</h3>
                  <button
                    onClick={() => setShowCreateCalculationModal(true)}
                    className="btn-primary flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Calculation
                  </button>
                </div>
              </div>
              
              {calculations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <CalculatorIcon className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No calculations yet</h3>
                  <p className="text-gray-500 mb-4">Start performing calculations by adding your first calculation</p>
                  <button
                    onClick={() => setShowCreateCalculationModal(true)}
                    className="btn-primary"
                  >
                    Add Calculation
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Base Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Result
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {calculations.map((calculation) => (
                        <tr key={calculation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getCustomerName(calculation.customerId)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCalculationTypeColor(calculation.calculationType)}`}>
                              {getCalculationTypeLabel(calculation.calculationType)}
                            </span>
                          </td>
                                                     <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm text-gray-900">
                               {formatCurrency(calculation.baseAmount)}
                             </div>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {calculation.rate}%
                            </div>
                          </td>
                                                     <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm font-semibold text-green-600">
                               {formatCurrency(calculation.result)}
                             </div>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(calculation.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                         <div className="flex space-x-2">
                               <button className="text-blue-600 hover:text-blue-900" title="View Calculation">
                                 <EyeIcon className="h-4 w-4" />
                               </button>
                               <button 
                                 onClick={() => handleEditCalculation(calculation)}
                                 className="text-green-600 hover:text-green-900" 
                                 title="Edit Calculation"
                               >
                                 <PencilIcon className="h-4 w-4" />
                               </button>
                               <button 
                                 onClick={() => handleDeleteCalculation(calculation)}
                                 className="text-red-600 hover:text-red-900" 
                                 title="Delete Calculation"
                               >
                                 <TrashIcon className="h-4 w-4" />
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'statements' && (
          <div className="px-4 sm:px-0">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Statements</h2>
                <p className="text-gray-600">Manage financial statements for families</p>
              </div>
              <button
                onClick={() => setShowCreateStatementModal(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Statement
              </button>
            </div>

            {/* Statements Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {statements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Income
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Expenses
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Net Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {statements.map((statement) => {
                        const customer = customers.find(c => c.id === statement.customerId)
                        return (
                          <tr key={statement.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {customer ? `${customer.name} ${customer.familyName}` : 'Unknown Customer'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer?.customerId || statement.customerId}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(statement.statementDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="max-w-xs truncate" title={statement.description}>
                                {statement.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(statement.totalIncome)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(statement.totalExpenses)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`font-medium ${statement.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(statement.netAmount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statement.status === 'final' ? 'bg-green-100 text-green-800' :
                                statement.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {statement.status.charAt(0).toUpperCase() + statement.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewStatement(statement)}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditStatement(statement)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStatement(statement.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No statements found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new statement.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateStatementModal(true)}
                      className="btn-primary"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Statement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Customer Modal */}
      {showCreateCustomerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Customer</h3>
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer ID</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={createCustomerForm.customerId}
                    onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, customerId: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field mt-1"
                    value={createCustomerForm.name}
                    onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Family Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field mt-1"
                    value={createCustomerForm.familyName}
                    onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, familyName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="input-field mt-1"
                    value={createCustomerForm.email}
                    onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="input-field mt-1"
                    value={createCustomerForm.phone}
                    onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    className="input-field mt-1"
                    rows={2}
                    value={createCustomerForm.address}
                    onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Family Size</label>
                    <input
                      type="number"
                      min="1"
                      className="input-field mt-1"
                      value={createCustomerForm.familySize}
                      onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, familySize: Number(e.target.value) })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Year</label>
                    <input
                      type="number"
                      className="input-field mt-1"
                      value={createCustomerForm.firstYear}
                      onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, firstYear: Number(e.target.value) })}
                    />
                  </div>
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700">Member Rate</label>
                   <input
                     type="text"
                     className="input-field mt-1"
                     value={createCustomerForm.memberRateDisplay}
                     onChange={(e) => handleMemberRateChange(e.target.value)}
                     placeholder="$0.00"
                   />
                 </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    className="input-field mt-1"
                    rows={3}
                    value={createCustomerForm.notes}
                    onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, notes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateCustomerModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Create Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Income Record Modal */}
      {showCreateIncomeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Income Record</h3>
              <form onSubmit={handleCreateIncomeRecord} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer *</label>
                  <select
                    required
                    className="input-field mt-1"
                    value={createIncomeForm.customerId}
                    onChange={(e) => setCreateIncomeForm({ ...createIncomeForm, customerId: e.target.value })}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.familyName} ({customer.customerId})
                      </option>
                    ))}
                  </select>
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700">Amount *</label>
                   <input
                     type="text"
                     required
                     className="input-field mt-1"
                     value={createIncomeForm.amountDisplay}
                     onChange={(e) => handleAmountChange(e.target.value)}
                     placeholder="$0.00"
                   />
                 </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Source *</label>
                  <input
                    type="text"
                    required
                    className="input-field mt-1"
                    value={createIncomeForm.source}
                    onChange={(e) => setCreateIncomeForm({ ...createIncomeForm, source: e.target.value })}
                    placeholder="e.g., Salary, Business, Investment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    className="input-field mt-1"
                    value={createIncomeForm.category}
                    onChange={(e) => setCreateIncomeForm({ ...createIncomeForm, category: e.target.value })}
                  >
                    <option value="salary">Salary</option>
                    <option value="business">Business</option>
                    <option value="investment">Investment</option>
                    <option value="benefits">Benefits</option>
                    <option value="other">Other</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    className="input-field mt-1"
                    value={createIncomeForm.date}
                    onChange={(e) => setCreateIncomeForm({ ...createIncomeForm, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="input-field mt-1"
                    rows={3}
                    value={createIncomeForm.description}
                    onChange={(e) => setCreateIncomeForm({ ...createIncomeForm, description: e.target.value })}
                    placeholder="Additional details about this income"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateIncomeModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Create Income Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Calculation Modal */}
      {showCreateCalculationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Calculation</h3>
              <form onSubmit={handleCreateCalculation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer *</label>
                  <select
                    required
                    className="input-field mt-1"
                    value={createCalculationForm.customerId}
                    onChange={(e) => setCreateCalculationForm({ ...createCalculationForm, customerId: e.target.value })}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.familyName} ({customer.customerId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Calculation Type *</label>
                  <select
                    required
                    className="input-field mt-1"
                    value={createCalculationForm.calculationType}
                    onChange={(e) => setCreateCalculationForm({ ...createCalculationForm, calculationType: e.target.value })}
                  >
                    <option value="eligibility">Eligibility Calculation</option>
                    <option value="benefit_amount">Benefit Amount</option>
                    <option value="family_support">Family Support</option>
                    <option value="rate_calculation">Rate Calculation</option>
                    <option value="member_rate">Member Rate</option>
                  </select>
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700">Base Amount *</label>
                   <input
                     type="text"
                     required
                     className="input-field mt-1"
                     value={createCalculationForm.baseAmountDisplay}
                     onChange={(e) => handleBaseAmountChange(e.target.value)}
                     placeholder="$0.00"
                   />
                 </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rate (%) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    className="input-field mt-1"
                    value={createCalculationForm.rate}
                    onChange={(e) => setCreateCalculationForm({ ...createCalculationForm, rate: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    className="input-field mt-1"
                    rows={3}
                    value={createCalculationForm.notes}
                    onChange={(e) => setCreateCalculationForm({ ...createCalculationForm, notes: e.target.value })}
                    placeholder="Additional details about this calculation"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateCalculationModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Create Calculation
                  </button>
                </div>
              </form>
            </div>
          </div>
                          </div>
        )}

        {/* Create Statement Modal */}
        {showCreateStatementModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Statement</h3>
                <form onSubmit={handleCreateStatement} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer *</label>
                    <select
                      required
                      className="input-field mt-1"
                      value={createStatementForm.customerId}
                      onChange={(e) => setCreateStatementForm({ ...createStatementForm, customerId: e.target.value })}
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.familyName} ({customer.customerId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statement Date *</label>
                    <input
                      type="date"
                      required
                      className="input-field mt-1"
                      value={createStatementForm.statementDate}
                      onChange={(e) => setCreateStatementForm({ ...createStatementForm, statementDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      required
                      className="input-field mt-1"
                      rows={3}
                      value={createStatementForm.description}
                      onChange={(e) => setCreateStatementForm({ ...createStatementForm, description: e.target.value })}
                      placeholder="Statement description or notes"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Income</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={createStatementForm.totalIncomeDisplay}
                      onChange={(e) => handleTotalIncomeChange(e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Expenses</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={createStatementForm.totalExpensesDisplay}
                      onChange={(e) => handleTotalExpensesChange(e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Net Amount</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={createStatementForm.netAmountDisplay}
                      readOnly
                      placeholder="$0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      className="input-field mt-1"
                      value={createStatementForm.status}
                      onChange={(e) => setCreateStatementForm({ ...createStatementForm, status: e.target.value })}
                    >
                      <option value="draft">Draft</option>
                      <option value="final">Final</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateStatementModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Create Statement
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Statement Modal */}
        {showEditStatementModal && selectedStatement && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Statement</h3>
                <form onSubmit={handleUpdateStatement} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer *</label>
                    <select
                      required
                      className="input-field mt-1"
                      value={createStatementForm.customerId}
                      onChange={(e) => setCreateStatementForm({ ...createStatementForm, customerId: e.target.value })}
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.familyName} ({customer.customerId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statement Date *</label>
                    <input
                      type="date"
                      required
                      className="input-field mt-1"
                      value={createStatementForm.statementDate}
                      onChange={(e) => setCreateStatementForm({ ...createStatementForm, statementDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      required
                      className="input-field mt-1"
                      rows={3}
                      value={createStatementForm.description}
                      onChange={(e) => setCreateStatementForm({ ...createStatementForm, description: e.target.value })}
                      placeholder="Statement description or notes"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Income</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={createStatementForm.totalIncomeDisplay}
                      onChange={(e) => handleTotalIncomeChange(e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Expenses</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={createStatementForm.totalExpensesDisplay}
                      onChange={(e) => handleTotalExpensesChange(e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Net Amount</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={createStatementForm.netAmountDisplay}
                      readOnly
                      placeholder="$0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      className="input-field mt-1"
                      value={createStatementForm.status}
                      onChange={(e) => setCreateStatementForm({ ...createStatementForm, status: e.target.value })}
                    >
                      <option value="draft">Draft</option>
                      <option value="final">Final</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditStatementModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Update Statement
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditCustomerModal && selectedCustomer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Customer</h3>
                <form onSubmit={handleUpdateCustomer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer ID</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={createCustomerForm.customerId}
                      onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, customerId: e.target.value })}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name *</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={createCustomerForm.name}
                      onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Family Name *</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={createCustomerForm.familyName}
                      onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, familyName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      className="input-field mt-1"
                      value={createCustomerForm.email}
                      onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      className="input-field mt-1"
                      value={createCustomerForm.phone}
                      onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      className="input-field mt-1"
                      rows={2}
                      value={createCustomerForm.address}
                      onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Family Size</label>
                      <input
                        type="number"
                        min="1"
                        className="input-field mt-1"
                        value={createCustomerForm.familySize}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, familySize: Number(e.target.value) })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Year</label>
                      <input
                        type="number"
                        className="input-field mt-1"
                        value={createCustomerForm.firstYear}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, firstYear: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Rate</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={createCustomerForm.memberRateDisplay}
                      onChange={(e) => handleMemberRateChange(e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      className="input-field mt-1"
                      rows={3}
                      value={createCustomerForm.notes}
                      onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditCustomerModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Update Customer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Income Record Modal */}
        {showEditIncomeModal && selectedIncomeRecord && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Income Record</h3>
                <form onSubmit={handleUpdateIncomeRecord} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer *</label>
                    <select
                      required
                      className="input-field mt-1"
                      value={createIncomeForm.customerId}
                      onChange={(e) => setCreateIncomeForm({ ...createIncomeForm, customerId: e.target.value })}
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.familyName} ({customer.customerId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount *</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={createIncomeForm.amountDisplay}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source *</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={createIncomeForm.source}
                      onChange={(e) => setCreateIncomeForm({ ...createIncomeForm, source: e.target.value })}
                      placeholder="e.g., Salary, Business, Investment"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      className="input-field mt-1"
                      value={createIncomeForm.category}
                      onChange={(e) => setCreateIncomeForm({ ...createIncomeForm, category: e.target.value })}
                    >
                      <option value="salary">Salary</option>
                      <option value="business">Business</option>
                      <option value="investment">Investment</option>
                      <option value="benefits">Benefits</option>
                      <option value="other">Other</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      className="input-field mt-1"
                      value={createIncomeForm.date}
                      onChange={(e) => setCreateIncomeForm({ ...createIncomeForm, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      className="input-field mt-1"
                      rows={3}
                      value={createIncomeForm.description}
                      onChange={(e) => setCreateIncomeForm({ ...createIncomeForm, description: e.target.value })}
                      placeholder="Additional details about this income"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditIncomeModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Update Income Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Calculation Modal */}
        {showEditCalculationModal && selectedCalculation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Calculation</h3>
                <form onSubmit={handleUpdateCalculation} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer *</label>
                    <select
                      required
                      className="input-field mt-1"
                      value={createCalculationForm.customerId}
                      onChange={(e) => setCreateCalculationForm({ ...createCalculationForm, customerId: e.target.value })}
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.familyName} ({customer.customerId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Calculation Type *</label>
                    <select
                      required
                      className="input-field mt-1"
                      value={createCalculationForm.calculationType}
                      onChange={(e) => setCreateCalculationForm({ ...createCalculationForm, calculationType: e.target.value })}
                    >
                      <option value="eligibility">Eligibility Calculation</option>
                      <option value="benefit_amount">Benefit Amount</option>
                      <option value="family_support">Family Support</option>
                      <option value="rate_calculation">Rate Calculation</option>
                      <option value="member_rate">Member Rate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base Amount *</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={createCalculationForm.baseAmountDisplay}
                      onChange={(e) => handleBaseAmountChange(e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rate (%) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      className="input-field mt-1"
                      value={createCalculationForm.rate}
                      onChange={(e) => setCreateCalculationForm({ ...createCalculationForm, rate: Number(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      className="input-field mt-1"
                      rows={3}
                      value={createCalculationForm.notes}
                      onChange={(e) => setCreateCalculationForm({ ...createCalculationForm, notes: e.target.value })}
                      placeholder="Additional details about this calculation"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditCalculationModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Update Calculation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Customer Detail Modal */}
       {showCustomerDetailModal && selectedCustomer && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
             <div className="mt-3">
               {/* Header */}
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-bold text-gray-900">
                   Customer Details: {selectedCustomer.name} {selectedCustomer.familyName}
                 </h3>
                 <button
                   onClick={() => setShowCustomerDetailModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               {/* Customer Information */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                 <div className="bg-gray-50 p-6 rounded-lg">
                   <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h4>
                   <div className="space-y-3">
                     <div>
                       <span className="text-sm font-medium text-gray-500">Customer ID:</span>
                       <p className="text-sm text-gray-900">{selectedCustomer.customerId}</p>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-500">Full Name:</span>
                       <p className="text-sm text-gray-900">{selectedCustomer.name} {selectedCustomer.familyName}</p>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-500">Email:</span>
                       <p className="text-sm text-gray-900">{selectedCustomer.email || 'Not provided'}</p>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-500">Phone:</span>
                       <p className="text-sm text-gray-900">{selectedCustomer.phone || 'Not provided'}</p>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-500">Address:</span>
                       <p className="text-sm text-gray-900">{selectedCustomer.address || 'Not provided'}</p>
                     </div>
                   </div>
                 </div>

                 <div className="bg-gray-50 p-6 rounded-lg">
                   <h4 className="text-lg font-semibold text-gray-900 mb-4">Family Details</h4>
                   <div className="space-y-3">
                     <div>
                       <span className="text-sm font-medium text-gray-500">Family Size:</span>
                       <p className="text-sm text-gray-900">{selectedCustomer.familySize} members</p>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-500">First Year:</span>
                       <p className="text-sm text-gray-900">{selectedCustomer.firstYear}</p>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-500">Member Rate:</span>
                       <p className="text-sm text-gray-900">{formatCurrency(selectedCustomer.memberRate)}</p>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-500">Status:</span>
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                         selectedCustomer.status === 'active' 
                           ? 'bg-green-100 text-green-800' 
                           : 'bg-red-100 text-red-800'
                       }`}>
                         {selectedCustomer.status}
                       </span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-500">Created:</span>
                       <p className="text-sm text-gray-900">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Notes */}
               {selectedCustomer.notes && (
                 <div className="bg-blue-50 p-4 rounded-lg mb-6">
                   <h4 className="text-lg font-semibold text-gray-900 mb-2">Notes</h4>
                   <p className="text-sm text-gray-700">{selectedCustomer.notes}</p>
                 </div>
               )}

               {/* Income Records */}
               <div className="mb-6">
                 <h4 className="text-lg font-semibold text-gray-900 mb-4">Income Records</h4>
                 {(() => {
                   const customerIncomeRecords = getCustomerIncomeRecords(selectedCustomer.id)
                   const totalIncome = customerIncomeRecords.reduce((sum, record) => sum + record.amount, 0)
                   
                   return (
                     <div>
                       <div className="bg-green-50 p-4 rounded-lg mb-4">
                         <p className="text-sm font-medium text-gray-500">Total Income:</p>
                         <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                       </div>
                       
                       {customerIncomeRecords.length === 0 ? (
                         <div className="text-center py-8 bg-gray-50 rounded-lg">
                           <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                           <p className="text-gray-500">No income records found for this customer</p>
                         </div>
                       ) : (
                         <div className="overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                               <tr>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                               </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                               {customerIncomeRecords.map((record) => (
                                 <tr key={record.id} className="hover:bg-gray-50">
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                     {new Date(record.date).toLocaleDateString()}
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap">
                                     <div className="text-sm font-semibold text-green-600">
                                       {formatCurrency(record.amount)}
                                     </div>
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                     {record.source}
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap">
                                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(record.category)}`}>
                                       {record.category}
                                     </span>
                                   </td>
                                   <td className="px-4 py-3 text-sm text-gray-500">
                                     {record.description || '-'}
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       )}
                     </div>
                   )
                 })()}
               </div>

               {/* Calculations */}
               <div className="mb-6">
                 <h4 className="text-lg font-semibold text-gray-900 mb-4">Calculations</h4>
                 {(() => {
                   const customerCalculations = getCustomerCalculations(selectedCustomer.id)
                   
                   return (
                     <div>
                       {customerCalculations.length === 0 ? (
                         <div className="text-center py-8 bg-gray-50 rounded-lg">
                           <CalculatorIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                           <p className="text-gray-500">No calculations found for this customer</p>
                         </div>
                       ) : (
                         <div className="overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                               <tr>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Amount</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                               </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                               {customerCalculations.map((calculation) => (
                                 <tr key={calculation.id} className="hover:bg-gray-50">
                                   <td className="px-4 py-3 whitespace-nowrap">
                                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCalculationTypeColor(calculation.calculationType)}`}>
                                       {getCalculationTypeLabel(calculation.calculationType)}
                                     </span>
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                     {formatCurrency(calculation.baseAmount)}
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                     {calculation.rate}%
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap">
                                     <div className="text-sm font-semibold text-green-600">
                                       {formatCurrency(calculation.result)}
                                     </div>
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                     {new Date(calculation.date).toLocaleDateString()}
                                   </td>
                                   <td className="px-4 py-3 text-sm text-gray-500">
                                     {calculation.notes || '-'}
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       )}
                     </div>
                   )
                 })()}
               </div>

               {/* Life Events */}
               <div className="mb-6">
                 <h4 className="text-lg font-semibold text-gray-900 mb-4">Life Events</h4>
                 {(() => {
                   const customerLifeEvents = getCustomerLifeEvents(selectedCustomer.id)
                   
                   return (
                     <div>
                       {customerLifeEvents.length === 0 ? (
                         <div className="text-center py-8 bg-gray-50 rounded-lg">
                           <CalculatorIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                           <p className="text-gray-500">No life events found for this customer</p>
                         </div>
                       ) : (
                         <div className="overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                               <tr>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                               </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                               {customerLifeEvents.map((event) => (
                                 <tr key={event.id} className="hover:bg-gray-50">
                                   <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                     {event.eventType}
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                     {new Date(event.date).toLocaleDateString()}
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                     {formatCurrency(event.impact)}
                                   </td>
                                   <td className="px-4 py-3 text-sm text-gray-500">
                                     {event.description || '-'}
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       )}
                     </div>
                   )
                 })()}
               </div>

               {/* Statements */}
               <div className="mb-6">
                 <h4 className="text-lg font-semibold text-gray-900 mb-4">Financial Statements</h4>
                 {(() => {
                   const customerStatements = getCustomerStatements(selectedCustomer.id)
                   const totalStatementsIncome = customerStatements.reduce((sum, statement) => sum + statement.totalIncome, 0)
                   const totalStatementsExpenses = customerStatements.reduce((sum, statement) => sum + statement.totalExpenses, 0)
                   const totalStatementsNet = customerStatements.reduce((sum, statement) => sum + statement.netAmount, 0)
                   
                   return (
                     <div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                         <div className="bg-green-50 p-4 rounded-lg">
                           <p className="text-sm font-medium text-gray-500">Total Income:</p>
                           <p className="text-xl font-bold text-green-600">{formatCurrency(totalStatementsIncome)}</p>
                         </div>
                         <div className="bg-red-50 p-4 rounded-lg">
                           <p className="text-sm font-medium text-gray-500">Total Expenses:</p>
                           <p className="text-xl font-bold text-red-600">{formatCurrency(totalStatementsExpenses)}</p>
                         </div>
                         <div className={`p-4 rounded-lg ${totalStatementsNet >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                           <p className="text-sm font-medium text-gray-500">Net Amount:</p>
                           <p className={`text-xl font-bold ${totalStatementsNet >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                             {formatCurrency(totalStatementsNet)}
                           </p>
                         </div>
                       </div>
                       
                       {customerStatements.length === 0 ? (
                         <div className="text-center py-8 bg-gray-50 rounded-lg">
                           <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                           <p className="text-gray-500">No statements found for this customer</p>
                         </div>
                       ) : (
                         <div className="overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                               <tr>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                               </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                               {customerStatements.map((statement) => (
                                 <tr key={statement.id} className="hover:bg-gray-50">
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                     {new Date(statement.statementDate).toLocaleDateString()}
                                   </td>
                                   <td className="px-4 py-3 text-sm text-gray-900">
                                     <div className="max-w-xs truncate" title={statement.description}>
                                       {statement.description}
                                     </div>
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap">
                                     <div className="text-sm font-semibold text-green-600">
                                       {formatCurrency(statement.totalIncome)}
                                     </div>
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap">
                                     <div className="text-sm font-semibold text-red-600">
                                       {formatCurrency(statement.totalExpenses)}
                                     </div>
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap">
                                     <div className={`text-sm font-semibold ${statement.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                       {formatCurrency(statement.netAmount)}
                                     </div>
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap">
                                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                       statement.status === 'final' ? 'bg-green-100 text-green-800' :
                                       statement.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                       'bg-gray-100 text-gray-800'
                                     }`}>
                                       {statement.status.charAt(0).toUpperCase() + statement.status.slice(1)}
                                     </span>
                                   </td>
                                   <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                     <div className="flex space-x-2">
                                       <button
                                         onClick={() => handleEditStatement(statement)}
                                         className="text-gray-600 hover:text-gray-900"
                                         title="Edit Statement"
                                       >
                                         <PencilIcon className="h-4 w-4" />
                                       </button>
                                       <button
                                         onClick={() => handleDeleteStatement(statement.id)}
                                         className="text-red-600 hover:text-red-900"
                                         title="Delete Statement"
                                       >
                                         <TrashIcon className="h-4 w-4" />
                                       </button>
                                     </div>
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       )}
                     </div>
                   )
                 })()}
               </div>

               {/* Close Button */}
               <div className="flex justify-end pt-4">
                 <button
                   onClick={() => setShowCustomerDetailModal(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                 >
                   Close
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }

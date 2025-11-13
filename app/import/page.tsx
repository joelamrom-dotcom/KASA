'use client'

import { useState, useRef } from 'react'
import { ArrowUpTrayIcon, DocumentArrowDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

type ImportType = 'families' | 'members' | 'payments' | 'lifecycle-events'

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: string[]
  warnings: string[]
}

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>('families')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setResult(null)

    // Preview CSV data
    try {
      const text = await selectedFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const previewData = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })
      setPreview(previewData)
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading file. Please try again.')
    }
  }

  const handleImport = async () => {
    if (!file) {
      alert('Please select a CSV file first')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', importType)

      const res = await fetch('/api/kasa/import', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          imported: data.imported || 0,
          failed: data.failed || 0,
          errors: data.errors || [],
          warnings: data.warnings || []
        })
        setFile(null)
        setPreview([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setResult({
          success: false,
          imported: 0,
          failed: 0,
          errors: [data.error || 'Import failed'],
          warnings: []
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [error.message || 'Failed to import file'],
        warnings: []
      })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const templates: { [key in ImportType]: string } = {
      'families': `name,hebrewName,weddingDate,husbandFirstName,husbandHebrewName,husbandFatherHebrewName,wifeFirstName,wifeHebrewName,wifeFatherHebrewName,email,phone,address,city,state,zip,husbandCellPhone,wifeCellPhone,paymentPlanNumber`,
      'members': `familyName,familyEmail,firstName,lastName,hebrewFirstName,hebrewLastName,birthDate,gender,barMitzvahDate,batMitzvahDate,weddingDate`,
      'payments': `familyName,familyEmail,amount,paymentDate,year,type,paymentMethod,notes`,
      'lifecycle-events': `familyName,familyEmail,eventType,eventDate,year,amount,notes`
    }

    const csv = templates[importType]
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${importType}-template.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Import Data
          </h1>
          <p className="text-gray-600">Import families, members, payments, and lifecycle events from CSV files</p>
        </div>

        {/* Import Type Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Import Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['families', 'members', 'payments', 'lifecycle-events'] as ImportType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setImportType(type)
                  setFile(null)
                  setPreview([])
                  setResult(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  importType === type
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upload CSV File</h2>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Download Template
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <ArrowUpTrayIcon className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {file ? file.name : 'Click to upload CSV file'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {file ? 'Click to change file' : 'or drag and drop'}
                </p>
              </div>
            </label>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Preview (First 5 rows)</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0] || {}).map((header) => (
                        <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((value: any, colIdx) => (
                          <td key={colIdx} className="px-4 py-2 text-sm text-gray-700">
                            {value || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          {file && (
            <div className="mt-6">
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    <span>Import {importType}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className={`bg-white rounded-lg shadow-lg p-6 ${
            result.success ? 'border-2 border-green-200' : 'border-2 border-red-200'
          }`}>
            <div className="flex items-start gap-4">
              {result.success ? (
                <CheckCircleIcon className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <XCircleIcon className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3 className={`text-xl font-semibold mb-2 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Import Successful!' : 'Import Failed'}
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Imported:</span> {result.imported} records
                  </p>
                  {result.failed > 0 && (
                    <p className="text-red-600">
                      <span className="font-medium">Failed:</span> {result.failed} records
                    </p>
                  )}
                  {result.warnings.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-yellow-800 mb-2">Warnings:</p>
                      <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                        {result.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-red-800 mb-2">Errors:</p>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {result.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {result.success && (
                  <div className="mt-4">
                    <Link
                      href={importType === 'families' ? '/families' : importType === 'members' ? '/families' : importType === 'payments' ? '/payments' : '/events'}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View {importType} →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Import Instructions</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Download the template CSV file for the type you want to import</li>
            <li>• Fill in the data following the template format</li>
            <li>• Required fields must be filled (check template for required columns)</li>
            <li>• Dates should be in YYYY-MM-DD format</li>
            <li>• For members/payments/events: familyId can be left empty if you provide family name/email</li>
            <li>• Hebrew names should be entered directly (no transliteration needed)</li>
            <li>• Payment amounts should be numbers only (no currency symbols)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


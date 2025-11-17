'use client'

import { useState, useRef } from 'react'
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { exportToCSV } from '@/app/utils/csvExport'
import { parseCSV } from '@/app/utils/csvImport'
import { showToast } from './Toast'

interface TableImportExportProps<T extends Record<string, any>> {
  data: T[]
  filename: string
  headers?: { key: keyof T; label: string }[]
  onImport?: (data: T[]) => Promise<void>
  exportLabel?: string
  importLabel?: string
  disabled?: boolean
}

export default function TableImportExport<T extends Record<string, any>>({
  data,
  filename,
  headers,
  onImport,
  exportLabel = 'Export CSV',
  importLabel = 'Import CSV',
  disabled = false
}: TableImportExportProps<T>) {
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    try {
      exportToCSV(data, filename, headers)
      showToast(`Exported ${data.length} records to CSV`, 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to export data', 'error')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error')
      return
    }

    setIsImporting(true)
    try {
      const importedData = await parseCSV<T>(file, headers)
      
      if (importedData.length === 0) {
        showToast('No data found in CSV file', 'warning')
        return
      }

      if (onImport) {
        await onImport(importedData)
        showToast(`Successfully imported ${importedData.length} records`, 'success')
      } else {
        showToast(`Parsed ${importedData.length} records. Import handler not configured.`, 'info')
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to import CSV file', 'error')
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={disabled || data.length === 0}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={data.length === 0 ? 'No data to export' : exportLabel}
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        {exportLabel}
      </button>

      {onImport && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={disabled || isImporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={importLabel}
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            {isImporting ? 'Importing...' : importLabel}
          </button>
        </>
      )}
    </div>
  )
}


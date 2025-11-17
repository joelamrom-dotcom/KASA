/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    throw new Error('No data to export')
  }

  // If headers not provided, use all keys from first object
  const csvHeaders = headers || Object.keys(data[0]).map(key => ({ key, label: key }))
  
  // Create CSV header row
  const headerRow = csvHeaders.map(h => `"${h.label}"`).join(',')
  
  // Create CSV data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header.key]
      // Handle null/undefined
      if (value === null || value === undefined) return '""'
      // Handle dates
      if (typeof value === 'object' && value instanceof Date) {
        return `"${value.toLocaleDateString()}"`
      }
      // Handle objects/arrays (stringify)
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      }
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  })
  
  // Combine header and data rows
  const csvContent = [headerRow, ...dataRows].join('\n')
  
  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }) // BOM for Excel UTF-8 support
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}


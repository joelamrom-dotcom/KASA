/**
 * Parse CSV file and return array of objects
 */
export function parseCSV<T extends Record<string, any>>(
  file: File,
  headers?: { key: keyof T; label: string }[]
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length === 0) {
          reject(new Error('CSV file is empty'))
          return
        }
        
        // Parse header row
        const headerLine = lines[0]
        const csvHeaders = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        
        // If headers provided, map CSV headers to object keys
        // Otherwise, use CSV headers as keys
        const headerMap: { csvIndex: number; key: string }[] = headers
          ? csvHeaders.map((csvHeader, index) => {
              const header = headers.find(h => h.label === csvHeader)
              return {
                csvIndex: index,
                key: header ? String(header.key) : csvHeader
              }
            })
          : csvHeaders.map((csvHeader, index) => ({
              csvIndex: index,
              key: csvHeader
            }))
        
        // Parse data rows
        const data: T[] = []
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]
          const values = parseCSVLine(line)
          
          const row: any = {}
          headerMap.forEach(({ csvIndex, key }) => {
            let value = values[csvIndex]?.trim().replace(/^"|"$/g, '') || ''
            
            // Try to parse as number
            if (value && !isNaN(Number(value)) && value !== '') {
              const numValue = Number(value)
              if (value.includes('.')) {
                row[key] = numValue
              } else {
                row[key] = numValue
              }
            } else {
              row[key] = value
            }
          })
          
          // Only add row if it has at least one non-empty value
          if (Object.values(row).some(v => v !== '' && v !== null && v !== undefined)) {
            data.push(row as T)
          }
        }
        
        resolve(data)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last value
  values.push(current)
  
  return values
}


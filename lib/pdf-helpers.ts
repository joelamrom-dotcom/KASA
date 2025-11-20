/**
 * PDF Generation Helpers
 * For server-side PDF generation, we'll use HTML with print styles
 * For client-side, html2pdf.js can be used
 */

/**
 * Generate PDF from HTML using browser print functionality
 * This returns HTML optimized for PDF printing
 */
export function generatePDFHTML(html: string): string {
  // Add print-specific styles for PDF generation
  const pdfStyles = `
    <style>
      @media print {
        @page {
          margin: 1cm;
          size: letter;
        }
        body {
          margin: 0;
          padding: 0;
        }
        .no-print {
          display: none !important;
        }
      }
      @media screen {
        .print-only {
          display: none;
        }
      }
    </style>
  `
  
  return html.replace('</head>', `${pdfStyles}</head>`)
}

/**
 * Generate PDF download link
 */
export function generatePDFDownloadLink(html: string, filename: string): string {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  return url
}

/**
 * Client-side PDF generation using html2pdf.js
 */
export async function generatePDFClient(html: string, filename: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('generatePDFClient can only be called on the client side')
  }
  
  try {
    // Dynamic import to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default
    
    const element = document.createElement('div')
    element.innerHTML = html
    document.body.appendChild(element)
    
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    }
    
    await html2pdf().set(opt).from(element).save()
    
    document.body.removeChild(element)
  } catch (error) {
    console.error('Error generating PDF:', error)
    // Fallback to print dialog
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
    }
  }
}


// Standalone toast utility for client components
// This is a simple implementation that can be imported anywhere
// For more complex usage, use the useToast hook from ToastContainer

type ToastType = 'success' | 'error' | 'info' | 'warning'

// Simple console-based toast for server-side or fallback
export function showToast(message: string, type: ToastType = 'info') {
  if (typeof window !== 'undefined') {
    // Client-side: dispatch custom event that ToastContainer can listen to
    const event = new CustomEvent('showToast', {
      detail: { message, type }
    })
    window.dispatchEvent(event)
  } else {
    // Server-side: just log
    console.log(`[${type.toUpperCase()}] ${message}`)
  }
}

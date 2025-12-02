'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Web Worker wrapper for offloading heavy computations
 * Improves main thread performance
 */
export function useWebWorker<T, R>(
  workerScript: string,
  onMessage?: (result: R) => void
) {
  const workerRef = useRef<Worker | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Create worker
    const blob = new Blob([workerScript], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    workerRef.current = new Worker(url)

    // Handle messages
    if (onMessage) {
      workerRef.current.onmessage = (e) => {
        onMessage(e.data)
        setIsProcessing(false)
      }
    }

    workerRef.current.onerror = (error) => {
      console.error('Web Worker error:', error)
      setIsProcessing(false)
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        URL.revokeObjectURL(url)
      }
    }
  }, [workerScript, onMessage])

  const postMessage = (data: T) => {
    if (workerRef.current) {
      setIsProcessing(true)
      workerRef.current.postMessage(data)
    }
  }

  return { postMessage, isProcessing }
}

/**
 * Example: Heavy computation worker
 */
export const heavyComputationWorker = `
  self.onmessage = function(e) {
    const { data } = e;
    // Perform heavy computation
    const result = performHeavyComputation(data);
    self.postMessage(result);
  };

  function performHeavyComputation(data) {
    // Your heavy computation here
    return data;
  }
`


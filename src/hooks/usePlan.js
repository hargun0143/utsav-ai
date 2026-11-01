import { useState, useRef, useCallback } from 'react'

const REQUEST_TIMEOUT_MS = 65000
const HTTP_OK = 200
const HTTP_BAD_REQUEST = 400
const HTTP_SERVICE_UNAVAILABLE = 503

/**
 * Custom React hook for generating and managing plan requests and responses.
 * @returns {{ status: 'idle' | 'loading' | 'success' | 'error', plan: object | null, error: { message: string, retryable: boolean } | null, fieldErrors: Record<string, string>, generate: function(object): Promise<void>, retry: function(): void }} Plan state and control actions.
 */
export function usePlan() {
  const [status, setStatus] = useState('idle')
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const lastValueRef = useRef(null)
  const statusRef = useRef('idle')

  const generate = useCallback(async (value) => {
    if (statusRef.current === 'loading') return

    lastValueRef.current = value
    statusRef.current = 'loading'
    setStatus('loading')
    setError(null)
    setFieldErrors({})

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (res.status === HTTP_OK) {
        const data = await res.json()
        setPlan(data)
        statusRef.current = 'success'
        setStatus('success')
        return
      }

      if (res.status === HTTP_BAD_REQUEST) {
        const data = await res.json()
        setFieldErrors(data.fields || {})
        setError({
          message: data.error || 'Please check the form.',
          retryable: false,
        })
        statusRef.current = 'error'
        setStatus('error')
        return
      }

      if (res.status === HTTP_SERVICE_UNAVAILABLE) {
        const data = await res.json().catch(() => ({}))
        setError({
          message: data.error || 'The AI service is busy right now. Please try again in a moment.',
          retryable: true,
        })
        statusRef.current = 'error'
        setStatus('error')
        return
      }

      const data = await res.json().catch(() => ({}))
      setError({
        message: data.error || 'Something went wrong. Please try again.',
        retryable: true,
      })
      statusRef.current = 'error'
      setStatus('error')
    } catch (err) {
      clearTimeout(timer)
      const isAbort = err?.name === 'AbortError'
      setError({
        message: isAbort
          ? 'Planning took longer than expected. Please try again.'
          : 'Something went wrong. Please try again.',
        retryable: true,
      })
      statusRef.current = 'error'
      setStatus('error')
    }
  }, [])

  const retry = useCallback(() => {
    if (lastValueRef.current) {
      generate(lastValueRef.current)
    }
  }, [generate])

  return { status, plan, error, fieldErrors, generate, retry }
}

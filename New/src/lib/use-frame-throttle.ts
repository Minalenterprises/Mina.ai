import { useCallback, useEffect, useMemo, useRef } from 'react'

export type FrameThrottled<T> = { push: (value: T) => void; cancel: () => void; flush: () => void }

/**
 * Coalesces rapid updates (streamed text, live design edits) into at most one state update per animation frame,
 * so streaming never re-renders the studio for every token.
 */
export function useFrameThrottle<T>(apply: (value: T) => void): FrameThrottled<T> {
  const applyRef = useRef(apply)
  const pending = useRef<{ value: T } | null>(null)
  const frame = useRef<number | null>(null)
  useEffect(() => { applyRef.current = apply })

  const cancelFrame = useCallback(() => {
    if (frame.current === null) return
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame.current)
    else clearTimeout(frame.current)
    frame.current = null
  }, [])
  const flush = useCallback(() => {
    cancelFrame()
    const next = pending.current
    pending.current = null
    if (next) applyRef.current(next.value)
  }, [cancelFrame])
  const cancel = useCallback(() => { cancelFrame(); pending.current = null }, [cancelFrame])
  const push = useCallback((value: T) => {
    pending.current = { value }
    if (frame.current !== null) return
    frame.current = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(() => { frame.current = null; flush() })
      : setTimeout(() => { frame.current = null; flush() }, 32) as unknown as number
  }, [flush])

  useEffect(() => cancel, [cancel])
  return useMemo(() => ({ push, cancel, flush }), [push, cancel, flush])
}

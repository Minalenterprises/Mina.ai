import { memo, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { LoadingScreen } from './LoadingScreen'
import { SiriGlow } from './SiriGlow'
import { AnimatedCursor } from './AnimatedCursor'

/**
 * Wraps the (engine-owned) ProductScene with UI-only layers:
 *  - a branded loader until the first frame is really ready (canvas gets
 *    `data-design-key`, which ProductScene sets once labels/artwork are ready),
 *  - a Siri-style edge glow while the AI is working,
 *  - the animated "AI cursor" build overlay.
 * Nothing here reaches into the 3D engine; it only observes the DOM.
 */
type Props = { children: ReactNode; thinking: boolean; interactive3d: boolean; pulse: number; label?: string }

export const SceneStage = memo(function SceneStage({ children, thinking, interactive3d, pulse, label }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el || ready) return
    const check = () => {
      const canvas = el.querySelector('canvas')
      if ((canvas && canvas.dataset.designKey) || el.querySelector('.scene-fallback') || canvas?.dataset.labelError) setReady(true)
    }
    const observer = new MutationObserver(check)
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-design-key', 'data-label-error'] })
    const cap = window.setTimeout(() => setReady(true), 15000) // never trap the user behind a loader
    const raf = requestAnimationFrame(check)
    return () => { observer.disconnect(); window.clearTimeout(cap); cancelAnimationFrame(raf) }
  }, [ready])

  return (
    <div className={`scene-stage ${thinking ? 'is-thinking' : ''}`} ref={host}>
      <Suspense fallback={<LoadingScreen variant="inline" label="Loading the 3D engine" />}>{children}</Suspense>
      <AnimatePresence>{!ready && <LoadingScreen key="scene-loader" variant="inline" label="Rendering your 3D model" />}</AnimatePresence>
      <SiriGlow active={thinking} variant="edge" />
      <AnimatedCursor active={thinking && interactive3d && ready} pulse={pulse} label={label} />
    </div>
  )
})

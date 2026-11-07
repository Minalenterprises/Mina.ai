/**
 * Small, framework-free API for driving the 3D packaging scene from the UI.
 *
 *   import { playBuild, onBuildProgress, setLidOpen } from './lib/scene-api'
 *   const off = onBuildProgress(e => moveCursorTo(e.screen.x, e.screen.y))
 *   await playBuild({ duration: 2400 })
 *   off()
 *
 * Every mounted <ProductScene> listens. Window CustomEvents with the same names
 * (`mina:build`, `mina:build-progress`, `mina:build-done`, `mina:lid`) are also
 * dispatched so non-React code can participate.
 */

export type BuildOptions = {
  /** Total animation time in ms (default 2200). */
  duration?: number
  /** Close the lid at the end even if the preview is set to open (default: follow preview). */
  closeAtEnd?: boolean
  /** Only animate scenes whose `sceneId` prop matches. */
  sceneId?: string
}

export type BuildProgress = {
  sceneId?: string
  /** 0 → 1 overall progress. */
  progress: number
  /** Index of the part currently being placed, and the total number of parts. */
  part: number
  parts: number
  /** Name of the part being placed (mesh name or generated). */
  partName: string
  /** Where the part being placed is on screen, in client (viewport) pixels — feed this to an animated cursor. */
  screen: { x: number; y: number }
  phase: 'assemble' | 'fold' | 'done'
}

const bus = new EventTarget()
let nextId = 1

export const SCENE_EVENTS = { build: 'mina:build', progress: 'mina:build-progress', done: 'mina:build-done', lid: 'mina:lid' } as const

/** Plays the assemble animation on every mounted ProductScene. Resolves when it finishes (or after a safety timeout). */
export function playBuild(options: BuildOptions = {}): Promise<void> {
  const id = nextId++
  const detail = { ...options, id }
  return new Promise(resolve => {
    const timeout = window.setTimeout(finish, (options.duration ?? 2200) + 4000)
    function finish() {
      window.clearTimeout(timeout)
      bus.removeEventListener(SCENE_EVENTS.done, onDone)
      resolve()
    }
    function onDone(event: Event) { if ((event as CustomEvent).detail?.id === id) finish() }
    bus.addEventListener(SCENE_EVENTS.done, onDone)
    bus.dispatchEvent(new CustomEvent(SCENE_EVENTS.build, { detail }))
    window.dispatchEvent(new CustomEvent(SCENE_EVENTS.build, { detail }))
  })
}

/** Smoothly opens or closes the lid / drawer / flaps of mounted scenes without rebuilding them. */
export function setLidOpen(open: boolean, sceneId?: string) {
  const detail = { open, sceneId }
  bus.dispatchEvent(new CustomEvent(SCENE_EVENTS.lid, { detail }))
  window.dispatchEvent(new CustomEvent(SCENE_EVENTS.lid, { detail }))
}

export function onBuildProgress(listener: (progress: BuildProgress) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<BuildProgress>).detail)
  bus.addEventListener(SCENE_EVENTS.progress, handler)
  return () => bus.removeEventListener(SCENE_EVENTS.progress, handler)
}

/** @internal used by ProductScene */
export function subscribeScene(type: 'build' | 'lid', listener: (detail: Record<string, unknown>) => void) {
  const name = SCENE_EVENTS[type]
  const handler = (event: Event) => listener((event as CustomEvent).detail || {})
  bus.addEventListener(name, handler)
  return () => bus.removeEventListener(name, handler)
}

/** @internal used by ProductScene */
export function emitScene(type: 'progress' | 'done', detail: object) {
  bus.dispatchEvent(new CustomEvent(SCENE_EVENTS[type], { detail }))
  window.dispatchEvent(new CustomEvent(SCENE_EVENTS[type], { detail }))
}

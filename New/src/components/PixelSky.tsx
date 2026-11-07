import { memo, useEffect, useRef } from 'react'

/**
 * Pixel-mosaic sky: blocky blue clouds that frame a clear centre, drift slowly,
 * part around the pointer, and sit on a pixel skyline. Canvas-only, ~10fps,
 * pauses off-screen and respects reduced motion. Colours come from CSS vars
 * (--sky-0 … --sky-4, --sky-city, --sky-window) so it follows light/dark theme.
 */
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
const smooth = (t: number) => t * t * (3 - 2 * t)
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy)
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}
const fbm = (x: number, y: number) => noise(x, y) * .55 + noise(x * 2.1, y * 2.1) * .3 + noise(x * 4.3, y * 4.3) * .15

type Props = { cell?: number; skyline?: boolean; className?: string }

export const PixelSky = memo(function PixelSky({ cell = 22, skyline = true, className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let palette: string[] = [], city = '#0b0f19', windowLit = '#4c9bff'
    const readPalette = () => {
      const css = getComputedStyle(canvas)
      palette = [0, 1, 2, 3, 4].map(i => css.getPropertyValue(`--sky-${i}`).trim() || '#2f86ff')
      city = css.getPropertyValue('--sky-city').trim() || city
      windowLit = css.getPropertyValue('--sky-window').trim() || windowLit
    }
    readPalette()
    const themeObserver = new MutationObserver(() => { readPalette(); draw(performance.now()) })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    let w = 0, h = 0, cols = 0, rows = 0, size = cell
    const pointer = { x: -999, y: -999, tx: -999, ty: -999 }
    let towers: { x: number; w: number; h: number; seed: number }[] = []

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width; h = rect.height
      size = w < 640 ? Math.round(cell * .72) : cell
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / size) + 1; rows = Math.ceil(h / size) + 1
      towers = []
      let x = 0
      while (x < cols) {
        const tw = 1 + Math.floor(hash(x, 7) * 4)
        const tall = hash(x, 3) > .78
        towers.push({ x, w: tw, h: tall ? 4 + Math.floor(hash(x, 5) * 5) : 1 + Math.floor(hash(x, 9) * 3), seed: x })
        x += tw + (hash(x, 11) > .55 ? 1 : 0)
      }
      draw(performance.now())
    }

    const draw = (now: number) => {
      const t = reduce ? 0 : now / 9000
      ctx.clearRect(0, 0, w, h)
      const cx = cols / 2, cy = rows * .47
      const rx = cols * .36, ry = rows * .34
      pointer.x += (pointer.tx - pointer.x) * .18
      pointer.y += (pointer.ty - pointer.y) * .18
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const dx = (x - cx) / rx, dy = (y - cy) / ry
          const edge = Math.sqrt(dx * dx + dy * dy)
          const n = fbm(x * .085 + t, y * .11 - t * .4)
          let v = (edge - .78) * 1.35 + (n - .5) * 1.25
          const pd = Math.hypot(x * size - pointer.x, y * size - pointer.y) / size
          if (pd < 6) v -= (6 - pd) / 6 * .55
          if (v <= 0) continue
          const level = v > 1.05 ? 0 : v > .75 ? 1 : v > .45 ? 2 : v > .2 ? 3 : 4
          ctx.fillStyle = palette[level]
          ctx.fillRect(x * size, y * size, size + .5, size + .5)
        }
      }
      if (skyline) {
        for (const tower of towers) {
          ctx.fillStyle = city
          const top = rows - tower.h
          ctx.fillRect(tower.x * size, top * size, tower.w * size + .5, tower.h * size + 1)
          for (let wy = top + 1; wy < rows - 1; wy++) for (let wx = tower.x; wx < tower.x + tower.w; wx++) {
            const flicker = reduce ? 0 : Math.floor(now / 1400)
            if (hash(wx * 3 + flicker * .0001, wy * 5 + tower.seed) > .82) {
              ctx.fillStyle = windowLit
              const p = Math.max(3, size * .28)
              ctx.fillRect(wx * size + (size - p) / 2, wy * size + (size - p) / 2, p, p)
            }
          }
        }
      }
    }

    let raf = 0, last = 0, visible = true
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || now - last < 90) return
      last = now; draw(now)
    }
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    io.observe(canvas)
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const onMove = (event: PointerEvent) => { const r = canvas.getBoundingClientRect(); pointer.tx = event.clientX - r.left; pointer.ty = event.clientY - r.top }
    const onLeave = () => { pointer.tx = -999; pointer.ty = -999 }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    resize()
    if (!reduce) raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); themeObserver.disconnect(); window.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave) }
  }, [cell, skyline])

  return <canvas ref={ref} className={`pixel-sky ${className}`} aria-hidden="true" />
})

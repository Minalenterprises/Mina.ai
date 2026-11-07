import { memo, useEffect, useRef } from 'react'

/**
 * Pixel-mosaic sky: blocky blue clouds that frame a clear centre, drift, part around the pointer, leave a pixel trail, ripple on click, and sit on a pixel skyline. Canvas-only, ~10fps,
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

    const trail: { x: number; y: number; life: number }[] = []
    const ripples: { x: number; y: number; r: number }[] = []
    let lastDrop = 0

    const draw = (now: number) => {
      const t = reduce ? 0 : now / 2600
      ctx.clearRect(0, 0, w, h)
      const cx = cols / 2, cy = rows * .47
      const rx = cols * .36, ry = rows * .34
      pointer.x += (pointer.tx - pointer.x) * .35
      pointer.y += (pointer.ty - pointer.y) * .35
      for (const p of trail) p.life -= .045
      while (trail.length && trail[0].life <= 0) trail.shift()
      for (const r of ripples) r.r += .85
      while (ripples.length && ripples[0].r > Math.max(cols, rows)) ripples.shift()
      if (!reduce && now - lastDrop > 3800) { lastDrop = now; ripples.push({ x: (.15 + hash(now, 1) * .7) * cols, y: (.15 + hash(now, 2) * .6) * rows, r: 0 }) }
      const px = pointer.x / size, py = pointer.y / size
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const dx = (x - cx) / rx, dy = (y - cy) / ry
          const edge = Math.sqrt(dx * dx + dy * dy)
          const n = fbm(x * .085 + t, y * .11 - t * .35)
          let v = (edge - .78) * 1.35 + (n - .5) * 1.25
          // pointer parts the clouds
          const pd = Math.hypot(x - px, y - py)
          if (pd < 8) v -= ((8 - pd) / 8) ** 1.4 * .9
          // pixel trail + ripple rings
          let glow = 0
          for (const p of trail) { const d = Math.hypot(x - p.x, y - p.y); if (d < 1.15 * p.life + .35) glow = Math.max(glow, p.life) }
          for (const r of ripples) { const d = Math.hypot(x - r.x, y - r.y); if (Math.abs(d - r.r) < .7) glow = Math.max(glow, Math.max(0, 1 - r.r / 26)) }
          if (v <= 0) {
            if (glow > .08) { ctx.fillStyle = palette[glow > .6 ? 2 : glow > .3 ? 3 : 4]; ctx.fillRect(x * size, y * size, size + .5, size + .5) }
            continue
          }
          let level = v > 1.05 ? 0 : v > .75 ? 1 : v > .45 ? 2 : v > .2 ? 3 : 4
          if (glow > .08) level = Math.min(4, level + (glow > .5 ? 2 : 1))
          ctx.fillStyle = palette[level]
          ctx.fillRect(x * size, y * size, size + .5, size + .5)
        }
      }
      if (skyline) {
        for (const tower of towers) {
          ctx.fillStyle = city
          const top = rows - tower.h
          ctx.fillRect(tower.x * size, top * size, tower.w * size + .5, tower.h * size + 1)
          const flicker = reduce ? 0 : Math.floor(now / 1400)
          for (let wy = top + 1; wy < rows - 1; wy++) for (let wx = tower.x; wx < tower.x + tower.w; wx++) {
            if (hash(wx * 3 + flicker * 7.13, wy * 5 + tower.seed) > .84) {
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
      if (!visible || now - last < 45) return
      last = now; draw(now)
    }
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    io.observe(canvas)
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const onMove = (event: PointerEvent) => {
      const r = canvas.getBoundingClientRect(); pointer.tx = event.clientX - r.left; pointer.ty = event.clientY - r.top
      const last = trail[trail.length - 1], gx = pointer.tx / size, gy = pointer.ty / size
      if (!last || Math.hypot(last.x - gx, last.y - gy) > .6) { trail.push({ x: gx, y: gy, life: 1 }); if (trail.length > 36) trail.shift() }
    }
    const onDown = (event: PointerEvent) => { const r = canvas.getBoundingClientRect(); if (event.clientY > r.bottom) return; ripples.push({ x: (event.clientX - r.left) / size, y: (event.clientY - r.top) / size, r: 0 }) }
    window.addEventListener('pointerdown', onDown, { passive: true })
    const onLeave = () => { pointer.tx = -999; pointer.ty = -999 }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    resize()
    if (!reduce) raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); themeObserver.disconnect(); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onDown); document.removeEventListener('pointerleave', onLeave) }
  }, [cell, skyline])

  return <canvas ref={ref} className={`pixel-sky ${className}`} aria-hidden="true" />
})

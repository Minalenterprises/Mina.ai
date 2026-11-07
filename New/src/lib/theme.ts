import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'minal-theme'

export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  try { localStorage.setItem(KEY, theme) } catch { /* private mode */ }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#05070d' : '#f5f8fc')
}

/** Light / dark toggle. Initial value is set before paint by the inline script in index.html. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getTheme)
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return { theme, toggle: () => applyTheme(theme === 'dark' ? 'light' : 'dark') }
}

import { useState } from 'react'

/** Allow unfinished input without sending empty/negative dimensions to the renderer. */
export function NumberField({ value, min, max, step = 1, onChange }: { value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState('')
  return <input type="number" required min={min} max={max} step={step} value={editing ? draft : value}
    onFocus={() => { setDraft(String(value)); setEditing(true) }}
    onChange={e => {
      setDraft(e.target.value)
      const next = e.target.valueAsNumber
      if (Number.isFinite(next) && next >= min && next <= max && (step !== 1 || Number.isInteger(next))) onChange(next)
    }}
    onBlur={() => {
      const parsed = draft.trim() ? Number(draft) : value
      const next = Number.isFinite(parsed) ? Math.min(max, Math.max(min, step === 1 ? Math.round(parsed) : parsed)) : value
      onChange(next); setEditing(false)
    }} />
}

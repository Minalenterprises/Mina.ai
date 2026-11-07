import type { ToolActivity } from '../types'

/** Tools that only read state. They are safe to run in parallel and never change the design. */
export const READ_ONLY_TOOLS = new Set(['read_design', 'list_fonts', 'list_templates', 'list_shapes', 'list_textures', 'list_print_designs', 'review_design'])

/** Friendly, user-facing status for a running tool. Never exposes tool names. */
export function toolStatus(name: string, mode: 'chat' | 'magic' = 'chat'): string {
  switch (name) {
    case 'set_shape': return mode === 'magic' ? 'Picking the shape…' : 'Shaping the structure…'
    case 'update_design': return mode === 'magic' ? 'Choosing materials and colours…' : 'Applying edits…'
    case 'apply_template': return 'Applying a template…'
    case 'update_typography': return 'Setting the typography…'
    case 'update_artwork':
    case 'apply_print_design': return 'Painting the artwork…'
    case 'generate_artwork_image': return 'Generating artwork…'
    case 'update_surface': return 'Applying texture…'
    case 'update_product_info': return 'Updating product info…'
    case 'set_model_parts': return 'Adding details…'
    case 'set_preview': return 'Framing the view…'
    case 'inspect_preview': return 'Checking the render…'
    case 'review_design': return 'Reviewing the design…'
    default: return mode === 'magic' ? 'Exploring options…' : 'Thinking…'
  }
}

const FIELD_LABELS: Record<string, string> = {
  name: 'name', brief: 'brief', notes: 'notes', category: 'shape', structure: 'shape', shapeParams: 'shape', materialPreset: 'material', material: 'material',
  color: 'colour', innerColor: 'inner colour', accentColor: 'accent colour', wallThickness: 'wall thickness', cornerRadius: 'corners', finish: 'finish',
  dimensions: 'size', quantity: 'quantity', openTop: 'lid', hasHandles: 'handles', modelParts: 'accessories', surface: 'texture', productInfo: 'product info', artwork: 'artwork',
  'typography.text': 'front text', 'typography.subtitle': 'subtitle', 'typography.fontFamily': 'font', 'typography.fontWeight': 'font weight', 'typography.color': 'text colour',
  'typography.size': 'text size', 'typography.lineHeight': 'line spacing', 'typography.letterSpacing': 'letter spacing', 'typography.blockScale': 'text size', 'typography.align': 'alignment',
  'typography.placement': 'text placement', 'typography.transform': 'letter case', 'typography.background': 'text plaque', 'typography.visible': 'text visibility',
}
const TOOL_LABELS: Record<string, string[]> = {
  set_shape: ['shape'], apply_template: ['template'], generate_artwork_image: ['artwork'], apply_print_design: ['artwork'], update_artwork: ['artwork'],
  update_surface: ['texture'], update_product_info: ['product info'], set_model_parts: ['accessories'],
}

/** Friendly labels for what a set of tool calls changed, in the order they happened, without duplicates. */
export function changeLabels(tools: ToolActivity[] | undefined): string[] {
  const labels: string[] = []
  for (const tool of tools || []) {
    if (tool.status !== 'complete' || READ_ONLY_TOOLS.has(tool.name) || tool.name === 'set_preview' || tool.name === 'inspect_preview') continue
    const fields = tool.fields || []
    let next = TOOL_LABELS[tool.name] ? [...TOOL_LABELS[tool.name]] : []
    if (tool.name === 'set_shape' && fields.includes('dimensions')) next.push('size')
    if (!TOOL_LABELS[tool.name]) next = fields.map(field => FIELD_LABELS[field]).filter(Boolean)
    for (const label of next) if (!labels.includes(label)) labels.push(label)
  }
  return labels
}

/** A compact one-line summary like "Edited: colour · front text · texture", or '' when nothing changed. */
export function changeSummary(tools: ToolActivity[] | undefined, verb = 'Edited'): string {
  const labels = changeLabels(tools)
  if (!labels.length) return ''
  const shown = labels.slice(0, 5)
  return `${verb}: ${shown.join(' · ')}${labels.length > shown.length ? ` · +${labels.length - shown.length} more` : ''}`
}

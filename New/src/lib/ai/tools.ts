import { designState, executeDesignTool } from '../design-tools'
import { generateArtworkImage } from '../image-generation'
import type { Design, PreviewSettings, ToolActivity } from '../types'
import { AIError, inlineImage, newId, parseArgs, type HarnessOptions, type InlineImage, type ToolCall, type ToolOutcome } from './core'
import { READ_ONLY_TOOLS, toolStatus } from './labels'

export const MAX_TOOL_CALLS = 30

type RunState = { design: Design; preview: PreviewSettings; count: number }

async function runOne(call: ToolCall, state: RunState, options: HarnessOptions, signal: AbortSignal): Promise<ToolOutcome> {
  const args = parseArgs(call.args)
  let result: unknown
  let image: InlineImage | undefined
  let activity: ToolActivity
  try {
    if (args && typeof args === 'object' && '__invalid' in args) throw new Error('Arguments were not valid JSON. Send an object matching the schema.')
    if (call.name === 'generate_artwork_image') {
      state.design = await generateArtworkImage(state.design, args, signal)
      options.onDesign?.(state.design)
      image = inlineImage(state.design.artwork?.image)
      result = { generated: true, design: designState(state.design) }
      activity = { id: newId(), name: call.name, summary: 'Generated and applied original image artwork', status: 'complete', fields: ['artwork'] }
    } else if (call.name === 'inspect_preview') {
      if (!options.capturePreview) throw new Error('Rendered preview capture is unavailable in this session.')
      image = inlineImage(await options.capturePreview(state.design))
      if (!image) throw new Error('The preview returned no supported image.')
      result = { captured: true, design: designState(state.design), preview: state.preview }
      activity = { id: newId(), name: call.name, summary: 'Inspected the rendered 3D preview', status: 'complete' }
    } else {
      const applied = await executeDesignTool(call.name, args || {}, state.design, state.preview)
      signal.throwIfAborted()
      state.design = applied.design
      state.preview = applied.preview
      if (applied.fields.length && !READ_ONLY_TOOLS.has(call.name)) { options.onDesign?.(state.design); options.onPreview?.(state.preview) }
      result = applied.result
      activity = { id: newId(), name: call.name, summary: applied.summary, status: 'complete', fields: READ_ONLY_TOOLS.has(call.name) ? [] : applied.fields }
    }
  } catch (error) {
    signal.throwIfAborted()
    const message = error instanceof Error ? error.message : 'Tool failed.'
    result = { error: message, applied: false, hint: 'Correct the arguments and call the tool again.' }
    activity = { id: newId(), name: call.name, summary: message, status: 'error' }
  }
  options.onTool?.(activity)
  return { call, result, image, activity, error: activity.status === 'error' }
}

/** Read-only tools see the same state, so they can run concurrently. */
async function runReadOnly(call: ToolCall, state: RunState, options: HarnessOptions, signal: AbortSignal): Promise<ToolOutcome> {
  return runOne(call, { ...state }, options, signal)
}

/**
 * Executes a model turn's tool calls against the design.
 * Consecutive read-only calls run in parallel; edits run in order because each builds on the previous result.
 */
export async function runToolCalls(calls: ToolCall[], state: RunState, options: HarnessOptions, signal: AbortSignal): Promise<ToolOutcome[]> {
  const outcomes: ToolOutcome[] = []
  let lastStatus = ''
  const status = (name: string) => {
    const next = toolStatus(name, options.mode)
    if (next !== lastStatus) { lastStatus = next; options.onProgress?.(next) }
  }
  for (let index = 0; index < calls.length;) {
    signal.throwIfAborted()
    if (READ_ONLY_TOOLS.has(calls[index].name)) {
      const batch: ToolCall[] = []
      while (index < calls.length && READ_ONLY_TOOLS.has(calls[index].name)) batch.push(calls[index++])
      if ((state.count += batch.length) > MAX_TOOL_CALLS) throw new AIError('The AI reached the tool limit. Split this request into smaller changes.')
      status(batch[0].name)
      outcomes.push(...await Promise.all(batch.map(call => runReadOnly(call, state, options, signal))))
      continue
    }
    const call = calls[index++]
    if (++state.count > MAX_TOOL_CALLS) throw new AIError('The AI reached the tool limit. Split this request into smaller changes.')
    status(call.name)
    outcomes.push(await runOne(call, state, options, signal))
  }
  return outcomes
}

/**
 * Keeps the per-round payload small: only the newest tool result carries the full design state.
 * Older results are rewritten in place (providers serialise them on each request).
 */
export function compactToolResults(history: unknown[]) {
  let latestWithState = -1
  history.forEach((result, index) => { if (result && typeof result === 'object' && !Array.isArray(result) && 'design' in result) latestWithState = index })
  history.forEach((result, index) => {
    if (index === latestWithState || !result || typeof result !== 'object' || Array.isArray(result) || !('design' in result)) return
    const record = result as Record<string, unknown>
    delete record.design
    record.state = 'superseded — see the latest tool result'
  })
}

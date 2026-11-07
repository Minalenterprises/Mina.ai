// Provider adapter checks: OpenAI (Responses API), Anthropic (Messages API), OpenRouter (Chat Completions) and custom providers
// run the same design-tool loop with real request shapes, streaming parsers, retries and cancellation.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'esbuild'

const bundle = await build({ stdin: { contents: `export * from './src/lib/gemini'; export * from './src/lib/ai-settings'; export * from './src/lib/types'; export * from './src/lib/ai/core'; export * from './src/lib/ai/labels'; export * from './src/lib/ai/prompt'; export * from './src/lib/ai/agent'; export * from './src/lib/design-tools'`, resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'esm', plugins: [{ name: 'runtime-skill', setup(builder) { builder.onResolve({ filter: /SKILL\.md\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.replace('?raw', '')), namespace: 'skill' })); builder.onLoad({ filter: /.*/, namespace: 'skill' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' })) } }] })
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
console.debug = () => {}

const initial = api.newDesign('Provider regression test')
const preview = { camera: 'perspective', openBox: false, autoRotate: false }
const useSettings = (provider, apiKey = 'test-key', model) => {
  const settings = api.migrateSettings({ ...api.DEFAULT_SETTINGS, provider })
  if (provider === 'gemini') settings.apiKey = apiKey
  else settings.providers[provider] = { apiKey, model: model || api.PROVIDERS[provider].defaultModel }
  globalThis.window = {}
  globalThis.localStorage = { getItem: () => JSON.stringify(settings), setItem() {} }
}
const encoder = new TextEncoder()
/** A streamed HTTP response delivering the SSE text in small irregular chunks. */
const sse = (text, { hang = false } = {}) => {
  const bytes = encoder.encode(text)
  let offset = 0
  return {
    ok: true, status: 200, headers: new Headers({ 'content-type': 'text/event-stream' }),
    body: new ReadableStream({
      pull(controller) {
        if (offset >= bytes.length) { if (!hang) controller.close(); return new Promise(() => {}) }
        const size = 7 + (offset % 23)
        controller.enqueue(bytes.slice(offset, offset + size)); offset += size
      },
    }),
  }
}
const events = list => list.map(([event, data]) => `${event ? `event: ${event}\n` : ''}data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`).join('')
const failure = (status, body) => ({ ok: false, status, headers: new Headers(), json: async () => body })
const noUppercaseTypes = value => !JSON.stringify(value).match(/"type":"(STRING|OBJECT|NUMBER|INTEGER|BOOLEAN|ARRAY)"/)

// Settings migration keeps saved Gemini settings working.
const migrated = api.migrateSettings({ apiKey: 'AIza-old', model: 'gemini-3.6-flash', temperature: .4, systemPrompt: 'Keep it minimal.' })
assert.equal(migrated.provider, 'gemini')
assert.equal(migrated.apiKey, 'AIza-old')
assert.equal(migrated.model, 'gemini-3.6-flash')
assert.equal(migrated.providers.openai.model, 'gpt-6.1-terra')
assert.equal(migrated.providers.anthropic.model, 'claude-sonnet-5-5')
assert.equal(migrated.systemPrompt, 'Keep it minimal.')
assert.equal(api.providerCredentials(api.withProviderCredentials(migrated, 'openrouter', { apiKey: 'or' }), 'openrouter').apiKey, 'or')

// Tool schemas are converted to standard JSON Schema for the non-Gemini providers.
const specs = api.designToolSpecs()
assert.equal(specs.length, api.DESIGN_TOOL_DECLARATIONS.length)
assert.ok(noUppercaseTypes(specs.map(spec => spec.parameters)))
assert.ok(specs.every(spec => spec.parameters.type === 'object'))

// ── OpenAI Responses API ──
useSettings('openai')
let requests = []
let replies = [
  sse(events([
    [null, { type: 'response.output_item.done', output_index: 0, item: { type: 'reasoning', id: 'rs_1', encrypted_content: 'enc', summary: [] } }],
    [null, { type: 'response.output_item.done', output_index: 1, item: { type: 'function_call', id: 'fc_1', call_id: 'call_fonts', name: 'list_fonts', arguments: '{"query":"Lora"}' } }],
    [null, { type: 'response.output_item.done', output_index: 2, item: { type: 'function_call', id: 'fc_2', call_id: 'call_shape', name: 'set_shape', arguments: '{"shape":"bottle"}' } }],
    [null, { type: 'response.completed', response: { status: 'completed', output: [{ type: 'reasoning', id: 'rs_1', encrypted_content: 'enc', summary: [] }, { type: 'function_call', id: 'fc_1', call_id: 'call_fonts', name: 'list_fonts', arguments: '{"query":"Lora"}' }, { type: 'function_call', id: 'fc_2', call_id: 'call_shape', name: 'set_shape', arguments: '{"shape":"bottle"}' }] } }],
  ])),
  sse(events([
    [null, { type: 'response.output_text.delta', delta: 'Made it ' }],
    [null, { type: 'response.output_text.delta', delta: 'a bottle.' }],
    [null, { type: 'response.completed', response: { status: 'completed', output: [{ type: 'message', id: 'msg_1', role: 'assistant', content: [{ type: 'output_text', text: 'Made it a bottle.' }] }] } }],
  ])),
]
globalThis.fetch = async (url, options = {}) => { requests.push({ url, headers: options.headers, body: options.body ? JSON.parse(options.body) : undefined }); return replies.shift() }
let streamed = [], statuses = []
let result = await api.chatWithAI([{ role: 'user', text: 'Make it a bottle' }], initial, { preview, onText: text => streamed.push(text), onProgress: status => statuses.push(status) })
assert.equal(requests[0].url, 'https://api.openai.com/v1/responses')
assert.equal(requests[0].headers.Authorization, 'Bearer test-key')
assert.equal(requests[0].body.stream, true)
assert.equal(requests[0].body.store, false)
assert.equal(requests[0].body.temperature, undefined)
assert.deepEqual(requests[0].body.reasoning, { effort: 'low' })
assert.equal(requests[0].body.tools[0].type, 'function')
assert.ok(noUppercaseTypes(requests[0].body.tools))
assert.ok(requests[0].body.instructions.includes('72 locally bundled fonts'))
const replay = requests[1].body.input
assert.equal(replay.find(item => item.type === 'reasoning').encrypted_content, 'enc')
assert.equal(replay.find(item => item.type === 'function_call' && item.call_id === 'call_shape').id, undefined)
const shapeOutput = JSON.parse(replay.find(item => item.type === 'function_call_output' && item.call_id === 'call_shape').output)
assert.equal(shapeOutput.applied, true)
assert.ok(shapeOutput.design, 'latest tool result carries the design state')
assert.ok(Array.isArray(JSON.parse(replay.find(item => item.call_id === 'call_fonts' && item.type === 'function_call_output').output)))
assert.equal(result.design.structure, 'bottle')
assert.equal(result.text, 'Made it a bottle.')
assert.equal(streamed.at(-1), 'Made it a bottle.')
assert.ok(statuses.includes('Thinking…') && statuses.includes('Generating…') && statuses.includes('Shaping the structure…'))
assert.ok(!statuses.some(status => /set_shape|list_fonts|[{}]/.test(status)), 'status line never shows tool names or JSON')
assert.equal(api.changeSummary(result.tools), 'Edited: shape · size')

// Non-retryable quota errors fail fast with a clear message.
replies = [failure(429, { error: { code: 'insufficient_quota', message: 'quota' } })]
await assert.rejects(() => api.chatWithAI([{ role: 'user', text: 'hi' }], initial), /no remaining credit/)
// Model-not-found is reported clearly.
replies = [failure(404, { error: { code: 'model_not_found', message: 'nope' } })]
await assert.rejects(() => api.chatWithAI([{ role: 'user', text: 'hi' }], initial), /isn’t available/)
// A new message aborts a request mid-stream.
replies = [sse(events([[null, { type: 'response.output_text.delta', delta: 'Partial' }]]), { hang: true })]
const controller = new AbortController()
const pending = api.chatWithAI([{ role: 'user', text: 'hi' }], initial, { signal: controller.signal, onText: () => controller.abort() })
await assert.rejects(() => pending, /abort/i)

// ── Anthropic Messages API ──
useSettings('anthropic')
requests = []
replies = [
  sse(events([
    ['message_start', { type: 'message_start', message: { id: 'm1', content: [] } }],
    ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '' } }],
    ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'Pick a matte black box.' } }],
    ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'sig-123' } }],
    ['content_block_stop', { type: 'content_block_stop', index: 0 }],
    ['content_block_start', { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 'toolu_1', name: 'update_design', input: {} } }],
    ['content_block_delta', { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"color": "#1' } }],
    ['content_block_delta', { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '11111", "finish": "Matte"}' } }],
    ['content_block_stop', { type: 'content_block_stop', index: 1 }],
    ['message_delta', { type: 'message_delta', delta: { stop_reason: 'tool_use' } }],
    ['message_stop', { type: 'message_stop' }],
  ])),
  sse(events([
    ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }],
    ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Matte black applied.' } }],
    ['content_block_stop', { type: 'content_block_stop', index: 0 }],
    ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' } }],
  ])),
]
streamed = []
result = await api.chatWithAI([{ role: 'model', text: 'Hi!' }, { role: 'user', text: 'Matte black please' }], initial, { preview, onText: text => streamed.push(text) })
assert.equal(requests[0].url, 'https://api.anthropic.com/v1/messages')
assert.equal(requests[0].headers['anthropic-dangerous-direct-browser-access'], 'true')
assert.equal(requests[0].headers['x-api-key'], 'test-key')
assert.equal(requests[0].body.temperature, undefined)
assert.equal(requests[0].body.model, 'claude-sonnet-5-5')
assert.equal(requests[0].body.messages[0].role, 'user', 'conversation starts with a user turn')
assert.equal(requests[0].body.system[0].cache_control.type, 'ephemeral')
assert.ok(noUppercaseTypes(requests[0].body.tools))
const assistant = requests[1].body.messages.at(-2)
assert.equal(assistant.content[0].signature, 'sig-123')
assert.deepEqual(assistant.content[1].input, { color: '#111111', finish: 'Matte' })
const toolResult = requests[1].body.messages.at(-1).content[0]
assert.equal(toolResult.tool_use_id, 'toolu_1')
assert.equal(JSON.parse(toolResult.content[0].text).applied, true)
assert.equal(result.design.color, '#111111')
assert.equal(result.text, 'Matte black applied.')
assert.equal(api.changeSummary(result.tools), 'Edited: colour · finish')
replies = [failure(401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } })]
await assert.rejects(() => api.chatWithAI([{ role: 'user', text: 'hi' }], initial), /rejected the API key/)
// Overload (529) is retried, then succeeds.
replies = [failure(529, { error: { message: 'Overloaded' } }), sse(events([
  ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }],
  ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hello.' } }],
  ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' } }],
]))]
assert.equal((await api.chatWithAI([{ role: 'user', text: 'hi' }], initial, { onText: () => {} })).text, 'Hello.')

// ── OpenRouter Chat Completions ──
useSettings('openrouter')
requests = []
const chunk = (delta, finish = null) => [null, { choices: [{ index: 0, delta, finish_reason: finish }] }]
replies = [
  sse(': OPENROUTER PROCESSING\n\n' + events([
    chunk({ role: 'assistant', reasoning_details: [{ type: 'reasoning.text', index: 0, text: 'Plan', signature: null }] }),
    chunk({ tool_calls: [{ index: 0, id: 'call_a', type: 'function', function: { name: 'update_typography', arguments: '' } }] }),
    chunk({ tool_calls: [{ index: 0, function: { arguments: '{"text":"NOIR",' } }] }),
    chunk({ tool_calls: [{ index: 0, function: { arguments: '"fontFamily":"Lora"}' } }] }),
    chunk({ tool_calls: [{ index: 1, id: 'call_b', type: 'function', function: { name: 'update_surface', arguments: '{"texture":"linen"}' } }] }),
    chunk({}, 'tool_calls'),
    [null, '[DONE]'],
  ])),
  sse(events([chunk({ content: 'Set NOIR in Lora on linen.' }), chunk({}, 'stop'), [null, '[DONE]']])),
]
result = await api.chatWithAI([{ role: 'user', text: 'Brand it NOIR' }], initial, { preview, onText: () => {} })
assert.equal(requests[0].url, 'https://openrouter.ai/api/v1/chat/completions')
assert.equal(requests[0].body.model, 'anthropic/claude-sonnet-5.5')
assert.equal(requests[0].body.messages[0].role, 'system')
assert.ok(noUppercaseTypes(requests[0].body.tools))
const orAssistant = requests[1].body.messages.find(message => message.role === 'assistant')
assert.equal(orAssistant.tool_calls.length, 2)
assert.equal(orAssistant.tool_calls[0].function.arguments, '{"text":"NOIR","fontFamily":"Lora"}')
assert.equal(orAssistant.reasoning_details[0].text, 'Plan')
const toolMessages = requests[1].body.messages.filter(message => message.role === 'tool')
assert.deepEqual(toolMessages.map(message => message.tool_call_id), ['call_a', 'call_b'])
// Only the newest tool result carries the full design state; the older one is compacted.
assert.equal(JSON.parse(toolMessages[0].content).design, undefined)
assert.ok(JSON.parse(toolMessages[1].content).design)
assert.equal(result.design.typography.text, 'NOIR')
assert.equal(result.design.surface.texture, 'linen')
assert.equal(api.changeSummary(result.tools), 'Edited: front text · font · texture')

// Magic Build adds its build plan to the system prompt and uses friendly build statuses.
replies = [sse(events([chunk({ content: 'Built.' }), chunk({}, 'stop')]))]
requests = []
await api.chatWithAI([{ role: 'user', text: 'matte black luxury perfume box with gold foil logo' }], initial, { mode: 'magic', onText: () => {} })
assert.ok(requests[0].body.messages[0].content.includes('MAGIC BUILD MODE'))
assert.equal(api.toolStatus('set_shape', 'magic'), 'Picking the shape…')
assert.equal(api.changeSummary([{ id: '1', name: 'set_shape', summary: '', status: 'complete', fields: ['structure', 'dimensions'] }, { id: '2', name: 'update_design', summary: '', status: 'complete', fields: ['materialPreset', 'color'] }], 'Built'), 'Built: shape · size · material · colour')

// Image generation is only offered when a Google key exists.
const withoutGoogle = requests[0].body.tools.map(tool => tool.function.name)
assert.ok(!withoutGoogle.includes('generate_artwork_image'))

// ── Gemini streaming (the studio now streams on every provider) ──
useSettings('gemini')
requests = []
replies = [
  sse(events([
    [null, { candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'update_design', args: { color: '#222222' } }, thoughtSignature: 'g-sig' }] } }] }],
    [null, { candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'review_design', args: {} } }] }, finishReason: 'STOP' }] }],
  ])),
  sse(events([
    [null, { candidates: [{ content: { role: 'model', parts: [{ text: 'Darker ' }] } }] }],
    [null, { candidates: [{ content: { role: 'model', parts: [{ text: 'now.' }] }, finishReason: 'STOP' }] }],
  ])),
]
streamed = []
result = await api.chatWithAI([{ role: 'user', text: 'darker' }], initial, { preview, onText: text => streamed.push(text) })
assert.ok(requests[0].url.includes(':streamGenerateContent?alt=sse'))
assert.equal(requests[1].body.contents[1].parts[0].thoughtSignature, 'g-sig')
assert.equal(requests[1].body.contents[2].parts.length, 2)
assert.ok(requests[0].body.tools[0].functionDeclarations.some(tool => tool.name === 'generate_artwork_image'))
assert.equal(result.text, 'Darker now.')
assert.equal(streamed.at(-1), 'Darker now.')
assert.equal(result.design.color, '#222222')

// History compaction keeps the newest image only and shortens old turns.
const long = 'x'.repeat(2000)
const compact = api.compactHistory([{ role: 'user', text: long, image: 'data:image/png;base64,AAAA' }, ...Array.from({ length: 8 }, (_, i) => ({ role: i % 2 ? 'user' : 'model', text: `turn ${i}` })), { role: 'user', text: 'latest', image: 'data:image/png;base64,BBBB' }])
assert.equal(compact.filter(message => message.image).length, 1)
assert.ok(compact[0].text.length < 800)

// ── Custom providers ──
const json = (body, status = 200) => ({ ok: status < 400, status, headers: new Headers({ 'content-type': 'application/json' }), body: {}, json: async () => body })
const useCustom = (custom, extra = {}) => {
  const settings = api.migrateSettings({ ...api.DEFAULT_SETTINGS, ...extra, customProviders: [custom], provider: custom.id })
  globalThis.window = {}
  globalThis.localStorage = { getItem: () => JSON.stringify(settings), setItem() {} }
  return settings
}
const customProvider = (patch = {}) => ({ id: 'custom:acme', name: 'Acme LLM', baseUrl: 'https://llm.example.com/v1///', apiKey: 'test-key', model: 'acme-tools-1', format: 'openai-chat', auth: { style: 'header', headerName: 'X-Api-Key', prefix: 'Token ' }, extraHeaders: [{ key: 'X-Org', value: 'acme' }, { key: 'bad header', value: 'x' }], ...patch })

// Migration: older settings gain an empty list; broken entries are dropped; a missing active custom provider falls back to Gemini.
assert.deepEqual(api.migrateSettings({ apiKey: 'AIza-old' }).customProviders, [])
const mixed = api.migrateSettings({ provider: 'custom:gone', customProviders: [customProvider(), { id: 'nope' }, null, customProvider({ name: 'Dup' })] })
assert.equal(mixed.provider, 'gemini')
assert.equal(mixed.customProviders.length, 1)
assert.equal(mixed.customProviders[0].auth.headerName, 'X-Api-Key')
assert.equal(api.migrateSettings({ provider: 'custom:acme', customProviders: [customProvider()] }).provider, 'custom:acme')
assert.equal(api.migrateSettings({ customProviders: [{ ...customProvider(), format: 'weird', auth: undefined }] }).customProviders[0].auth.style, 'bearer')

// Base URL validation: trailing slashes and pasted endpoints are trimmed; bad URLs get a friendly error.
assert.equal(api.normalizeBaseUrl('https://llm.example.com/v1///').url, 'https://llm.example.com/v1')
assert.equal(api.normalizeBaseUrl('https://api.groq.com/openai/v1/chat/completions').url, 'https://api.groq.com/openai/v1')
assert.equal(api.normalizeBaseUrl('https://api.anthropic.com/v1/', 'anthropic').url, 'https://api.anthropic.com')
assert.ok(api.normalizeBaseUrl('ftp://example.com').error)
assert.ok(api.normalizeBaseUrl('localhost:11434').error)
assert.ok(api.normalizeBaseUrl('not a url').error)
const presets = Object.fromEntries(api.CUSTOM_PRESETS.map(preset => [preset.id, preset]))
assert.equal(presets.groq.baseUrl, 'https://api.groq.com/openai/v1')
assert.equal(presets.zai.baseUrl, 'https://api.z.ai/api/paas/v4')
assert.equal(presets['ollama-cloud'].baseUrl, 'https://ollama.com/v1')
assert.equal(presets.ollama.auth, 'none')
assert.ok(api.CUSTOM_PRESETS.every(preset => !api.normalizeBaseUrl(preset.baseUrl, preset.format).error && api.normalizeBaseUrl(preset.baseUrl, preset.format).url === preset.baseUrl))
assert.ok(api.CUSTOM_PRESETS.every(preset => !('model' in preset)), 'presets never hard-code model names')

// OpenAI-compatible custom provider with custom-header auth: streaming tool loop, reasoning replay, strict-server-safe body.
useCustom(customProvider())
assert.equal(api.isConfigured(), true)
assert.equal(api.activeProviderLabel(), 'Acme LLM · acme-tools-1')
requests = []
replies = [
  sse(events([
    chunk({ role: 'assistant', reasoning_content: 'Bottle suits ' }),
    chunk({ reasoning_content: 'a perfume.' }),
    chunk({ tool_calls: [{ index: 0, id: 'call_s', type: 'function', function: { name: 'set_shape', arguments: '{"shape":' } }] }),
    chunk({ tool_calls: [{ index: 0, function: { arguments: '"bottle"}' } }] }),
    chunk({}, 'tool_calls'),
    [null, '[DONE]'],
  ])),
  sse(events([chunk({ content: 'Bottle ready.' }), chunk({}, 'stop'), [null, '[DONE]']])),
]
streamed = []
result = await api.chatWithAI([{ role: 'user', text: 'Make it a bottle' }], initial, { preview, onText: text => streamed.push(text) })
assert.equal(requests[0].url, 'https://llm.example.com/v1/chat/completions')
assert.equal(requests[0].headers['X-Api-Key'], 'Token test-key')
assert.equal(requests[0].headers.Authorization, undefined)
assert.equal(requests[0].headers['X-Org'], 'acme')
assert.equal(requests[0].headers['bad header'], undefined, 'invalid header names are skipped')
assert.equal(requests[0].headers['Content-Type'], 'application/json')
assert.equal(requests[0].body.model, 'acme-tools-1')
assert.equal(requests[0].body.stream, true)
assert.equal(requests[0].body.parallel_tool_calls, undefined)
assert.ok(noUppercaseTypes(requests[0].body.tools))
const customAssistant = requests[1].body.messages.find(message => message.role === 'assistant')
assert.equal(customAssistant.tool_calls[0].function.arguments, '{"shape":"bottle"}')
assert.equal(customAssistant.reasoning_content, 'Bottle suits a perfume.')
assert.equal(JSON.parse(requests[1].body.messages.find(message => message.role === 'tool').content).applied, true)
assert.equal(result.design.structure, 'bottle')
assert.equal(result.text, 'Bottle ready.')
assert.equal(streamed.at(-1), 'Bottle ready.')

// A server that ignores `stream` and answers with plain JSON (no SSE) still works, tool arguments as objects included.
requests = []
replies = [
  json({ choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'update_design', arguments: { color: '#333333' } } }] }, finish_reason: 'tool_calls' }] }),
  json({ choices: [{ message: { role: 'assistant', content: 'Charcoal it is.' }, finish_reason: 'stop' }] }),
]
streamed = []
result = await api.chatWithAI([{ role: 'user', text: 'charcoal' }], initial, { onText: text => streamed.push(text) })
assert.equal(result.design.color, '#333333')
assert.equal(result.text, 'Charcoal it is.')
assert.equal(streamed.at(-1), 'Charcoal it is.')

// A server that rejects streaming is asked again without it.
requests = []
replies = [failure(400, { error: { message: 'Streaming is not supported for this model' } }), json({ choices: [{ message: { content: 'Hi there.' }, finish_reason: 'stop' }] })]
assert.equal((await api.chatWithAI([{ role: 'user', text: 'hi' }], initial, { onText: () => {} })).text, 'Hi there.')
assert.equal(requests[0].body.stream, true)
assert.equal(requests[1].body.stream, false)

// A model without image input: images are dropped and the request retried.
requests = []
replies = [failure(400, { error: { message: 'Image input is not supported by this model' } }), json({ choices: [{ message: { content: 'Noted.' }, finish_reason: 'stop' }] })]
assert.equal((await api.chatWithAI([{ role: 'user', text: 'use this logo', image: 'data:image/png;base64,AAAA' }], initial, { onText: () => {} })).text, 'Noted.')
assert.ok(JSON.stringify(requests[0].body.messages).includes('image_url'))
assert.ok(!JSON.stringify(requests[1].body.messages).includes('image_url'))

// A model without tool calling gets a clear, actionable error.
replies = [failure(400, { error: { message: 'registry.ollama.ai/library/llama2:latest does not support tools' } })]
await assert.rejects(() => api.chatWithAI([{ role: 'user', text: 'hi' }], initial, { onText: () => {} }), /doesn’t support tool calling.*tool-capable model/)

// Local server, no auth: no key needed, no Authorization header; an unreachable server explains CORS.
useCustom(customProvider({ baseUrl: 'http://localhost:11434/v1', apiKey: '', auth: { style: 'none', headerName: '', prefix: '' }, extraHeaders: [] }))
assert.equal(api.isConfigured(), true)
requests = []
replies = [json({ choices: [{ message: { content: 'Local hello.' }, finish_reason: 'stop' }] })]
assert.equal((await api.chatWithAI([{ role: 'user', text: 'hi' }], initial)).text, 'Local hello.')
assert.equal(requests[0].url, 'http://localhost:11434/v1/chat/completions')
assert.equal(requests[0].headers.Authorization, undefined)
globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
await assert.rejects(() => api.chatWithAI([{ role: 'user', text: 'hi' }], initial), /CORS.*OLLAMA_ORIGINS/)
globalThis.fetch = async (url, options = {}) => { requests.push({ url, headers: options.headers, body: options.body ? JSON.parse(options.body) : undefined }); return replies.shift() }

// Incomplete setup is reported before any request.
useCustom(customProvider({ apiKey: '' }))
assert.equal(api.isConfigured(), false)
await assert.rejects(() => api.chatWithAI([{ role: 'user', text: 'hi' }], initial), /Add your Acme LLM API key/)

// Load models (GET {base}/models with the custom auth) and Test (one tiny tool request).
requests = []
replies = [json({ object: 'list', data: [{ id: 'zeta-2' }, { id: 'alpha-1' }] })]
assert.deepEqual((await api.listCustomProviderModels(customProvider())).map(model => model.id), ['alpha-1', 'zeta-2'])
assert.equal(requests[0].url, 'https://llm.example.com/v1/models')
assert.equal(requests[0].headers['X-Api-Key'], 'Token test-key')
replies = [json({ choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }] })]
assert.deepEqual(await api.testCustomProvider(customProvider()), { success: true })
assert.equal(requests.at(-1).body.tools[0].function.name, 'ping')
replies = [failure(400, { error: { message: 'tool calling is not supported for model acme-tools-1' } })]
assert.match((await api.testCustomProvider(customProvider())).error, /doesn’t support tool calling/)
assert.match((await api.testCustomProvider(customProvider({ baseUrl: 'nope' }))).error, /valid URL/)

// Anthropic-format custom endpoint reuses the Claude adapter with the custom base URL and auth.
useCustom(customProvider({ format: 'anthropic', baseUrl: 'https://proxy.example.com/v1/', auth: { style: 'header', headerName: 'x-api-key', prefix: '' }, extraHeaders: [] }))
requests = []
replies = [json({ content: [{ type: 'text', text: 'Proxy hello.' }], stop_reason: 'end_turn' })]
assert.equal((await api.chatWithAI([{ role: 'user', text: 'hi' }], initial, { onText: () => {} })).text, 'Proxy hello.')
assert.equal(requests[0].url, 'https://proxy.example.com/v1/messages')
assert.equal(requests[0].headers['x-api-key'], 'test-key')
assert.equal(requests[0].headers['anthropic-version'], '2023-06-01')
assert.equal(requests[0].headers['anthropic-dangerous-direct-browser-access'], undefined)

console.log('Passed: Gemini streaming, OpenAI Responses, Anthropic Messages, OpenRouter and custom-provider adapters (OpenAI-compatible with custom header auth, no-auth local, Anthropic format) — streaming, tool loop, thinking signatures, reasoning replay, schema conversion, compaction, retries, errors, cancellation, non-stream/no-image fallbacks, tool-support and CORS errors, and Magic Build.')

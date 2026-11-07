import { useState } from 'react'
import { AlertCircle, ArrowUpRight, CheckCircle2, Eye, EyeOff, Loader2, Plus, Server, Trash2, X } from 'lucide-react'
import { API_FORMATS, CUSTOM_PRESETS, defaultAuth, isValidHeaderName, normalizeBaseUrl, type ApiFormat, type AuthStyle, type CustomProvider } from '../lib/ai-settings'
import { listCustomProviderModels, testCustomProvider } from '../lib/gemini'

type Props = {
  provider: CustomProvider
  onChange: (provider: CustomProvider) => void
  onDelete: () => void
  notify: (message: string, kind?: 'info') => void
}

const BASE_PLACEHOLDER: Record<ApiFormat, string> = {
  'openai-chat': 'https://api.example.com/v1',
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
}

/** Form for one user-added provider: endpoint, auth, extra headers, model (typed or loaded) and a live test. */
export function CustomProviderSettings({ provider, onChange, onDelete, notify }: Props) {
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [loadingModels, setLoadingModels] = useState(false)
  const [models, setModels] = useState<{ id: string; name: string }[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const preset = CUSTOM_PRESETS.find(item => item.id === provider.preset)
  const baseCheck = provider.baseUrl.trim() ? normalizeBaseUrl(provider.baseUrl, provider.format) : { url: '', error: undefined }
  const headerNameInvalid = provider.auth.style === 'header' && !!provider.auth.headerName.trim() && !isValidHeaderName(provider.auth.headerName)
  const listId = `custom-models-${provider.id.replace(/[^\w-]/g, '')}`

  const change = (patch: Partial<CustomProvider>) => { onChange({ ...provider, ...patch }); setTestResult(null) }

  const applyPreset = (id: string) => {
    const found = CUSTOM_PRESETS.find(item => item.id === id)
    if (!found) { change({ preset: undefined }); return }
    // Prefill only: endpoint, format and auth. The model comes from the provider's list or the user.
    const keepName = provider.name.trim() && provider.name !== preset?.name && provider.name !== 'My provider'
    change({ preset: found.id, name: keepName ? provider.name : found.name, baseUrl: found.baseUrl, format: found.format, auth: defaultAuth(found.format, found.auth), model: '' })
    setModels([])
  }

  const changeFormat = (format: ApiFormat) => change({ format, auth: provider.auth.style === 'none' ? provider.auth : defaultAuth(format) })

  const changeAuthStyle = (style: AuthStyle) => {
    const fallback = defaultAuth(provider.format)
    change({ auth: { style, headerName: style === 'header' ? provider.auth.headerName || fallback.headerName || 'x-api-key' : provider.auth.headerName, prefix: provider.auth.prefix } })
  }

  const tidyBaseUrl = () => {
    const { url, error } = normalizeBaseUrl(provider.baseUrl, provider.format)
    if (!error && url !== provider.baseUrl) change({ baseUrl: url })
  }

  const setHeader = (index: number, patch: Partial<{ key: string; value: string }>) => change({ extraHeaders: provider.extraHeaders.map((header, i) => i === index ? { ...header, ...patch } : header) })

  const loadModels = async () => {
    if (baseCheck.error || !provider.baseUrl.trim()) { notify('Enter a valid base URL first.', 'info'); return }
    setLoadingModels(true)
    try {
      const found = await listCustomProviderModels(provider)
      setModels(found)
      notify(found.length ? `Found ${found.length} models on ${provider.name}.` : `${provider.name} returned no models. Type the model ID instead.`, 'info')
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not load models.', 'info') } finally { setLoadingModels(false) }
  }

  const runTest = async () => {
    setTesting(true); setTestResult(null)
    try {
      const result = await testCustomProvider(provider)
      setTestResult(result)
      notify(result.success ? `${provider.name} is connected.` : result.error || 'Test failed.', result.success ? undefined : 'info')
    } finally { setTesting(false) }
  }

  return <>
    <div className="settings-section">
      <h3><Server size={17} /> Custom provider</h3>
      <p>Any OpenAI-compatible, Anthropic-format or Gemini-format API. Calls go straight from this browser to the provider; the key is stored only in this browser.</p>
      <label className="field">Start from a preset<select value={provider.preset || ''} onChange={e => applyPreset(e.target.value)} aria-label="Provider preset"><option value="">Custom (enter details below)</option>{CUSTOM_PRESETS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      {preset?.note && <small className="custom-provider-note">{preset.note}</small>}
      <div className="field-row custom-provider-row">
        <label className="field">Name<input value={provider.name} maxLength={60} onChange={e => change({ name: e.target.value })} onBlur={e => { if (!e.target.value.trim()) change({ name: 'Custom provider' }) }} placeholder="My provider" aria-label="Provider name" /></label>
        <label className="field">API format<select value={provider.format} onChange={e => changeFormat(e.target.value as ApiFormat)} aria-label="API format">{API_FORMATS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>
      <label className="field">Base URL<input value={provider.baseUrl} onChange={e => change({ baseUrl: e.target.value })} onBlur={tidyBaseUrl} placeholder={BASE_PLACEHOLDER[provider.format]} spellCheck={false} autoComplete="off" inputMode="url" aria-label="Base URL" aria-invalid={!!baseCheck.error} /></label>
      {baseCheck.error ? <p className="tool-error" role="alert">{baseCheck.error}</p> : provider.baseUrl.trim() && <small className="custom-provider-note">Requests go to <code>{provider.format === 'openai-chat' ? `${baseCheck.url}/chat/completions` : provider.format === 'anthropic' ? `${baseCheck.url}/v1/messages` : `${baseCheck.url}/models/{model}:generateContent`}</code>{preset?.keyUrl && <> · <a href={preset.keyUrl} target="_blank" rel="noopener noreferrer">Get a {preset.name} key <ArrowUpRight size={12} /></a></>}</small>}
    </div>

    <div className="settings-section">
      <h3>Authentication</h3>
      <p>Local servers such as Ollama and LM Studio need no key: choose “None”.</p>
      <div className="field-row custom-provider-row">
        <label className="field">Auth style<select value={provider.auth.style} onChange={e => changeAuthStyle(e.target.value as AuthStyle)} aria-label="Auth style"><option value="bearer">Bearer token (Authorization header)</option><option value="header">Custom header</option><option value="none">None</option></select></label>
        {provider.auth.style === 'header' && <label className="field">Header name<input value={provider.auth.headerName} onChange={e => change({ auth: { ...provider.auth, headerName: e.target.value } })} placeholder="x-api-key" spellCheck={false} aria-label="Auth header name" aria-invalid={headerNameInvalid} /></label>}
      </div>
      {provider.auth.style === 'header' && <label className="field">Value prefix <small>optional, e.g. “Token ” or “Key ”</small><input value={provider.auth.prefix} onChange={e => change({ auth: { ...provider.auth, prefix: e.target.value } })} placeholder="(none)" spellCheck={false} aria-label="Auth value prefix" /></label>}
      {headerNameInvalid && <p className="tool-error" role="alert">Header names can only use letters, digits and - _ . characters.</p>}
      {provider.auth.style !== 'none' && <div className="api-key-input">
        <input type={showKey ? 'text' : 'password'} value={provider.apiKey} onChange={e => change({ apiKey: e.target.value })} placeholder="API key" aria-label={`${provider.name} API key`} spellCheck={false} autoComplete="off" />
        <button type="button" className="icon-button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? 'Hide API key' : 'Show API key'}>{showKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
      </div>}
      <div className="custom-headers">
        <span className="eyebrow">EXTRA HEADERS</span>
        {provider.extraHeaders.map((header, index) => {
          const invalid = !!header.key.trim() && !isValidHeaderName(header.key)
          return <div className="custom-header-row" key={index}>
            <input value={header.key} onChange={e => setHeader(index, { key: e.target.value })} placeholder="Header name" spellCheck={false} aria-label={`Extra header ${index + 1} name`} aria-invalid={invalid} />
            <input value={header.value} onChange={e => setHeader(index, { value: e.target.value })} placeholder="Value" spellCheck={false} aria-label={`Extra header ${index + 1} value`} />
            <button type="button" className="icon-button" onClick={() => change({ extraHeaders: provider.extraHeaders.filter((_, i) => i !== index) })} aria-label={`Remove header ${header.key || index + 1}`}><X size={14} /></button>
          </div>
        })}
        <button type="button" className="button button-outline button-sm" disabled={provider.extraHeaders.length >= 20} onClick={() => change({ extraHeaders: [...provider.extraHeaders, { key: '', value: '' }] })}><Plus size={14} /> Add header</button>
      </div>
    </div>

    <div className="settings-section">
      <h3>Model</h3>
      <p>Type the model ID or load the list from the provider. The design tools need a model that supports tool (function) calling.</p>
      <label className="field">Model ID<input value={provider.model} onChange={e => change({ model: e.target.value.trim() })} placeholder={models[0]?.id || 'model-id'} list={listId} spellCheck={false} aria-label={`${provider.name} model ID`} /></label>
      <datalist id={listId}>{models.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}</datalist>
      <div className="custom-provider-actions">
        <button type="button" className="button button-outline button-sm" disabled={loadingModels || !provider.baseUrl.trim()} onClick={loadModels}>{loadingModels ? <><Loader2 size={14} className="spin" /> Loading…</> : 'Load models'}</button>
        <button type="button" className="button button-outline button-sm" disabled={testing || !provider.baseUrl.trim()} onClick={runTest}>{testing ? <><Loader2 size={14} className="spin" /> Testing…</> : 'Test'}</button>
      </div>
      {models.length > 0 && <small className="custom-provider-note">{models.length} models loaded; pick one from the Model ID suggestions.</small>}
      {testResult && <div className={`test-result ${testResult.success ? 'test-success' : 'test-error'}`}>{testResult.success ? <><CheckCircle2 size={15} /> Connected to {provider.name} with {provider.model}. Tool calling accepted.</> : <><AlertCircle size={15} /> {testResult.error}</>}</div>}
      <div className="custom-provider-actions">
        {confirmDelete
          ? <><span>Delete {provider.name} and its key?</span><button type="button" className="button button-danger button-sm" onClick={onDelete}><Trash2 size={14} /> Delete</button><button type="button" className="button button-outline button-sm" onClick={() => setConfirmDelete(false)}>Keep</button></>
          : <button type="button" className="button button-outline button-sm" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> Delete provider</button>}
      </div>
    </div>
  </>
}

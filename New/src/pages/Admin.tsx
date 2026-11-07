import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Sparkles, Box, PackageCheck, MessageCircle, Search, ArrowUpRight, Download, ArrowUp, Check, ChevronDown, ChevronUp, Inbox, ShieldCheck, Archive, Trash2, X, Settings, Key, Brain, Thermometer, Shield, Type, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, RotateCcw, Zap, Plus, Server } from 'lucide-react'
import { Header } from '../components/Header'
import { MinalMark } from '../components/Brand'
import { useStore } from '../lib/store'
import { uid, type Order } from '../lib/types'
import { downloadFile } from '../lib/utils'
import { loadSettings, saveSettings, DEFAULT_SETTINGS, PROVIDERS, PROVIDER_IDS, providerCredentials, providerName, providerReady, findCustomProvider, newCustomProvider, withCustomProvider, withoutCustomProvider, withProviderCredentials, type AISettings, type BuiltinProviderId, type CustomProvider, type ProviderId } from '../lib/ai-settings'
import { CustomProviderSettings } from '../components/CustomProviderSettings'
import { listProviderModels, testProviderKey } from '../lib/gemini'
import { isReasoningModel } from '../lib/ai/core'
import { availableImageModels } from '../lib/image-generation'

export function Admin() {
  const { designs, orders, threads, saveDesign, deleteDesign, updateOrder, saveThread, notify } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = ['designs', 'orders', 'inbox', 'settings'].includes(params.get('tab') || '') ? params.get('tab')! : 'designs'
  const [search, setSearch] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [aiSettings, setAiSettings] = useState<AISettings>(() => loadSettings())
  const [imageModels, setImageModels] = useState<{ id: string; name: string }[]>([])
  const [discoveringImages, setDiscoveringImages] = useState(false)
  const [imageModelError, setImageModelError] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success: boolean, error?: string} | null>(null)
  /** Which provider's key and model are being edited (defaults to the active one). */
  const [editing, setEditing] = useState<ProviderId>(() => loadSettings().provider)
  const [accountModels, setAccountModels] = useState<Partial<Record<ProviderId, { id: string; name: string }[]>>>({})
  const [loadingModels, setLoadingModels] = useState(false)
  /** A deleted custom provider falls back to editing the active one. */
  const editingId: ProviderId = !editing.startsWith('custom:') || findCustomProvider(aiSettings, editing) ? editing : aiSettings.provider
  const editingCustom = findCustomProvider(aiSettings, editingId)
  const credentials = providerCredentials(aiSettings, editingId)
  const editingInfo = editingCustom || editingId.startsWith('custom:') ? undefined : PROVIDERS[editingId as BuiltinProviderId]
  const activeModel = providerCredentials(aiSettings).model
  const activeCustom = findCustomProvider(aiSettings, aiSettings.provider)
  // Gemini 3, OpenAI reasoning models and current Claude models set their own sampling; temperature is not sent to them.
  const temperatureLocked = aiSettings.provider === 'anthropic' || activeCustom?.format === 'anthropic' || (aiSettings.provider === 'gemini' && activeModel.startsWith('gemini-3')) || (aiSettings.provider === 'openai' && isReasoningModel(activeModel))
  const selectedThread = threads.find(thread => thread.id === selectedThreadId) || threads[0]
  const filteredDesigns = designs.filter(design => `${design.name} ${design.category} ${design.status}`.toLowerCase().includes(search.toLowerCase()))
  const filteredOrders = orders.filter(order => `${order.id} ${order.designName} ${order.fullName} ${order.status}`.toLowerCase().includes(search.toLowerCase()))
  const exportData = () => { downloadFile(JSON.stringify({ exportedAt: new Date().toISOString(), designs, orders, threads }, null, 2), 'minal-workspace-export.json', 'application/json'); notify('Your workspace export is downloaded.') }

  const updateSetting = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    const updated = { ...aiSettings, [key]: value }
    setAiSettings(updated)
    saveSettings(updated)
    setTestResult(null)
  }

  const updateCredentials = (change: { apiKey?: string; model?: string }) => {
    const updated = withProviderCredentials(aiSettings, editingId, change)
    setAiSettings(updated)
    saveSettings(updated)
    setTestResult(null)
  }

  const chooseProvider = (provider: ProviderId) => {
    setEditing(provider)
    updateSetting('provider', provider)
    setShowKey(false)
  }

  const persist = (updated: AISettings) => { setAiSettings(updated); saveSettings(updated); setTestResult(null) }

  const addCustomProvider = () => {
    const created = newCustomProvider()
    persist({ ...withCustomProvider(aiSettings, created), provider: created.id })
    setEditing(created.id)
    setShowKey(false)
  }

  const updateCustomProvider = (provider: CustomProvider) => persist(withCustomProvider(aiSettings, provider))

  const deleteCustomProvider = (provider: CustomProvider) => {
    const updated = withoutCustomProvider(aiSettings, provider.id)
    persist(updated)
    setEditing(updated.provider)
    notify(`${provider.name} removed.`)
  }

  const loadAccountModels = async () => {
    if (!editingInfo) return
    setLoadingModels(true)
    try {
      const models = await listProviderModels(editingId, credentials.apiKey)
      setAccountModels(current => ({ ...current, [editingId]: models }))
      notify(models.length ? `Found ${models.length} models for ${editingInfo.name}.` : 'No chat models were returned for this key.', 'info')
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not load models.', 'info') } finally { setLoadingModels(false) }
  }

  const handleTestKey = async () => {
    if (!editingInfo) return
    if (!credentials.apiKey.trim()) { notify('Please enter an API key first.', 'info'); return }
    setTesting(true)
    setTestResult(null)
    try {
      const result = await testProviderKey(editingId, credentials.apiKey.trim(), credentials.model || editingInfo.defaultModel)
      setTestResult(result)
      if (result.success) notify('API key is working! AI features are now active.')
      else notify(result.error || 'API key test failed.', 'info')
    } catch { setTestResult({ success: false, error: 'Connection failed.' }) } finally { setTesting(false) }
  }

  const resetSettings = () => { setAiSettings(DEFAULT_SETTINGS); saveSettings(DEFAULT_SETTINGS); setEditing(DEFAULT_SETTINGS.provider); setTestResult(null); setShowKey(false); notify('Settings reset to defaults.') }

  return <div className="workspace-page admin-page"><Header workspace /><main className="page-width"><div className="admin-demo-banner"><ShieldCheck size={16} /><span><strong>Admin demo</strong> · This is a local workspace. There is no live team, authentication, or shared database connected.</span><Link to="/projects">Back to my ideas <ArrowUpRight size={13} /></Link></div><div className="workspace-title"><div><span className="eyebrow">BEHIND THE LITTLE DETAILS</span><h1>The making-it-happen space.</h1><p>A clear view of designs, requests, and conversations.</p></div><button className="button button-outline" onClick={exportData}><Download size={16} /> Export workspace</button></div><div className="admin-stats"><button onClick={() => setParams({ tab: 'designs' })}><span><Box size={18} /> ALL DESIGNS</span><strong>{designs.length}<small>{designs.filter(design => design.status === 'Ready').length} ready to go</small></strong></button><button onClick={() => setParams({ tab: 'orders' })}><span><PackageCheck size={18} /> ORDER REQUESTS</span><strong>{orders.length}<small>{orders.filter(order => order.status === 'Requested').length} awaiting review</small></strong></button><button onClick={() => setParams({ tab: 'inbox' })}><span><MessageCircle size={18} /> CONVERSATIONS</span><strong>{threads.length}<small>{threads.filter(thread => thread.status === 'Open').length} open conversations</small></strong></button><button onClick={() => setParams({ tab: 'settings' })}><span><Settings size={18} /> AI SETTINGS</span><strong><Zap size={16} /><small>{providerReady(aiSettings) ? providerName(aiSettings) : 'Not configured'}</small></strong></button></div><div className="projects-toolbar"><div className="workspace-tabs">{[{ id: 'designs', label: 'Design library', icon: Box }, { id: 'orders', label: 'Order requests', icon: PackageCheck }, { id: 'inbox', label: 'Team inbox', icon: MessageCircle }, { id: 'settings', label: 'AI Settings', icon: Settings }].map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setParams({ tab: item.id }); setSearch('') }}><item.icon size={16} />{item.label}</button>)}</div>{tab !== 'inbox' && tab !== 'settings' && <label className="search-input"><Search size={16} /><input placeholder={tab === 'orders' ? 'Search requests…' : 'Search designs…'} aria-label="Search admin workspace" value={search} onChange={e => setSearch(e.target.value)} />{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={13} /></button>}</label>}</div>
    {tab === 'designs' && <div className="admin-table-container">{filteredDesigns.length ? <table className="admin-table"><thead><tr><th>DESIGN</th><th>STRUCTURE</th><th>LAST UPDATED</th><th>STATUS</th><th>A LITTLE ACTION</th></tr></thead><tbody>{filteredDesigns.map(design => <tr key={design.id}><td><Link className="table-design-name" to={`/studio/${design.id}`}><span className="table-color" style={{ background: design.color }}><Box size={19} strokeWidth={1.2} /></span><div><strong>{design.name}</strong><small>{design.material}</small></div></Link></td><td>{design.category}</td><td>{new Date(design.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td><select aria-label={`Status for ${design.name}`} className="table-status" value={design.status} onChange={e => { saveDesign({ ...design, status: e.target.value as 'Draft' | 'Ready' | 'Archived', updatedAt: new Date().toISOString() }); notify('Design status updated.') }}><option>Draft</option><option>Ready</option><option>Archived</option></select></td><td><div className="table-actions"><Link className="icon-button" to={`/studio/${design.id}`} title="Open design" aria-label={`Open ${design.name}`}><ArrowUpRight size={17} /></Link><button className="icon-button" title={design.status === 'Archived' ? 'Restore design' : 'Archive design'} aria-label={`${design.status === 'Archived' ? 'Restore' : 'Archive'} ${design.name}`} onClick={() => { saveDesign({ ...design, status: design.status === 'Archived' ? 'Draft' : 'Archived' }); notify(design.status === 'Archived' ? 'Design restored.' : 'Design archived.') }}><Archive size={15} /></button><button className="icon-button danger-button" title="Delete design" aria-label={`Delete ${design.name}`} onClick={() => setDeleteId(design.id)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table> : <AdminEmpty icon="designs" title={search ? 'Nothing by that name.' : 'A little library, waiting to grow.'} description={search ? 'Try a different search to find what you need.' : 'Designs created in this browser will appear here. Start a conversation to add your first idea.'} />}</div>}
    {tab === 'orders' && <div className="admin-orders">{filteredOrders.length ? filteredOrders.map(order => <article key={order.id} className="admin-order-card"><div className="admin-order-top"><span className="order-list-icon"><PackageCheck size={22} /></span><div><span className="eyebrow">{order.id}</span><h3>{order.designName}</h3><p>{order.fullName} · {order.quantity} units · {new Date(order.createdAt).toLocaleDateString()}</p></div><label className="order-status-label"><span>Request status</span><select value={order.status} onChange={e => { updateOrder(order.id, e.target.value as Order['status']); notify('Request status updated.') }} aria-label={`Status for order ${order.id}`}>{['Requested', 'In review', 'Approved', 'In production', 'Shipped'].map(value => <option key={value}>{value}</option>)}</select></label><button className="icon-button" aria-label={`${expandedOrder === order.id ? 'Hide' : 'View'} order details`} aria-expanded={expandedOrder === order.id} onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>{expandedOrder === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button></div>{expandedOrder === order.id && <div className="admin-order-details"><div><span className="eyebrow">CONTACT DETAILS</span><strong>{order.fullName}</strong><span>{order.email}</span><span>{order.phone || 'No phone supplied'}</span></div><div><span className="eyebrow">DELIVERY ADDRESS</span><span>{order.address}</span><span>{order.city}, {order.postalCode}</span><span>{order.country}</span></div><div><span className="eyebrow">THE LITTLE DETAILS</span><p>{order.notes || 'No additional notes.'}</p>{designs.some(design => design.id === order.designId) ? <Link to={`/studio/${order.designId}`}>Open product design <ArrowUpRight size={13} /></Link> : <span>Original design was deleted.</span>}</div></div>}</article>) : <AdminEmpty icon="orders" title={search ? 'No matching requests.' : 'No requests, just yet.'} description="Order requests from the design studio appear here, ready for you to review and manage." />}</div>}
    {tab === 'inbox' && <div className="admin-inbox"><aside className="inbox-threads"><h3>A little conversation <span>{threads.length}</span></h3>{threads.length ? threads.map(thread => <button key={thread.id} className={selectedThread?.id === thread.id ? 'active' : ''} onClick={() => setSelectedThreadId(thread.id)}><span className="inbox-avatar"><MessageCircle size={18} /></span><div><strong>{thread.name}</strong><p>{thread.messages[thread.messages.length - 1]?.text}</p><small>{thread.status} · {thread.messages.length} messages</small></div></button>) : <p className="inbox-no-threads">No conversations yet. Open the chat widget and leave a message in "Design team" to try it.</p>}</aside><section className="inbox-conversation">{selectedThread ? <><div className="inbox-conversation-header"><div><strong>{selectedThread.name}</strong><span>Local demo conversation</span></div><button className="button button-outline button-sm" onClick={() => { saveThread({ ...selectedThread, status: selectedThread.status === 'Open' ? 'Resolved' : 'Open' }); notify(selectedThread.status === 'Open' ? 'Conversation marked as resolved.' : 'Conversation reopened.') }}><Check size={14} />{selectedThread.status === 'Open' ? 'Resolve' : 'Reopen'}</button></div><div className="inbox-messages" role="log" aria-label="Team conversation">{selectedThread.messages.map(message => <div key={message.id} className={`inbox-message ${message.role === 'admin' ? 'admin-reply' : ''}`}><span>{message.role === 'admin' ? 'Minal design team' : 'You · visitor'}</span><p>{message.text}</p><small>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>)}</div><form className="inbox-compose" onSubmit={e => { e.preventDefault(); if (!reply.trim()) return; saveThread({ ...selectedThread, messages: [...selectedThread.messages, { id: uid(), role: 'admin', text: reply.trim(), createdAt: new Date().toISOString() }] }); setReply(''); notify('Reply added to the local conversation.') }}><span><MinalMark size={13} /> REPLYING AS THE DESIGN TEAM</span><div><textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="A thoughtful little reply…" rows={2} maxLength={2000} aria-label="Admin reply" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} /><button className="send-button" type="submit" disabled={!reply.trim()} aria-label="Send admin reply"><ArrowUp size={18} /></button></div></form></> : <div className="inbox-welcome"><Inbox size={43} strokeWidth={1} /><h2>Good conversations live here.</h2><p>A helpful reply can make all the difference.</p></div>}</section></div>}
    {tab === 'settings' && <div className="ai-settings-panel">
      <div className="settings-header">
        <div className="settings-icon"><Brain size={22} /></div>
        <div>
          <span className="eyebrow">POWER UP YOUR WORKSPACE</span>
          <h2>AI Settings</h2>
          <p>Connect Google Gemini, OpenAI, Anthropic Claude, OpenRouter or your own provider. Every provider drives the same 3D design tools.</p>
        </div>
      </div>

      <div className="settings-section">
        <h3><Zap size={17} /> AI provider</h3>
        <p>Choose which provider powers your design conversations and Magic Build. Keys are stored only in this browser.</p>
        <div className="model-grid provider-grid" role="radiogroup" aria-label="AI provider">
          {PROVIDER_IDS.map(id => {
            const configured = !!providerCredentials(aiSettings, id).apiKey.trim()
            return (
              <button key={id} role="radio" aria-checked={aiSettings.provider === id} className={`model-card ${aiSettings.provider === id ? 'selected' : ''}`} onClick={() => chooseProvider(id)}>
                <div className="model-card-header">
                  <strong>{PROVIDERS[id].name}</strong>
                  {aiSettings.provider === id && <Check size={15} />}
                </div>
                <small>{configured ? `Key saved · ${providerCredentials(aiSettings, id).model}` : 'No key yet'}</small>
              </button>
            )
          })}
          {aiSettings.customProviders.map(custom => (
            <button key={custom.id} role="radio" aria-checked={aiSettings.provider === custom.id} className={`model-card ${aiSettings.provider === custom.id ? 'selected' : ''}`} onClick={() => chooseProvider(custom.id)}>
              <div className="model-card-header">
                <strong><Server size={13} /> {custom.name}</strong>
                {aiSettings.provider === custom.id && <Check size={15} />}
              </div>
              <small>{providerReady(aiSettings, custom.id) ? `Custom · ${custom.model}` : 'Custom · setup incomplete'}</small>
            </button>
          ))}
          <button type="button" className="model-card add-provider-card" onClick={addCustomProvider}>
            <div className="model-card-header"><strong><Plus size={14} /> Add custom provider</strong></div>
            <small>Groq, Together, Mistral, DeepSeek, Ollama, LM Studio or any compatible API</small>
          </button>
        </div>
      </div>

      {editingCustom && <CustomProviderSettings key={editingCustom.id} provider={editingCustom} onChange={updateCustomProvider} onDelete={() => deleteCustomProvider(editingCustom)} notify={notify} />}

      {editingInfo && <>
      <div className="settings-section">
        <h3><Key size={17} /> {editingInfo.name} API key</h3>
        <p>{editingInfo.note} Get a key at <a href={editingInfo.keyUrl} target="_blank" rel="noopener noreferrer">{editingInfo.keyHost} <ArrowUpRight size={12} /></a></p>
        <div className="api-key-input">
          <input
            type={showKey ? 'text' : 'password'}
            value={credentials.apiKey}
            onChange={e => updateCredentials({ apiKey: e.target.value })}
            placeholder={editingInfo.keyPlaceholder}
            aria-label={`${editingInfo.name} API key`}
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="icon-button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? 'Hide API key' : 'Show API key'}>
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            type="button"
            className="button button-outline button-sm"
            onClick={handleTestKey}
            disabled={testing || !credentials.apiKey.trim()}
          >
            {testing ? <><Loader2 size={14} className="spin" /> Testing…</> : 'Test key'}
          </button>
        </div>
        {testResult && (
          <div className={`test-result ${testResult.success ? 'test-success' : 'test-error'}`}>
            {testResult.success ? <><CheckCircle2 size={15} /> Connected to {editingInfo.name} with {credentials.model}.</> : <><AlertCircle size={15} /> {testResult.error}</>}
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3><Brain size={17} /> {editingInfo.name} model</h3>
        <p>Pick a popular model or type any model ID your key can use. Default: <code>{editingInfo.defaultModel}</code>.</p>
        <div className="model-grid">
          {editingInfo.models.map(option => (
            <button
              key={option.id}
              className={`model-card ${credentials.model === option.id ? 'selected' : ''}`}
              onClick={() => updateCredentials({ model: option.id })}
            >
              <div className="model-card-header">
                <strong>{option.name}</strong>
                {credentials.model === option.id && <Check size={15} />}
              </div>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
        <label className="field">Model ID<input value={credentials.model} onChange={e => updateCredentials({ model: e.target.value.trim() })} onBlur={e => { if (!e.target.value.trim()) updateCredentials({ model: editingInfo.defaultModel }) }} placeholder={editingInfo.defaultModel} list={`models-${editingId}`} spellCheck={false} aria-label={`${editingInfo.name} model ID`} /></label>
        <datalist id={`models-${editingId}`}>{[...editingInfo.models, ...(accountModels[editingId] || [])].map(model => <option key={model.id} value={model.id}>{model.name}</option>)}</datalist>
        <button type="button" className="button button-outline button-sm" disabled={loadingModels || (!credentials.apiKey.trim() && editingId !== 'openrouter')} onClick={loadAccountModels}>{loadingModels ? <><Loader2 size={14} className="spin" /> Loading…</> : 'Load models from my account'}</button>
      </div>
      </>}

      <div className="settings-section"><h3><Sparkles size={17} /> Image generation</h3><p>Create and edit actual image artwork with your Google (Gemini) API key, whichever chat provider you use. Image model access and quota are separate from chat.</p><label className="field">Image model<input value={aiSettings.imageModel} onChange={e => updateSetting('imageModel', e.target.value)} placeholder="auto" list="available-image-models" /></label><datalist id="available-image-models">{imageModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</datalist><small>Auto discovers an image-capable model available to your Google project. You can also enter an exact model ID.</small><button type="button" className="button button-outline button-sm" disabled={discoveringImages || !aiSettings.apiKey.trim()} onClick={async () => { setDiscoveringImages(true); setImageModelError(''); try { const models = await availableImageModels(aiSettings.apiKey); setImageModels(models); if (!models.length) setImageModelError('No image-generation models are available on this key.') } catch (e) { setImageModelError(e instanceof Error ? e.message : 'Discovery failed.') } finally { setDiscoveringImages(false) } }}>{discoveringImages ? 'Discovering...' : 'Discover image models'}</button>{imageModels.length > 0 && <p>{imageModels.map(m => m.id).join(', ')}</p>}{imageModelError && <p className="tool-error" role="alert">{imageModelError}</p>}</div>
      <div className="settings-section">
        <h3><Thermometer size={17} /> Creativity</h3>
        <p>{temperatureLocked ? 'This model manages its own creativity. Give the assistant specific style instructions below.' : 'Higher values give more varied responses; lower values give more focused responses.'}</p>
        <div className="slider-row">
          <input
            type="range"
            min={0}
            max={200}
            value={Math.round(aiSettings.temperature * 100)}
            onChange={e => updateSetting('temperature', Number(e.target.value) / 100)}
            aria-label="Temperature"
            disabled={temperatureLocked}
          />
          <span className="slider-value">{aiSettings.temperature.toFixed(2)}</span>
        </div>
        <div className="slider-labels"><span>Focused</span><span>Balanced</span><span>Creative</span></div>
      </div>

      <div className="settings-section">
        <h3><Type size={17} /> Max Output Tokens</h3>
        <p>Maximum length of AI responses. Higher values allow longer, more detailed answers.</p>
        <div className="token-input">
          <input
            type="number"
            min={256}
            max={65536}
            step={256}
            value={aiSettings.maxOutputTokens}
            onChange={e => updateSetting('maxOutputTokens', Number(e.target.value))}
            aria-label="Max output tokens"
          />
          <span>tokens</span>
        </div>
      </div>

      <div className="settings-section">
        <h3><Shield size={17} /> Safety Filter</h3>
        <p>Enable Google’s content safety filters on Gemini responses. OpenAI, Claude and OpenRouter apply their own safety policies.</p>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={aiSettings.safetyEnabled}
            onChange={e => updateSetting('safetyEnabled', e.target.checked)}
          />
          <span className="toggle-switch" />
          <span>{aiSettings.safetyEnabled ? 'Safety filters enabled' : 'Safety filters disabled'}</span>
        </label>
      </div>

      <div className="settings-section">
        <h3><MessageCircle size={17} /> System Prompt</h3>
        <p>Set your design preferences. The studio also loads SKILL.md and uses 19 validated tools for editable print motifs, image generation, typography, textures, packaging, and preview inspection.</p>
        <textarea
          className="system-prompt-input"
          value={aiSettings.systemPrompt}
          onChange={e => updateSetting('systemPrompt', e.target.value)}
          rows={8}
          placeholder="Instructions for the AI assistant…"
          aria-label="System prompt"
        />
      </div>

      <div className="settings-footer">
        <button className="button button-outline" onClick={resetSettings}>
          <RotateCcw size={15} /> Reset to defaults
        </button>
        <span className="settings-autosave"><Check size={13} /> Changes saved automatically</span>
      </div>
    </div>}
    <div className="workspace-bottom-note"><ShieldCheck size={14} /> Admin demo · all changes apply to this browser's local workspace only.</div>
  </main>{deleteId && <div className="modal-backdrop" onClick={() => setDeleteId(null)}><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-delete-heading" onClick={e => e.stopPropagation()}><span className="confirm-icon"><Trash2 size={23} /></span><h2 id="admin-delete-heading">Delete this design?</h2><p>This removes the design from the local workspace. Existing order requests will be kept. This cannot be undone.</p><div><button className="button button-outline" onClick={() => setDeleteId(null)}>Keep design</button><button className="button button-danger" onClick={() => { deleteDesign(deleteId); setDeleteId(null); notify('Design deleted from the workspace.') }}>Delete design</button></div></section></div>}</div>
}
function AdminEmpty({ icon, title, description }: { icon: string; title: string; description: string }) { return <div className="admin-empty">{icon === 'designs' ? <Box size={36} strokeWidth={1.1} /> : <PackageCheck size={36} strokeWidth={1.1} />}<h2>{title}</h2><p>{description}</p><Link className="text-arrow-link" to="/studio">Start something good <ArrowUpRight size={15} /></Link></div> }

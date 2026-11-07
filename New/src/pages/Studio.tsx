import { useCallback, useEffect, useRef, useState, lazy } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCheck,
  ChevronDown,
  Box,
  FileText,
  Paperclip,
  Sparkles,
  RotateCcw,
  Rotate3D,
  Layers3,
  Download,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ImagePlus,
  Sliders,
  Scissors,
  ShoppingBag,
  Loader2,
  Code2,
  Play,
  Terminal,
  X, Square, Undo2, Redo2, Type, Paintbrush,
  Image as ImageIcon,
} from 'lucide-react'
import { Header } from '../components/Header'
import { MinalMark } from '../components/Brand'
import { RouteLoader } from '../components/LoadingScreen'
import { SiriGlow, SiriOrb } from '../components/SiriGlow'
import { SceneStage } from '../components/SceneStage'
import { PlanEditor, downloadPlan } from '../components/PlanEditor'
import { OrderModal } from '../components/OrderModal'
import { Dieline, FlatDesignView } from '../components/Dieline'
import { useStore } from '../lib/store'
import { newDesign, uid, templates, type Design, type Template, type ToolActivity, type PreviewSettings } from '../lib/types'
import { previewKey } from '../lib/design-tools'
import { SurfaceEditor, ProductInfoEditor } from '../components/SurfaceEditor'
import { getSurface, TEXTURES } from '../lib/textures'
import { getTypography, printedText } from '../lib/typography'
import { getProductInfo } from '../lib/product-info'
import { DESIGN_TOOL_DECLARATIONS } from '../lib/design-tools'
import { TypographyEditor } from '../components/TypographyEditor'
import { ArtworkEditor } from '../components/ArtworkEditor'
import { downloadFile, readImage, safeName } from '../lib/utils'
import { isConfigured } from '../lib/ai-settings'
import { chatWithGemini } from '../lib/gemini'
import { exportToDxf } from '../lib/dxf-export'

const ProductScene = lazy(() => import('../components/ProductScene'))

const CODE_PRESETS = [
  {
    name: 'Hexagonal Box',
    category: 'Hexagonal Box',
    code: `// Hexagonal Box & Lift-Off Lid
const { w, h, d, mainMaterial, innerMaterial, openBox, isOpenTop } = context;
const radius = Math.min(w, d) / 2;

// Hexagonal base body
const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, h, 6), mainMaterial);
body.position.y = h / 2;
body.castShadow = true;
product.add(body);

// Inner hollow liner
const inner = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.94, radius * 0.94, h * 0.96, 6), innerMaterial);
inner.position.y = h / 2 + 0.02;
product.add(inner);

// Hexagonal lid
if (!isOpenTop) {
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.03, radius * 1.03, Math.max(0.12, h * 0.2), 6), mainMaterial);
  lid.position.set(0, openBox ? h + 0.55 : h + 0.05, openBox ? -d * 0.4 : 0);
  lid.rotation.x = openBox ? 0.15 : 0;
  lid.castShadow = true;
  product.add(lid);
}`
  },
  {
    name: 'Slide Drawer Box',
    category: 'Slide Drawer Box',
    code: `// Slide Drawer Box with Ribbon Pull Loop
const { w, h, d, mainMaterial, innerMaterial, handleMaterial, rounded, openBox } = context;
const thick = 0.035;
const slideOffset = openBox ? w * 0.55 : 0;

// Outer Sleeve
const sleeve = new THREE.Group();
const top = rounded(w + 0.03, thick, d + 0.03, mainMaterial, 0.01);
top.position.y = h + thick / 2;
sleeve.add(top);
const btm = rounded(w + 0.03, thick, d + 0.03, mainMaterial, 0.01);
btm.position.y = -thick / 2;
sleeve.add(btm);
const front = rounded(w + 0.03, h + thick * 2, thick, mainMaterial, 0.01);
front.position.set(0, h / 2, d / 2 + thick / 2);
sleeve.add(front);
const back = rounded(w + 0.03, h + thick * 2, thick, mainMaterial, 0.01);
back.position.set(0, h / 2, -d / 2 - thick / 2);
sleeve.add(back);
product.add(sleeve);

// Inner Drawer
const drawer = new THREE.Group();
const base = rounded(w, thick, d - 0.02, innerMaterial, 0.01);
base.position.y = thick / 2;
drawer.add(base);
for (const z of [-d / 2 + thick, d / 2 - thick]) {
  const wall = rounded(w, h * 0.88, thick, innerMaterial, 0.01);
  wall.position.set(0, h * 0.44, z);
  drawer.add(wall);
}
for (const x of [-w / 2 + thick, w / 2 - thick]) {
  const wall = rounded(thick, h * 0.88, d - thick * 2, innerMaterial, 0.01);
  wall.position.set(x, h * 0.44, 0);
  drawer.add(wall);
}
const pull = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 12, 24, Math.PI), handleMaterial);
pull.rotation.y = -Math.PI / 2;
pull.position.set(w / 2 + 0.04, h * 0.44, 0);
drawer.add(pull);

drawer.position.x = slideOffset;
product.add(drawer);`
  },
  {
    name: 'Window Display Box',
    category: 'Window Display Box',
    code: `// Window Display Box with Clear Acrylic Window
const { w, h, d, mainMaterial, innerMaterial, edgeMaterial, rounded, openBox, isOpenTop } = context;
const thick = 0.035;

// Base tray
const base = rounded(w, thick, d, edgeMaterial, 0.012);
base.position.y = thick / 2;
product.add(base);

for (const z of [-d / 2 + thick / 2, d / 2 - thick / 2]) {
  const side = rounded(w, h, thick, mainMaterial, 0.012);
  side.position.set(0, h / 2, z);
  product.add(side);
}
for (const x of [-w / 2 + thick / 2, w / 2 - thick / 2]) {
  const side = rounded(thick, h, d - thick * 2, mainMaterial, 0.012);
  side.position.set(x, h / 2, 0);
  product.add(side);
}

// Window Lid
if (!isOpenTop) {
  const lid = new THREE.Group();
  const lidFrame = rounded(w + 0.04, 0.03, d + 0.04, mainMaterial, 0.015);
  lid.add(lidFrame);
  const winMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, roughness: 0.05, transmission: 0.9 });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.65, d * 0.65), winMat);
  win.rotation.x = -Math.PI / 2;
  win.position.y = 0.02;
  lid.add(win);
  lid.position.set(0, openBox ? h + 0.6 : h + 0.04, openBox ? -d * 0.6 : 0);
  lid.rotation.x = openBox ? 0.2 : 0;
  product.add(lid);
}`
  },
  {
    name: '4-Divider Tea Box',
    category: 'Divider Box',
    code: `// 4-Compartment Divider Box
const { w, h, d, mainMaterial, innerMaterial, edgeMaterial, rounded, openBox, isOpenTop } = context;
const thick = 0.035;

const base = rounded(w, thick, d, edgeMaterial);
base.position.y = thick / 2;
product.add(base);

for (const z of [-d / 2 + thick / 2, d / 2 - thick / 2]) {
  const side = rounded(w, h, thick, mainMaterial, 0.014);
  side.position.set(0, h / 2, z);
  product.add(side);
}
for (const x of [-w / 2 + thick / 2, w / 2 - thick / 2]) {
  const side = rounded(thick, h, d - thick * 2, mainMaterial, 0.014);
  side.position.set(x, h / 2, 0);
  product.add(side);
}

// Dividers
const divH = h * 0.75;
const divX = rounded(0.018, divH, d - thick * 2.2, innerMaterial, 0.005);
divX.position.set(0, divH / 2 + thick, 0);
product.add(divX);

const divZ = rounded(w - thick * 2.2, divH, 0.018, innerMaterial, 0.005);
divZ.position.set(0, divH / 2 + thick, 0);
product.add(divZ);

if (!isOpenTop) {
  const lid = new THREE.Group();
  const lidMesh = rounded(w + 0.05, 0.12, d + 0.05, mainMaterial, 0.02);
  lid.add(lidMesh);
  lid.position.set(0, openBox ? h + 0.65 : h + 0.06, openBox ? -d * 0.65 : 0);
  lid.rotation.x = openBox ? 0.1 : 0;
  product.add(lid);
}`
  }
]

function NewStudio() {
  const { saveDesign } = useStore()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [design] = useState(() => {
    const idea = params.get('idea') || ''
    const fresh = newDesign(idea)
    return fresh
  })

  useEffect(() => {
    saveDesign(design)
    navigate(`/studio/${design.id}`, { replace: true })
  }, [design, saveDesign, navigate])

  return (
    <RouteLoader />
  )
}

export function Studio() {
  const { id } = useParams()
  const { designs } = useStore()
  if (!id) return <NewStudio />
  const existing = designs.find(item => item.id === id)
  if (!existing) {
    return (
      <>
        <Header workspace />
        <main className="not-found">
          <Box size={40} />
          <h1>This idea isn't in this browser.</h1>
          <p>Projects are stored locally. Start a new idea or open one of your saved projects.</p>
          <Link to="/projects" className="button button-dark">
            My projects <ArrowRight size={17} />
          </Link>
        </main>
      </>
    )
  }
  return <StudioWorkspace key={id} initialDesign={existing} />
}

function StudioWorkspace({ initialDesign }: { initialDesign: Design }) {
  const { saveDesign, notify, storageAvailable } = useStore()
  const [design, setDesign] = useState<Design>(initialDesign)
  const [input, setInput] = useState(initialDesign.chatStep === 0 ? initialDesign.brief : '')
  const [thinking, setThinking] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [view, setView] = useState<'3d' | '2d'>('3d')
  const [openBox, setOpenBox] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [order, setOrder] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [showSpecs, setShowSpecs] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [codeDraft, setCodeDraft] = useState(design.customCode || '')
  const [templateFilter, setTemplateFilter] = useState('All')
  const [downloadMenu, setDownloadMenu] = useState(false)
  const aiActive = isConfigured()
  const [progress, setProgress] = useState('')
  const [activeTools, setActiveTools] = useState<ToolActivity[]>([])
  const [cameraView, setCameraView] = useState<PreviewSettings['camera']>('perspective')
  const [showType, setShowType] = useState(false)
  const [showSurface, setShowSurface] = useState(false)
  const [showArtwork, setShowArtwork] = useState(false)
  const [flatMode, setFlatMode] = useState<'projection' | 'layout'>('layout')
  const [undo, setUndo] = useState<Design[]>([])
  const [redo, setRedo] = useState<Design[]>([])
  const requestRef = useRef<AbortController | null>(null)
  const previewRef = useRef<PreviewSettings>({ camera: cameraView, openBox, autoRotate })

  const endRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<HTMLDivElement>(null)

  const patch = useCallback(
    (updates: Partial<Design>) => {
      if (requestRef.current) return
      setUndo(history => [...history.slice(-19), design])
      setRedo([])
      setDesign(current => ({ ...current, ...updates, updatedAt: new Date().toISOString() }))
    },
    [design]
  )

  const closeOrder = useCallback(() => setOrder(false), [])

  useEffect(() => {
    if (!thinking) saveDesign(design)
  }, [design, saveDesign, thinking])

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [design.messages.length, thinking])

  useEffect(() => () => requestRef.current?.abort(), [])

  const restore = (direction: 'undo' | 'redo') => {
    const stack = direction === 'undo' ? undo : redo
    const snapshot = stack.at(-1)
    if (!snapshot || thinking) return
    if (direction === 'undo') { setUndo(stack.slice(0, -1)); setRedo(history => [...history, design]) }
    else { setRedo(stack.slice(0, -1)); setUndo(history => [...history, design]) }
    setDesign({ ...snapshot, messages: design.messages, updatedAt: new Date().toISOString() })
    notify(direction === 'undo' ? 'Previous design restored' : 'Change restored')
  }

  const send = async (text = input) => {
    const value = text.trim()
    if (!value || requestRef.current || uploading) return
    if (!isConfigured()) { notify('Connect your AI key in Admin → Settings to use the design assistant.', 'info'); return }
    const baseline = design
    const initialPreview = { camera: cameraView, openBox, autoRotate }
    previewRef.current = initialPreview
    const controller = new AbortController()
    requestRef.current = controller
    const currentMessages = [...design.messages, { id: uid(), role: 'user' as const, text: value }]
    setDesign({ ...design, messages: currentMessages })
    setInput('')
    setThinking(true)
    setActiveTools([])
    setShowArtwork(false); setShowSpecs(false); setShowType(false); setShowSurface(false); setShowTemplates(false); setShowCode(false)
    try {
      const history = currentMessages.filter(message => !message.error).map(message => ({ role: (message.role === 'assistant' ? 'model' : 'user') as 'user' | 'model', text: message.text, image: message.image }))
      const result = await chatWithGemini(history, baseline, {
        signal: controller.signal, preview: initialPreview, onProgress: setProgress,
        onTool: activity => setActiveTools(tools => [...tools, activity]),
        onDesign: next => setDesign(current => ({ ...next, messages: current.messages })),
        onPreview: next => { previewRef.current = next; setCameraView(next.camera); setOpenBox(next.openBox); setAutoRotate(next.autoRotate) },
        capturePreview: async next => {
          setView('3d')
          const key = previewKey(next)
          const started = performance.now()
          while (performance.now() - started < 12000) {
            controller.signal.throwIfAborted()
            const canvas = sceneRef.current?.querySelector('canvas')
            const preview = previewRef.current
            if (canvas?.dataset.designKey === key && canvas.dataset.cameraView === preview.camera && canvas.dataset.openBox === String(preview.openBox)) {
              if (canvas.dataset.labelError) throw new Error(canvas.dataset.labelError)
              // Keep vision payload modest while retaining readable printed text.
              const capture = document.createElement('canvas')
              const scale = Math.min(1, 1400 / canvas.width)
              capture.width = canvas.width * scale; capture.height = canvas.height * scale
              capture.getContext('2d')!.drawImage(canvas, 0, 0, capture.width, capture.height)
              return capture.toDataURL('image/png')
            }
            await new Promise(resolve => setTimeout(resolve, 80))
          }
          throw new Error('The 3D preview did not become ready for inspection.')
        }
      })
      if (result.tools.some(tool => tool.status === 'complete' && tool.fields?.length && tool.name !== 'set_preview')) {
        setUndo(history => [...history.slice(-19), baseline]); setRedo([])
      }
      setDesign(current => ({ ...result.design, chatStep: 5, messages: [...current.messages, { id: uid(), role: 'assistant', text: result.text, tools: result.tools }], updatedAt: new Date().toISOString() }))
    } catch (error) {
      const message = controller.signal.aborted ? 'Stopped. Your previous design has been restored.' : `${error instanceof Error ? error.message : 'AI connection failed.'} Your previous design has been restored.`
      setDesign(current => ({ ...baseline, messages: [...current.messages, { id: uid(), role: 'assistant', text: message, error: true }] }))
      setCameraView(initialPreview.camera); setOpenBox(initialPreview.openBox); setAutoRotate(initialPreview.autoRotate)
      notify(message, 'info')
    } finally {
      requestRef.current = null
      setThinking(false)
    }
  }

  const applyTemplate = (t: Template) => {
    setCodeDraft(t.customCode || '')
    patch({
      name: design.name === 'Untitled idea' ? t.name : design.name,
      category: t.category,
      structure: t.structure ?? 'standard',
      color: t.color,
      innerColor: t.innerColor,
      accentColor: t.accentColor,
      modelParts: t.modelParts || [],
      ...(!design.typography ? { typography: t.typography } : {}),
      material: t.material,
      finish: t.finish,
      dimensions: { ...t.dimensions },
      openTop: t.openTop ?? false,
      hasHandles: t.hasHandles ?? false,
      customCode: t.customCode,
      brief: design.brief || t.brief,
      notes: t.notes
    })
    setShowTemplates(false)
    notify(`Loaded ${t.name} template`)
  }

  const applyPresetCode = (preset: typeof CODE_PRESETS[0]) => {
    setCodeDraft(preset.code)
    patch({
      category: preset.category,
      customCode: preset.code
    })
    notify(`Applied ${preset.name} 3D code`)
  }

  const runCustomCode = () => {
    patch({
      customCode: codeDraft
    })
    notify('Custom 3D code compiled & rendered')
  }

  const resetToProcedural = () => {
    setCodeDraft('')
    patch({
      customCode: undefined,
      category: 'Box'
    })
    notify('Reset to built-in 3D engine')
  }

  const uploadReference = async (file: File) => {
    setUploading(true)
    try {
      const result = await readImage(file)
      patch({
        reference: result.image, palette: result.palette,
        messages: [...design.messages, { id: uid(), role: 'user', text: 'Reference image added. Use it as visual inspiration when I ask.', image: result.image }]
      })
      notify('Your reference and color palette are ready.')
    } catch (error) {
      notify(error instanceof Error ? error.message : "Couldn't read that image.", 'info')
    } finally {
      setUploading(false)
    }
  }

  const flatSvg = async () => {
    const deadline = Date.now() + 15000
    const key = JSON.stringify({ ...design, messages: undefined, updatedAt: undefined })
    while (Date.now() < deadline) {
      const svg = svgRef.current?.querySelector('svg')
      if (svg?.dataset.ready === 'true' && svg.dataset.designKey === key) {
        const copy = svg.cloneNode(true) as SVGElement
        copy.removeAttribute('class'); copy.removeAttribute('data-ready'); copy.removeAttribute('data-design-key')
        return new XMLSerializer().serializeToString(copy)
      }
      await new Promise(resolve => setTimeout(resolve, 80))
    }
    throw new Error('Artwork is still loading or the design changed. Try exporting again.')
  }

  const exportCdr = async () => {
    setDownloadMenu(false)
    notify('Generating native CorelDRAW (.cdr) dieline...')
    try {
      const res = await fetch('/api/generate-cdr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ design, svg: await flatSvg() })
      })
      if (res.ok) {
        const blob = await res.blob()
        downloadFile(blob, `${safeName(design.name)}-dieline.cdr`, 'application/x-coreldraw')
        notify('Native CorelDRAW (.cdr) dieline downloaded')
        return
      }
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || `CorelDRAW export failed (HTTP ${res.status})`)
    } catch (error) {
      notify(`${error instanceof Error ? error.message : 'CorelDRAW export failed.'} SVG includes the full artwork and can also be opened in CorelDRAW.`, 'info')
    }
  }

  const exportDxf = () => {
    try {
      const dxfBlob = exportToDxf(design)
      downloadFile(dxfBlob, `${safeName(design.name)}-dieline.dxf`, 'application/dxf')
      setDownloadMenu(false)
      notify('Dimensioned CAD geometry downloaded. Use SVG or CDR for printed artwork.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not generate .dxf file', 'info')
    }
  }

  const exportSvg = async () => {
    setDownloadMenu(false)
    try {
      downloadFile(await flatSvg(), `${safeName(design.name)}-full-design.svg`, 'image/svg+xml')
      notify('Full 2D artwork and dimensions downloaded at 1:1 millimeter scale.')
    } catch (error) { notify(error instanceof Error ? error.message : 'SVG export failed.', 'info') }
  }

  const exportFlatPng = async () => {
    setDownloadMenu(false)
    let url = ''
    try {
      const source = await flatSvg(), svg = svgRef.current!.querySelector('svg')!
      const [,, w, h] = svg.getAttribute('viewBox')!.split(' ').map(Number)
      url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }))
      const image = new Image()
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Could not render the flat artwork.')); image.src = url })
      const canvas = document.createElement('canvas'), scale = Math.min(8, 4000 / Math.max(w, h))
      canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale)
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'))
      downloadFile(blob, `${safeName(design.name)}-full-design.png`, 'image/png')
      notify('Full 2D design image downloaded.')
    } catch (error) { notify(error instanceof Error ? error.message : 'PNG export failed.', 'info') }
    finally { if (url) URL.revokeObjectURL(url) }
  }

  const exportPng = () => {
    const canvas = sceneRef.current?.querySelector('canvas')
    if (!canvas) {
      notify('Switch to 3D and wait for the preview to load.', 'info')
      return
    }
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${safeName(design.name)}-3d-preview.png`
    a.click()
    setDownloadMenu(false)
    notify('Your 3D preview is downloaded.')
  }

  // Drives the AI-cursor overlay: each completed tool call = one extra "click".
  const completedTools = activeTools.filter(tool => tool.status === 'complete').length
  const latestTool = activeTools.at(-1)?.summary

  const templateCategories = ['All', 'Bags & Retail', 'Boxes', 'Specialty']
  const filteredTemplates =
    templateFilter === 'All'
      ? templates
      : templates.filter(t => (t.tag || 'Boxes').toLowerCase().includes(templateFilter.toLowerCase()))

  return (
    <div className={`workspace-page realtime-studio sx ${thinking ? 'sx-thinking' : ''}`}>
      <Header workspace />

      {/* Slim top bar */}
      <div className="studio-topbar sx-bar">
        <div className="project-breadcrumb">
          <Link to="/projects" aria-label="Back to projects" className="sx-back"><ArrowLeft size={16} /></Link>
          <span className="project-title-live">{design.name}</span>
          <span className="sx-status">{design.status}</span>
        </div>
        <div className="sx-seg" role="tablist" aria-label="Preview mode">
          <span className="sx-seg-thumb" style={{ transform: `translateX(${view === '3d' ? 0 : 100}%)` }} />
          <button role="tab" aria-selected={view === '3d'} className={view === '3d' ? 'on' : ''} onClick={() => setView('3d')}><Box size={14} /> 3D</button>
          <button role="tab" aria-selected={view === '2d'} className={view === '2d' ? 'on' : ''} onClick={() => setView('2d')}><Layers3 size={14} /> Dieline</button>
        </div>
        <div className="sx-bar-right">
          <button className="sx-icon" aria-label="Undo design change" title="Undo" disabled={!undo.length || thinking} onClick={() => restore('undo')}><Undo2 size={15} /></button>
          <button className="sx-icon" aria-label="Redo design change" title="Redo" disabled={!redo.length || thinking} onClick={() => restore('redo')}><Redo2 size={15} /></button>
          <span className={`sx-sync ${!storageAvailable ? 'warn' : ''} ${thinking ? 'busy' : ''}`} title={storageAvailable ? 'Every change saves instantly' : 'Browser storage is full'}><i />{thinking ? 'Generating' : storageAvailable ? 'Saved' : 'Storage full'}</span>
        </div>
      </div>

      {/* Floating tool dock */}
      <nav className="sx-dock" inert={thinking} aria-label="Design tools">
        {([
          ['Type', Type, showType, () => { setShowArtwork(false); setShowType(!showType); setShowSurface(false); setShowSpecs(false); setShowCode(false); setShowTemplates(false) }],
          ['Material', Paintbrush, showSurface, () => { setShowArtwork(false); setShowSurface(!showSurface); setShowType(false); setShowSpecs(false); setShowCode(false); setShowTemplates(false) }],
          ['Artwork', ImageIcon, showArtwork, () => { setShowArtwork(!showArtwork); setShowSurface(false); setShowType(false); setShowSpecs(false); setShowCode(false); setShowTemplates(false) }],
          ['Templates', ShoppingBag, showTemplates, () => { setShowArtwork(false); setShowType(false); setShowSurface(false); setShowTemplates(!showTemplates); setShowSpecs(false); setShowCode(false) }],
          ['Specs', Sliders, showSpecs, () => { setShowArtwork(false); setShowType(false); setShowSurface(false); setShowSpecs(!showSpecs); setShowTemplates(false); setShowCode(false) }],
          ['Code', Code2, showCode, () => { setShowArtwork(false); setShowType(false); setShowSurface(false); setShowCode(!showCode); setShowSpecs(false); setShowTemplates(false) }],
        ] as const).map(([label, Icon, on, act]) => <button key={label} className={on ? 'on' : ''} onClick={act} aria-pressed={on}><Icon size={17} strokeWidth={1.7} /><span>{label}</span></button>)}
      </nav>

      <div className={`studio-layout ${!showChat ? 'chat-collapsed' : ''}`}>
        {/* Left Side: Real-time AI Chat Panel */}
        {showChat && (
          <aside className="studio-chat">
            <div className="studio-chat-header">
              <span className={`assistant-avatar ${thinking ? 'is-thinking' : ''}`}>
                <SiriOrb active={thinking} size={42} />
                <MinalMark size={20} />
              </span>
              <div>
                <h2>AI Design Partner</h2>
                <span>
                  <span className="status-dot" />{' '}
                  {thinking ? 'Working on your design' : aiActive ? `Connected · ${DESIGN_TOOL_DECLARATIONS.length} design tools` : 'AI connection needed'}
                </span>
              </div>
              <button
                className="icon-button"
                aria-label="Hide conversation"
                title="Hide conversation"
                onClick={() => setShowChat(false)}
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            <div className="conversation-date">YOUR DESIGN CONVERSATION</div>
            {!aiActive && <div className="ai-connect-notice"><strong>Connect your AI designer</strong><p>Add your Google AI key to enable design tools. You can edit all design details manually.</p><Link to="/admin?tab=settings">Open AI settings <ArrowRight size={13} /></Link></div>}

            <div className="studio-messages" ref={messagesRef} role="log" aria-label="Design conversation" aria-live="polite">
              {design.messages.map(message => (
                <motion.div
                  key={message.id}
                  className={`studio-message message-${message.role}`}
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {message.role === 'assistant' && (
                    <span className="message-avatar">
                      <MinalMark size={14} />
                    </span>
                  )}
                  <div>
                    {message.image && (
                      <img className="reference-preview" src={message.image} alt="Uploaded design reference" />
                    )}
                    <p>{message.text}</p>
                    {!!message.tools?.length && <details className="tool-history"><summary>{message.tools.length} tool actions</summary>{message.tools.map(tool => <div key={tool.id} className={tool.status === 'error' ? 'tool-error' : ''}><span>{tool.status === 'complete' ? '✓' : '!'}</span><div>{tool.summary}{!!tool.fields?.length && <small>{tool.fields.join(', ')}</small>}</div></div>)}</details>}
                    {message.error && !thinking && <button className="retry-ai" onClick={() => { const previous = design.messages.slice(0, design.messages.indexOf(message)).reverse().find(item => item.role === 'user'); if (previous) void send(previous.text) }}>Retry request <RotateCcw size={12} /></button>}
                    {message.role === 'user' && <CheckCheck size={12} className="message-tick" />}
                  </div>
                </motion.div>
              ))}

              {thinking && (
                <div className="studio-message message-assistant">
                  <span className="message-avatar">
                    <MinalMark size={14} />
                  </span>
                  <div className="harness-progress"><span className="thinking-line"><SiriOrb active size={16} /><span className="shimmer-text">{progress || 'Planning…'}</span></span>{activeTools.slice(-3).map(tool => <small key={tool.id}>{tool.status === 'complete' ? '✓' : '!'} {tool.summary}</small>)}</div>
                </div>
              )}

              {design.palette && (
                <div className="chat-palette">
                  <span>YOUR REFERENCE PALETTE</span>
                  <div>
                    {design.palette.map(color => (
                      <button
                        key={color}
                        onClick={() => patch({ color })}
                        className="color-swatch"
                        disabled={thinking}
                        aria-label={`Pick reference color ${color}`}
                        style={{ background: color }}
                      >
                        {design.color === color && <Check size={13} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Chat Compose Box */}
            <div className="chat-compose-area">
              {!thinking && (
                <div className="chat-suggestions">
                  {['Improve the typography', 'Explore a new structure', 'Review this design'].map(suggestion => (
                    <button key={suggestion} onClick={() => send(suggestion)}>
                      {suggestion}
                      <ArrowUp size={12} />
                    </button>
                  ))}
                </div>
              )}

              <form
                className={`studio-compose ${thinking ? 'is-thinking' : ''}`}
                onSubmit={e => {
                  e.preventDefault()
                  send()
                }}
              >
                <SiriGlow active={thinking} variant="ring" />
                <textarea
                  aria-label="Message minal about your product"
                  placeholder={
                    aiActive
                      ? 'Say anything: "make a hexagonal box", "remove the top", "shopping bag with handles"…'
                      : 'Connect AI in Settings, or use the design editors…'
                  }
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  maxLength={2000}
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                />
                <div>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Upload a reference image"
                    title="Upload a reference image"
                    disabled={uploading || thinking}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? <Loader2 size={18} className="spin" /> : <Paperclip size={18} />}
                  </button>
                  <span>Describe a change to update your preview</span>
                  <button
                    type={thinking ? "button" : "submit"}
                    onClick={thinking ? () => requestRef.current?.abort() : undefined}
                    className="send-button"
                    aria-label={thinking ? "Stop AI request" : "Send message"}
                    disabled={thinking ? false : !input.trim() || !aiActive || uploading}
                  >
                    {thinking ? <Square size={15} /> : <ArrowUp size={18} />}
                  </button>
                </div>
              </form>
              <input
                className="visually-hidden"
                type="file"
                ref={fileRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) void uploadReference(file)
                  e.target.value = ''
                }}
              />
              <p className="assistant-disclosure">
                <Sparkles size={10} /> AI edits through tools · completed edits can be undone
              </p>
            </div>
          </aside>
        )}

        {/* Center / Main: The 3D Scene Viewport (ALWAYS ACTIVE!) */}
        <section className="studio-main realtime-main" inert={thinking}>
          {!showChat && (
            <button className="restore-chat" onClick={() => setShowChat(true)}>
              <PanelLeftOpen size={17} /> Show conversation
            </button>
          )}

          {/* Interactive 3D Canvas / 2D Dieline */}
          <div className="design-workspace">
            <div className={`design-preview ${view === '2d' && flatMode === 'layout' ? 'flat-layout' : ''}`} ref={sceneRef}>
              <div className="design-preview-top">
                <div className="structure-pills">
                  <span className="concept-tag">{design.category.toUpperCase()}</span>
                  {design.structure && design.structure !== 'standard' && <span className="concept-tag tag-accent">{design.structure.toUpperCase()}</span>}
                  {design.openTop && <span className="concept-tag tag-accent">OPEN TOP</span>}
                  {design.hasHandles && <span className="concept-tag tag-accent">HANDLES</span>}
                  {design.customCode && <span className="concept-tag tag-accent">CUSTOM 3D CODE</span>}
                </div>

              </div>

              {view === '3d' || flatMode === 'projection' ? (
                <SceneStage thinking={thinking} interactive3d={view === '3d'} pulse={completedTools} label={latestTool}>
                  <ProductScene
                    design={design}
                    openBox={openBox}
                    autoRotate={view === '3d' && autoRotate}
                    resetKey={resetKey}
                    cameraView={view === '2d' && cameraView === 'perspective' ? 'front' : cameraView}
                    projection={view === '2d' ? 'orthographic' : 'perspective'}
                  />
                </SceneStage>
              ) : (
                <FlatDesignView design={design} />
              )}

              {view === '2d' && <div className="flat-view-tabs"><button className={flatMode === 'layout' ? 'selected' : ''} onClick={() => setFlatMode('layout')}>Full unfolded design</button><button className={flatMode === 'projection' ? 'selected' : ''} onClick={() => setFlatMode('projection')}>Front / back / top views</button></div>}
              {/* 3D Real-time Controls Bar */}
              <div className="design-preview-bottom">
                {view === '3d' || flatMode === 'projection' ? (
                  <>
                    <span>
                      <Rotate3D size={15} /> {view === '3d' ? 'Drag to orbit · Scroll to zoom' : 'True-scale orthographic projection'}
                    </span>
                    <div className="canvas-control-buttons"><select aria-label="Preview camera" value={view === '2d' && cameraView === 'perspective' ? 'front' : cameraView} onChange={e => setCameraView(e.target.value as PreviewSettings['camera'])}>{view === '3d' && <option value="perspective">Perspective</option>}<option value="front">Front</option><option value="back">Back</option><option value="top">Top</option><option value="bottom">Bottom</option></select>
                      {/* Open/Close Lid */}
                      {!design.openTop && design.category !== 'Bag' && (
                        <button className="open-box-button" onClick={() => setOpenBox(!openBox)}>
                          {openBox ? 'Close lid' : 'Open lid'}
                        </button>
                      )}

                      {/* Remove Top / Open Top toggle */}
                      <button
                        className={`pill-toggle ${design.openTop ? 'active' : ''}`}
                        onClick={() => {
                          const next = !design.openTop
                          patch({ openTop: next })
                          notify(next ? 'Top removed — open style' : 'Top cover added')
                        }}
                        title={design.openTop ? 'Add top cover' : 'Remove top (open container)'}
                      >
                        <Scissors size={14} /> {design.openTop ? 'Add Top' : 'Remove Top'}
                      </button>

                      {/* Handles toggle */}
                      <button
                        className={`pill-toggle ${design.hasHandles ? 'active' : ''}`}
                        onClick={() => {
                          const next = !design.hasHandles
                          patch({ hasHandles: next })
                          notify(next ? 'Handles attached' : 'Handles removed')
                        }}
                        title={design.hasHandles ? 'Remove handles' : 'Add bag handles'}
                      >
                        <ShoppingBag size={14} /> {design.hasHandles ? 'No Handles' : 'Add Handles'}
                      </button>

                      {/* Auto Rotate */}
                      <button
                        className={autoRotate ? 'active' : ''}
                        onClick={() => setAutoRotate(!autoRotate)}
                        title="Toggle auto rotation"
                        aria-label="Toggle auto rotation"
                      >
                        <Rotate3D size={17} />
                      </button>

                      {/* Reset Camera */}
                      <button
                        onClick={() => { setCameraView('perspective'); setResetKey(key => key + 1) }}
                        title="Reset view"
                        aria-label="Reset 3D view"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <span>Millimeter dimensions · Pink cut / cyan fold · Full artwork in SVG & CDR</span>
                )}
              </div>
            </div>

            {/* Quick Specs & Color Chips Strip */}
            <div className="design-spec-strip">
              <span className="spec-color-chip">
                <i style={{ background: design.color }} />
                {design.color.toUpperCase()}
              </span>
              <span>{design.material}</span>
              <span>{design.finish} finish</span>
              <span>
                {design.dimensions.length} × {design.dimensions.width} × {design.dimensions.height} mm
              </span>
              <span>{design.quantity} units</span>
            </div>

            <details className="design-detail-panel"><summary>Design details & product information</summary><dl><div><dt>Print</dt><dd>{printedText(design)}</dd></div><div><dt>Typeface</dt><dd>{getTypography(design).fontFamily} · {getTypography(design).fontWeight}</dd></div><div><dt>Surface</dt><dd>{TEXTURES.find(texture => texture.id === getSurface(design).texture)?.name || 'Smooth'} · {getSurface(design).scale}×</dd></div><div><dt>Printed artwork</dt><dd>{design.artwork?.enabled ? `${design.artwork.name || 'Custom print'}; ${design.artwork.layers?.length || 0} motifs; ${design.artwork.tileSize || 80} mm repeat${design.artwork.image ? '; image artwork included' : ''}` : 'None'}</dd></div><div><dt>Structure</dt><dd>{design.structure || 'standard'} · {design.openTop ? 'No lid' : 'With lid'} · {design.hasHandles ? 'Rope handles' : 'No handles'}</dd></div><div><dt>Inside / accent</dt><dd>{design.innerColor || 'Coordinated lining'} / {design.accentColor || 'Coordinated accent'}</dd></div><div><dt>Accessories</dt><dd>{design.modelParts?.map(part => part.name).join(', ') || 'None'}</dd></div>{Object.entries(getProductInfo(design)).filter(([key, value]) => typeof value === 'string' && value && key !== 'placement').map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl><button className="button button-outline button-sm" onClick={() => setShowSurface(true)}>Edit textures & information</button></details>
            {/* Bottom Actions */}
            <div className="design-bottom-actions">
              <div className="download-container">
                <button
                  className="button button-outline"
                  onClick={() => setDownloadMenu(!downloadMenu)}
                  aria-expanded={downloadMenu}
                >
                  <Download size={16} /> Export <ChevronDown size={15} />
                </button>
                {downloadMenu && (
                  <div className="download-menu">
                    <button onClick={exportCdr}>
                      <Layers3 size={15} /> CorelDRAW Dieline (.cdr)
                    </button>
                    <button onClick={exportDxf}>
                      <FileText size={15} /> AutoCAD / Laser Die (.dxf)
                    </button>
                    <button onClick={exportSvg}>
                      <Layers3 size={15} /> Full design & dimensions (.svg)
                    </button>
                    <button onClick={exportFlatPng}><ImagePlus size={15} /> Full 2D design image (.png)</button>
                    <button onClick={() => { downloadFile(JSON.stringify(design, null, 2), `${safeName(design.name)}-design.json`, 'application/json'); setDownloadMenu(false) }}><FileText size={15} /> Editable project backup (.json)</button>
                    <button
                      onClick={() => {
                        downloadPlan(design)
                        setDownloadMenu(false)
                      }}
                    >
                      <FileText size={15} /> Product plan (.txt)
                    </button>
                    <button onClick={exportPng}>
                      <ImagePlus size={15} /> 3D render screenshot (.png)
                    </button>
                  </div>
                )}
              </div>

              <button className="button button-lime" onClick={() => setOrder(true)}>
                <PackageCheck size={17} /> Order this design <ArrowUpRightIcon />
              </button>
            </div>
            <p className="design-disclaimer">
              3D concept preview · Print dimensions and structure need manufacturer review.
            </p>
            <div ref={svgRef} className="export-dieline">
              <Dieline design={design} />
            </div>
          </div>

          <AnimatePresence>{showArtwork && <motion.div className="specs-drawer print-drawer" initial={{ opacity: 0, x: 280 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 280 }}><div className="specs-drawer-header"><h3>Print designs & images</h3><button className="icon-button" aria-label="Close print designs" onClick={() => setShowArtwork(false)}><X size={18} /></button></div><div className="specs-drawer-content"><ArtworkEditor design={design} onChange={patch} /></div></motion.div>}</AnimatePresence>
          <AnimatePresence>{showType && <motion.div className="specs-drawer" initial={{ opacity: 0, x: 280 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 280 }}><div className="specs-drawer-header"><h3>Typography & branding</h3><button className="icon-button" aria-label="Close typography" onClick={() => setShowType(false)}><X size={18} /></button></div><div className="specs-drawer-content"><TypographyEditor design={design} onChange={patch} /></div></motion.div>}</AnimatePresence>
          <AnimatePresence>{showSurface && <motion.div className="specs-drawer" initial={{ opacity: 0, x: 280 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 280 }}><div className="specs-drawer-header"><h3>Textures & product information</h3><button className="icon-button" aria-label="Close textures" onClick={() => setShowSurface(false)}><X size={18} /></button></div><div className="specs-drawer-content"><SurfaceEditor design={design} onChange={patch} /><ProductInfoEditor design={design} onChange={patch} /></div></motion.div>}</AnimatePresence>
          {/* Slide-over Specs Editor Drawer */}
          <AnimatePresence>
            {showSpecs && (
              <motion.div
                className="specs-drawer"
                initial={{ opacity: 0, x: 280 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 280 }}
                transition={{ duration: 0.25 }}
              >
                <div className="specs-drawer-header">
                  <h3>Edit Specifications</h3>
                  <button className="icon-button" onClick={() => setShowSpecs(false)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="specs-drawer-content">
                  <PlanEditor
                    design={design}
                    onChange={patch}
                    onGenerate={() => {
                      setShowSpecs(false)
                      notify('Specifications updated.')
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slide-over 3D Code Inspector & Live Editor */}
          <AnimatePresence>
            {showCode && (
              <motion.div
                className="code-drawer"
                initial={{ opacity: 0, x: 340 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 340 }}
                transition={{ duration: 0.25 }}
              >
                <div className="code-drawer-header">
                  <div>
                    <span className="eyebrow"><Terminal size={12} /> THREE.JS SCENE BUILDER</span>
                    <h3>3D Geometry Code</h3>
                  </div>
                  <button className="icon-button" onClick={() => setShowCode(false)}>
                    <X size={18} />
                  </button>
                </div>

                <div className="code-drawer-presets">
                  <span>Quick 3D Presets:</span>
                  <div className="preset-chips">
                    {CODE_PRESETS.map(p => (
                      <button
                        key={p.name}
                        className="preset-chip"
                        onClick={() => applyPresetCode(p)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="code-drawer-content">
                  <textarea
                    className="code-editor-textarea"
                    value={codeDraft}
                    onChange={e => setCodeDraft(e.target.value)}
                    placeholder="// Write custom Three.js code to build any 3D box or packaging structure&#10;// Example:&#10;const { w, h, d, mainMaterial } = context;&#10;const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mainMaterial);&#10;mesh.position.y = h / 2;&#10;product.add(mesh);"
                    spellCheck={false}
                  />
                </div>

                <div className="code-drawer-footer">
                  <button className="button button-outline button-sm" onClick={resetToProcedural}>
                    Reset to Standard
                  </button>
                  <button className="button button-lime button-sm" onClick={runCustomCode}>
                    <Play size={14} /> Run 3D Code
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Packaging Templates Modal / Drawer */}
          <AnimatePresence>
            {showTemplates && (
              <div className="modal-backdrop" onClick={() => setShowTemplates(false)}>
                <motion.div
                  className="templates-modal"
                  role="dialog"
                  aria-modal="true"
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="templates-modal-header">
                    <div>
                      <span className="eyebrow">PACKAGING TEMPLATES LIBRARY</span>
                      <h2>Choose a Starting Template</h2>
                      <p>Instant 3D structures ready to customize with AI.</p>
                    </div>
                    <button className="icon-button" onClick={() => setShowTemplates(false)}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="templates-filter-bar">
                    {templateCategories.map(cat => (
                      <button
                        key={cat}
                        className={`filter-btn ${templateFilter === cat ? 'active' : ''}`}
                        onClick={() => setTemplateFilter(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="templates-grid-modal">
                    {filteredTemplates.map(t => (
                      <button
                        key={t.id}
                        className="template-card"
                        onClick={() => applyTemplate(t)}
                      >
                        <div className="template-card-icon">
                          {t.icon === 'bag' ? <ShoppingBag size={20} /> : t.icon === 'canister' ? <Layers3 size={20} /> : <Box size={20} />}
                        </div>
                        <div className="template-card-info">
                          <strong>{t.name}</strong>
                          <span className="template-card-dims">
                            {t.dimensions.length} × {t.dimensions.width} × {t.dimensions.height} mm
                          </span>
                          <p>{t.description}</p>
                          <div className="template-card-tags">
                            <span className="badge">{t.category}</span>
                            {t.openTop && <span className="badge badge-subtle">Open Top</span>}
                            {t.hasHandles && <span className="badge badge-subtle">Handles</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {order && <OrderModal design={design} onClose={closeOrder} />}
    </div>
  )
}

function ArrowUpRightIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 18 18 6M6 6h12v12" />
    </svg>
  )
}

import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react'
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
  X, Square, Undo2, Redo2, Type, Paintbrush, WandSparkles,
  Image as ImageIcon,
} from 'lucide-react'
import { Header } from '../components/Header'
import { MinalMark } from '../components/Brand'
import { BlankProject } from '../components/BlankProject'
import { BuildView, type BuildPhase, type Shot } from '../components/BuildView'
import { RouteLoader } from '../components/LoadingScreen'
import { SiriOrb } from '../components/SiriGlow'
import { SceneStage } from '../components/SceneStage'
import { PlanEditor, downloadPlan } from '../components/PlanEditor'
import { OrderModal } from '../components/OrderModal'
import { Dieline, FlatDesignView } from '../components/Dieline'
import { useStore } from '../lib/store'
import { newDesign, uid, type Design, type Template, type ToolActivity, type PreviewSettings } from '../lib/types'
import { previewKey } from '../lib/design-tools'
import { getSurface, TEXTURES } from '../lib/textures'
import { getTypography, printedText } from '../lib/typography'
import { getProductInfo } from '../lib/product-info'
import { DESIGN_TOOL_DECLARATIONS } from '../lib/design-tools'
import { TypographyEditor } from '../components/TypographyEditor'
import { downloadFile, readImage, safeName } from '../lib/utils'
import { isConfigured, loadSettings, PROVIDERS } from '../lib/ai-settings'
import { chatWithAI } from '../lib/gemini'
import { changeSummary } from '../lib/ai/labels'
import { useFrameThrottle } from '../lib/use-frame-throttle'
import { watermarkedShot } from '../lib/screenshots'

const ProductScene = lazy(() => import('../components/ProductScene'))
const TemplateLibrary = lazy(() => import('../components/TemplateLibrary'))
// Drawers load on first open: texture generators, print editor and image generation stay out of the Studio chunk.
const SurfaceEditor = lazy(() => import('../components/SurfaceEditor').then(m => ({ default: m.SurfaceEditor })))
const ProductInfoEditor = lazy(() => import('../components/SurfaceEditor').then(m => ({ default: m.ProductInfoEditor })))
const ArtworkEditor = lazy(() => import('../components/ArtworkEditor').then(m => ({ default: m.ArtworkEditor })))

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
    navigate(`/studio/${design.id}${params.get('magic') === '1' && design.brief ? '?magic=1' : ''}`, { replace: true })
  }, [design, saveDesign, navigate, params])

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
  const [started, setStarted] = useState(false)
  const [build, setBuild] = useState<'off' | BuildPhase>('off')
  const [shots, setShots] = useState<Shot[]>([])
  const [buildPrompt, setBuildPrompt] = useState('')
  const [buildAgent, setBuildAgent] = useState(false)
  const buildRef = useRef(false)
  useEffect(() => { buildRef.current = build !== 'off' }, [build])
  const sawThinking = useRef(false)
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
  const [downloadMenu, setDownloadMenu] = useState(false)
  const aiActive = isConfigured()
  const providerName = aiActive ? PROVIDERS[loadSettings().provider].name : ''
  const [progress, setProgress] = useState('')
  const [streamText, setStreamText] = useState('')
  /** Drives the AI-cursor overlay: each completed tool call = one extra "click". */
  const [toolPulse, setToolPulse] = useState(0)
  const [activeTools, setActiveTools] = useState<ToolActivity[]>([])
  const [lightbox, setLightbox] = useState<{ label: string; image: string } | null>(null)
  const [magicMode, setMagicMode] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [cameraView, setCameraView] = useState<PreviewSettings['camera']>('perspective')
  const [showType, setShowType] = useState(false)
  const [showSurface, setShowSurface] = useState(false)
  const [showArtwork, setShowArtwork] = useState(false)
  const [flatMode, setFlatMode] = useState<'projection' | 'layout'>('layout')
  const [undo, setUndo] = useState<Design[]>([])
  const [redo, setRedo] = useState<Design[]>([])
  const requestRef = useRef<AbortController | null>(null)
  /** The running request, so a new message can cancel it and wait for it to settle. */
  const inflightRef = useRef<Promise<void> | null>(null)
  /** Design before the running request; a superseding request starts from it. */
  const baselineRef = useRef<Design | null>(null)
  const supersededRef = useRef(false)
  const magicStartedRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Streaming text and live design edits arrive in bursts; apply at most once per frame.
  const pushStreamText = useFrameThrottle(setStreamText)
  const pushDesign = useFrameThrottle((next: Design) => setDesign(current => ({ ...next, messages: current.messages })))
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

  /** Waits until the live 3D canvas shows exactly this design, camera and lid state. */
  const waitForCanvas = async (next: Design, signal: AbortSignal, relaxed = false) => {
    pushDesign.flush()
    setView('3d')
    const key = previewKey(next)
    const started = performance.now()
    while (performance.now() - started < 12000) {
      signal.throwIfAborted()
      const canvas = sceneRef.current?.querySelector('canvas')
      const preview = previewRef.current
      // Relaxed mode (screenshots) also accepts a frame whose labels are still loading after a short grace period.
      const grace = relaxed && performance.now() - started > 2500
      const keyReady = canvas?.dataset.designKey === key || grace
      const lidReady = canvas?.dataset.openBox === String(preview.openBox) || (grace && canvas?.dataset.openBox === undefined) || (relaxed && performance.now() - started > 6000) || (relaxed && performance.now() - started > 6000)
      if (canvas && keyReady && lidReady && canvas.dataset.cameraView === preview.camera) {
        if (canvas.dataset.labelError) throw new Error(canvas.dataset.labelError)
        // Let one more frame land so the drawing buffer holds the settled image.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        return canvas
      }
      await new Promise(resolve => setTimeout(resolve, 80))
    }
    throw new Error('The 3D preview did not become ready for inspection.')
  }

  /** Two watermarked screenshots of the finished design (front three-quarter and back), then the user's view is restored. */
  const captureChatShots = async (next: Design, signal: AbortSignal) => {
    const original = { ...previewRef.current }
    const shots: { label: string; image: string }[] = []
    setProgress('Capturing previews…')
    try {
      for (const [camera, label] of [['perspective', 'Front three-quarter'], ['back', 'Back']] as const) {
        previewRef.current = { ...previewRef.current, camera, autoRotate: false }
        setCameraView(camera); setAutoRotate(false)
        const canvas = await waitForCanvas(next, signal, true)
        shots.push({ label, image: watermarkedShot(canvas) })
      }
    } catch (error) {
      console.debug('[minal-ai] preview capture skipped', error)
    } finally {
      previewRef.current = original
      setCameraView(original.camera); setOpenBox(original.openBox); setAutoRotate(original.autoRotate)
    }
    return shots
  }

  const send = async (text = input, mode: 'chat' | 'magic' = 'chat') => {
    const value = text.trim()
    if (!value || uploading) return
    if (!isConfigured()) { notify('Connect your AI key in Admin → Settings to use the design assistant.', 'info'); return }
    // A new message replaces the running request: cancel it, restore its starting design, then continue from there.
    const superseding = !!requestRef.current
    if (superseding) {
      supersededRef.current = true
      requestRef.current?.abort()
      await inflightRef.current?.catch(() => undefined)
      supersededRef.current = false
    }
    const baseline = superseding && baselineRef.current ? baselineRef.current : design
    baselineRef.current = baseline
    const initialPreview = { camera: cameraView, openBox, autoRotate }
    previewRef.current = initialPreview
    const controller = new AbortController()
    requestRef.current = controller
    const userMessage = { id: uid(), role: 'user' as const, text: value, ...(mode === 'magic' ? { magic: true } : {}) }
    const currentMessages: Design['messages'] = [...design.messages, userMessage]
    setDesign(current => ({ ...(superseding ? { ...baseline, messages: current.messages } : current), messages: [...current.messages, userMessage] }))
    setInput('')
    setMagicMode(false)
    setThinking(true)
    setProgress(mode === 'magic' ? 'Reading your idea…' : 'Thinking…')
    setStreamText('')
    setToolPulse(0)
    setActiveTools([])
    setShowArtwork(false); setShowSpecs(false); setShowType(false); setShowSurface(false); setShowTemplates(false); setShowCode(false)
    const run = (async () => {
      try {
        const history = currentMessages.filter(message => !message.error).map(message => ({ role: (message.role === 'assistant' ? 'model' : 'user') as 'user' | 'model', text: message.text, image: message.image }))
        const result = await chatWithAI(history, baseline, {
          signal: controller.signal, preview: initialPreview, mode,
          onProgress: setProgress,
          onTool: activity => { setActiveTools(tools => [...tools, activity]); if (activity.status === 'complete') setToolPulse(count => count + 1) },
          onText: pushStreamText.push,
          onDesign: pushDesign.push,
          onPreview: next => { previewRef.current = next; setCameraView(next.camera); setOpenBox(next.openBox); setAutoRotate(next.autoRotate) },
          capturePreview: async next => {
            const canvas = await waitForCanvas(next, controller.signal)
            // Keep vision payload modest while retaining readable printed text.
            const capture = document.createElement('canvas')
            const scale = Math.min(1, 1400 / canvas.width)
            capture.width = canvas.width * scale; capture.height = canvas.height * scale
            capture.getContext('2d')!.drawImage(canvas, 0, 0, capture.width, capture.height)
            return capture.toDataURL('image/png')
          }
        })
        pushDesign.cancel(); pushStreamText.cancel()
        if (result.tools.some(tool => tool.status === 'complete' && tool.fields?.length && tool.name !== 'set_preview')) {
          setUndo(history => [...history.slice(-19), baseline]); setRedo([])
        }
        const summary = changeSummary(result.tools, mode === 'magic' ? 'Built' : 'Edited')
        const replyId = uid()
        setDesign(current => ({ ...result.design, chatStep: 5, messages: [...current.messages, { id: replyId, role: 'assistant', text: result.text, tools: result.tools, ...(summary ? { summary } : {}) }], updatedAt: new Date().toISOString() }))
        // From here the edits are final: a superseding message starts from this design, not the old baseline.
        baselineRef.current = result.design
        if (summary && !buildRef.current) {
          const shots = await captureChatShots(result.design, controller.signal)
          if (shots.length) setDesign(current => ({
            ...current,
            // Screenshots are kept on the two latest replies only, to keep browser storage small.
            messages: current.messages.map(message => message.id === replyId ? { ...message, shots } : message).map((message, index, all) => message.shots && all.slice(index + 1).filter(later => later.shots).length >= 2 ? { ...message, shots: undefined } : message),
          }))
        }
      } catch (error) {
        pushDesign.cancel(); pushStreamText.cancel()
        if (supersededRef.current && controller.signal.aborted) {
          // Replaced by a newer message: quietly drop this request's partial edits.
          supersededRef.current = false
          setDesign(current => ({ ...baseline, messages: current.messages }))
          return
        }
        console.debug('[minal-ai] request failed', error)
        const message = controller.signal.aborted ? 'Stopped. Your previous design has been restored.' : `${error instanceof Error ? error.message : 'AI connection failed.'} Your previous design has been restored.`
        setDesign(current => ({ ...baseline, messages: [...current.messages, { id: uid(), role: 'assistant', text: message, error: true }] }))
        setCameraView(initialPreview.camera); setOpenBox(initialPreview.openBox); setAutoRotate(initialPreview.autoRotate)
        notify(message, 'info')
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null
          inflightRef.current = null
          setThinking(false)
          setStreamText('')
          setProgress('')
        }
      }
    })()
    inflightRef.current = run
    await run
  }

  const magicBuild = (sentence = input) => {
    if (!sentence.trim()) { setMagicMode(true); textareaRef.current?.focus(); return }
    void send(sentence, 'magic')
  }

  // Magic Build started from Home (?magic=1) runs once the studio has opened.
  useEffect(() => {
    if (searchParams.get('magic') !== '1' || magicStartedRef.current) return
    const timer = setTimeout(() => {
      magicStartedRef.current = true
      setSearchParams({}, { replace: true })
      const brief = design.brief.trim()
      if (!brief) return
      if (!isConfigured()) { setMagicMode(true); notify('Connect your AI key in Admin → Settings to use Magic Build.', 'info'); return }
      setStarted(true); startBuild(brief, true)
    }, 0)
    return () => clearTimeout(timer)
    // Runs only when the magic flag appears; `send` reads the latest state itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const applyLibrary = (updates: Partial<Design>, label: string, t?: Template) => {
    if (t) {
      setCodeDraft(t.customCode || '')
      patch({ ...updates, name: /^untitled (idea|project)$/i.test(design.name) ? t.name : design.name, customCode: t.customCode, brief: design.brief || t.brief })
    } else patch(updates)
    setShowTemplates(false)
    notify(label)
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

  // The hidden export dieline is mounted only while an export runs, so normal editing never pays for
  // re-rendering every printed panel to PNG in the background.
  const [exportMount, setExportMount] = useState(false)
  const flatSvg = async () => {
    setExportMount(true)
    const deadline = Date.now() + 15000
    const key = JSON.stringify({ ...design, messages: undefined, updatedAt: undefined })
    while (Date.now() < deadline) {
      const svg = svgRef.current?.querySelector('svg')
      if (svg?.dataset.ready === 'true' && svg.dataset.designKey === key) {
        const copy = svg.cloneNode(true) as SVGElement
        copy.removeAttribute('class'); copy.removeAttribute('data-ready'); copy.removeAttribute('data-design-key')
        return copy
      }
      await new Promise(resolve => setTimeout(resolve, 80))
    }
    throw new Error('Artwork is still loading or the design changed. Try exporting again.')
  }
  const serialize = (svg: SVGElement) => new XMLSerializer().serializeToString(svg)
  /** Rasterises the on-screen sheet at a print resolution (dpi), optionally without non-printing groups. */
  const rasterizeFlat = async (dpi: number, maxSide: number, hide: string[] = []) => {
    const svg = await flatSvg()
    for (const id of hide) svg.querySelector(`#${id}`)?.remove()
    const [,, w, h] = svg.getAttribute('viewBox')!.split(' ').map(Number)
    const url = URL.createObjectURL(new Blob([serialize(svg)], { type: 'image/svg+xml' }))
    try {
      const image = new Image()
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Could not render the flat artwork.')); image.src = url })
      const scale = Math.min(dpi / 25.4, maxSide / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      return { canvas, dpi: Math.round(scale * 25.4) }
    } finally { URL.revokeObjectURL(url) }
  }
  const editableSvg = async () => {
    const { buildEditableSvg } = await import('../lib/vector-export')
    return buildEditableSvg(design)
  }

  const exportCdr = async () => {
    setDownloadMenu(false)
    notify('Building the editable CorelDRAW artwork…')
    let result: Awaited<ReturnType<typeof editableSvg>> | undefined
    try {
      result = await editableSvg()
      const res = await fetch('/api/generate-cdr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ design: { name: design.name }, svg: result.svg }) })
      if (res.ok) {
        downloadFile(await res.blob(), `${safeName(design.name)}-editable.cdr`, 'application/x-coreldraw')
        notify('Native CorelDRAW (.cdr) downloaded: live text, named layers and vector motifs.')
        return
      }
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || `CorelDRAW conversion unavailable (HTTP ${res.status}).`)
    } catch (error) {
      if (!result) { notify(error instanceof Error ? error.message : 'CorelDRAW export failed.', 'info'); return }
      const { buildCorelPackage } = await import('../lib/cdr-export')
      downloadFile(buildCorelPackage(design, result), `${safeName(design.name)}-coreldraw-package.zip`, 'application/zip')
      notify(`${error instanceof Error ? error.message : 'Native .cdr conversion is unavailable here.'} Downloaded the CorelDRAW package instead: an editable layered SVG (live text, vector motifs) plus CMYK palette that CorelDRAW opens directly.`, 'info')
    } finally { setExportMount(false) }
  }

  const exportDxf = async () => {
    try {
      const { exportToDxf } = await import('../lib/dxf-export')
      downloadFile(exportToDxf(design), `${safeName(design.name)}-dieline.dxf`, 'application/dxf')
      setDownloadMenu(false)
      notify('Dimensioned CAD geometry downloaded (cut, crease, perforation, dimensions).')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not generate .dxf file', 'info')
    }
  }

  const exportSvg = async () => {
    setDownloadMenu(false)
    try {
      const result = await editableSvg()
      downloadFile(result.svg, `${safeName(design.name)}-editable.svg`, 'image/svg+xml')
      notify(`Editable SVG downloaded: ${result.stats.texts} live text objects, ${result.stats.motifs} vector motifs, ${result.stats.layers.length} named layers at 1:1 mm.`)
    } catch (error) { notify(error instanceof Error ? error.message : 'SVG export failed.', 'info') }
  }

  const exportFlatPng = async () => {
    setDownloadMenu(false)
    try {
      const { canvas, dpi } = await rasterizeFlat(300, 8000)
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'))
      downloadFile(blob, `${safeName(design.name)}-full-design-${dpi}dpi.png`, 'image/png')
      notify(`Full 2D design image downloaded at ${dpi} dpi.`)
    } catch (error) { notify(error instanceof Error ? error.message : 'PNG export failed.', 'info') }
    finally { setExportMount(false) }
  }

  const exportPdf = async () => {
    setDownloadMenu(false)
    notify('Rendering the 300 dpi print proof…')
    try {
      // Artwork (incl. bleed) is raster; die lines, marks and dimensions are re-drawn as CMYK vectors on PDF layers.
      const { canvas } = await rasterizeFlat(300, 9000, ['Dimensions', 'Marks', 'SafeZone', 'DieCut', 'Crease', 'Perforation', 'Glue'])
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PDF render failed.')), 'image/jpeg', .92))
      const { exportPrintPdf } = await import('../lib/pdf-export')
      const pdf = await exportPrintPdf(design, new Uint8Array(await blob.arrayBuffer()), { width: canvas.width, height: canvas.height })
      downloadFile(pdf, `${safeName(design.name)}-print-proof.pdf`, 'application/pdf')
      notify('Print-proof PDF downloaded: 300 dpi artwork with vector cut, crease and marks on separate layers.')
    } catch (error) { notify(error instanceof Error ? error.message : 'PDF export failed.', 'info') }
    finally { setExportMount(false) }
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


  const startBuild = (text: string, agent = false) => {
    setBuildPrompt(text); setBuildAgent(agent); setShots([]); setView('3d'); setBuild('building'); buildRef.current = true; sawThinking.current = false
    void send(text, agent ? 'magic' : 'chat')
  }
  const captureShots = async (): Promise<Shot[]> => {
    const views: [PreviewSettings['camera'], string][] = [['perspective', 'Hero'], ['front', 'Front'], ['top', 'Top'], ['back', 'Back']]
    const out: Shot[] = []
    for (const [v, label] of views) {
      setCameraView(v)
      const t0 = performance.now()
      while (performance.now() - t0 < 5000) {
        const c = sceneRef.current?.querySelector('canvas')
        if (c?.dataset.cameraView === v && c.dataset.designKey) break
        await new Promise(r => setTimeout(r, 80))
      }
      await new Promise(r => setTimeout(r, 700))
      const c = sceneRef.current?.querySelector('canvas')
      if (!c || !c.width) continue
      const cap = document.createElement('canvas'); const k = Math.min(1, 1600 / c.width)
      cap.width = c.width * k; cap.height = c.height * k
      const cx = cap.getContext('2d')!
      cx.drawImage(c, 0, 0, cap.width, cap.height)
      // crop to the product (canvas is transparent around it), with breathing room
      const { data, width: W, height: H } = cx.getImageData(0, 0, cap.width, cap.height)
      let x0 = W, y0 = H, x1 = 0, y1 = 0
      const bg = [data[0], data[1], data[2]], bgA = data[3]
      for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4; const d = Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]); if (data[i + 3] < 160 || (bgA > 200 && d < 30)) continue; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      let src = cap.toDataURL('image/png')
      if (x1 > x0 && y1 > y0) {
        const pad = Math.round(Math.max(x1 - x0, y1 - y0) * .16)
        x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W, x1 + pad); y1 = Math.min(H, y1 + pad)
        const crop = document.createElement('canvas'); crop.width = x1 - x0; crop.height = y1 - y0
        crop.getContext('2d')!.drawImage(cap, x0, y0, crop.width, crop.height, 0, 0, crop.width, crop.height)
        src = crop.toDataURL('image/png')
      }
      out.push({ view: v, label, src })
    }
    setCameraView('perspective')
    return out
  }
  useEffect(() => {
    if (build !== 'building') return
    if (thinking) { sawThinking.current = true; return }
    if (!sawThinking.current) return
    sawThinking.current = false
    const last = design.messages[design.messages.length - 1]
    if (last?.error) { setBuild('error'); return }
    // Fallback naming: if the AI left the project untitled, name it from the prompt.
    if (/^untitled (idea|project)$/i.test(design.name.trim()) && buildPrompt.trim()) {
      const words: string[] = buildPrompt.replace(/^(an?|the|make|create|design|build)\s+/i, '').replace(/[^\p{L}\p{N}\s&'-]/gu, '').split(/\s+/).filter(Boolean)
      const stop = words.findIndex((w, i) => i > 0 && /^(for|with|in|of|that|to|and|from)$/i.test(w)); if (stop > 0) words.length = stop; words.length = Math.min(words.length, 4)
      if (words.length) patch({ name: words.map(w => w[0].toUpperCase() + w.slice(1)).join(' ') })
    }
    setBuild('shooting')
    void captureShots().then(list => { setShots(list); setBuild(list.length ? 'gallery' : 'off') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking, build])
  const lastError = [...design.messages].reverse().find(m => m.role === 'assistant')?.text

  const isBlank = !started && !thinking && !design.messages.some(m => m.role === 'user')
  if (isBlank) return (
    <BlankProject
      name={design.name === 'Untitled idea' ? 'Untitled project' : design.name}
      onRename={name => patch({ name })}
      value={input}
      onChange={setInput}
      onSkip={() => setStarted(true)}
      onSubmit={(text, agent) => { setStarted(true); if (!aiActive) { void send(text); return } startBuild(text, agent) }}
    />
  )

  return (
    <div className={`workspace-page realtime-studio sx ${thinking ? 'sx-thinking' : ''} ${build !== 'off' ? 'sx-under' : 'sx-enter'}`}>
      <AnimatePresence>{build !== 'off' && (
        <BuildView key="bv" phase={build} name={design.name === 'Untitled idea' ? 'Untitled project' : design.name} prompt={buildPrompt} progress={progress} tools={activeTools} shots={shots}
          error={lastError} sceneRef={sceneRef} value={input} onChange={setInput}
          onSend={text => startBuild(text)} onStop={() => requestRef.current?.abort()} onPreview={() => setBuild('off')} onRetry={() => startBuild(buildPrompt, buildAgent)} />
      )}</AnimatePresence>
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
            <div className="studio-chat-header sx-chat-head">
              <span className={`sx-chat-mark ${thinking ? 'busy' : ''}`}><MinalMark size={15} /></span>
              <div className="sx-chat-id">
                <h2 title={aiActive ? providerName : undefined}>minal</h2>
                <span className={aiActive ? 'ok' : 'off'}>{thinking ? 'designing…' : aiActive ? 'online' : 'offline'}</span>
              </div>
              <button className="sx-icon" aria-label="Hide conversation" title="Hide conversation" onClick={() => setShowChat(false)}><PanelLeftClose size={16} /></button>
            </div>

            {design.messages.length <= 1 && !thinking && (
              <div className="sx-empty">
                <h3>What are we<br /><em>making?</em></h3>
                <p>Describe it in a sentence. I'll plan the structure, board and finish, then build it in 3D.</p>
                <div className="sx-ideas">
                  {['A rigid gift box for a silver spoon', 'A kraft mailer for candles', 'A tall tea canister, matte navy'].map(idea => (
                    <button key={idea} onClick={() => aiActive ? send(idea) : setInput(idea)}><span>{idea}</span><ArrowUp size={14} /></button>
                  ))}
                </div>
              </div>
            )}
            {!aiActive && <div className="ai-connect-notice"><strong>Connect your AI designer</strong><p>Add a Google Gemini, OpenAI, Claude or OpenRouter key to turn on the design tools. You can still edit everything by hand.</p><Link to="/admin?tab=settings">Open AI settings <ArrowRight size={13} /></Link></div>}

            <div className={`studio-messages ${design.messages.length <= 1 && !thinking ? 'sx-hide' : ''}`} ref={messagesRef} role="log" aria-label="Design conversation" aria-live="polite">
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
                    {message.magic && <span className="magic-tag"><WandSparkles size={11} /> Magic Build</span>}
                    {message.text && <p>{message.text}</p>}
                    {message.role === 'assistant' && !message.error && (() => { const summary = message.summary || changeSummary(message.tools); return summary ? <span className="change-summary"><Check size={11} /> {summary}</span> : null })()}
                    {!!message.shots?.length && <div className="design-shots">{message.shots.map(shot => <button key={shot.label} type="button" onClick={() => setLightbox(shot)} aria-label={`Open ${shot.label.toLowerCase()} view larger`}><img src={shot.image} alt={`${design.name} — ${shot.label.toLowerCase()} view`} loading="lazy" /><span>{shot.label}</span></button>)}</div>}
                    {message.error && !thinking && <button className="retry-ai" onClick={() => { const previous = design.messages.slice(0, design.messages.indexOf(message)).reverse().find(item => item.role === 'user'); if (previous) void send(previous.text, previous.magic ? 'magic' : 'chat') }}>Retry request <RotateCcw size={12} /></button>}
                    {message.role === 'user' && <CheckCheck size={12} className="message-tick" />}
                  </div>
                </motion.div>
              ))}

              {thinking && (
                <div className="studio-message message-assistant">
                  <span className="message-avatar">
                    <MinalMark size={14} />
                  </span>
                  <div className="harness-progress" aria-live="polite"><span className="thinking-line"><SiriOrb active size={16} /><span className="shimmer-text">{progress || 'Thinking…'}</span></span>{streamText && <p className="stream-text">{streamText}</p>}</div>
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
              {!thinking && aiActive && design.chatStep === 0 && !magicMode && (
                <button type="button" className="magic-build-card" onClick={() => magicBuild(input || design.brief)}>
                  <span><WandSparkles size={16} /></span>
                  <div><strong>Magic Build</strong><small>{(input || design.brief).trim() ? 'Build the whole package from your idea: shape, size, materials, colours, type and artwork.' : 'Describe your product in one sentence and watch it build live.'}</small></div>
                  <ArrowRight size={14} />
                </button>
              )}
              {!thinking && design.messages.length > 1 && (
                <div className="chat-suggestions">
                  <button type="button" className={`magic-chip ${magicMode ? 'active' : ''}`} aria-pressed={magicMode} onClick={() => input.trim() ? magicBuild(input) : setMagicMode(on => !on)}>
                    <WandSparkles size={12} /> Magic Build
                  </button>
                  {['Improve the typography', 'Explore a new structure', 'Review this design'].map(suggestion => (
                    <button key={suggestion} onClick={() => send(suggestion)}>
                      {suggestion}
                      <ArrowUp size={12} />
                    </button>
                  ))}
                </div>
              )}

              <form
                className={`studio-compose ${thinking ? 'is-thinking' : ''} ${magicMode ? 'is-magic' : ''}`}
                onSubmit={e => {
                  e.preventDefault()
                  void send(input, magicMode ? 'magic' : 'chat')
                }}
              >
                <textarea
                  ref={textareaRef}
                  aria-label={magicMode ? 'Describe your product for Magic Build' : 'Message minal about your product'}
                  placeholder={
                    !aiActive
                      ? 'Connect AI in Settings, or use the design editors…'
                      : magicMode
                        ? 'One sentence, e.g. "matte black luxury perfume box with gold foil logo"'
                        : 'Say anything: "make a hexagonal box", "remove the top", "shopping bag with handles"…'
                  }
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  maxLength={2000}
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send(input, magicMode ? 'magic' : 'chat')
                    }
                    if (e.key === 'Escape' && magicMode) setMagicMode(false)
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
                  <button
                    type="button"
                    className={`icon-button magic-button ${magicMode ? 'active' : ''}`}
                    aria-label="Magic Build: build the whole package from one sentence"
                    title="Magic Build: build the whole package from one sentence"
                    disabled={!aiActive || uploading}
                    onClick={() => magicBuild()}
                  >
                    <WandSparkles size={17} />
                  </button>
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
              <p className="sx-foot">{aiActive ? <>Enter to send · Shift+Enter for a new line</> : <>AI is offline. <Link to="/admin?tab=settings">Connect a key</Link> or edit with the tools.</>}</p>
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
                <SceneStage thinking={thinking} interactive3d={view === '3d'} pulse={toolPulse} label={progress || undefined}>
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
                  <span>1:1 mm · cut / crease / perf · 3 mm bleed & safe zone · crop marks · editable SVG, CorelDRAW & PDF export</span>
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
                      <Layers3 size={15} /> CorelDRAW, fully editable (.cdr / package)
                    </button>
                    <button onClick={exportPdf}><FileText size={15} /> Print-proof PDF (300 dpi + vector die lines)</button>
                    <button onClick={exportDxf}>
                      <FileText size={15} /> AutoCAD / Laser Die (.dxf)
                    </button>
                    <button onClick={exportSvg}>
                      <Layers3 size={15} /> Editable vector SVG (live text, layers)
                    </button>
                    <button onClick={exportFlatPng}><ImagePlus size={15} /> Full 2D design image (300 dpi .png)</button>
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
              {exportMount && <Dieline design={design} />}
            </div>
          </div>

          <AnimatePresence>{showArtwork && <motion.div className="specs-drawer print-drawer" initial={{ opacity: 0, x: 280 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 280 }}><div className="specs-drawer-header"><h3>Print designs & images</h3><button className="icon-button" aria-label="Close print designs" onClick={() => setShowArtwork(false)}><X size={18} /></button></div><div className="specs-drawer-content"><Suspense fallback={<p className="panel-description">Loading print designs…</p>}><ArtworkEditor design={design} onChange={patch} /></Suspense></div></motion.div>}</AnimatePresence>
          <AnimatePresence>{showType && <motion.div className="specs-drawer" initial={{ opacity: 0, x: 280 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 280 }}><div className="specs-drawer-header"><h3>Typography & branding</h3><button className="icon-button" aria-label="Close typography" onClick={() => setShowType(false)}><X size={18} /></button></div><div className="specs-drawer-content"><TypographyEditor design={design} onChange={patch} /></div></motion.div>}</AnimatePresence>
          <AnimatePresence>{showSurface && <motion.div className="specs-drawer" initial={{ opacity: 0, x: 280 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 280 }}><div className="specs-drawer-header"><h3>Textures & product information</h3><button className="icon-button" aria-label="Close textures" onClick={() => setShowSurface(false)}><X size={18} /></button></div><div className="specs-drawer-content"><Suspense fallback={<p className="panel-description">Loading textures…</p>}><SurfaceEditor design={design} onChange={patch} /><ProductInfoEditor design={design} onChange={patch} /></Suspense></div></motion.div>}</AnimatePresence>
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
            {showTemplates && <Suspense fallback={null}><TemplateLibrary design={design} onApply={applyLibrary} onClose={() => setShowTemplates(false)} /></Suspense>}
          </AnimatePresence>
        </section>
      </div>

      {order && <OrderModal design={design} onClose={closeOrder} />}
      <AnimatePresence>
        {lightbox && (
          <motion.div className="shot-lightbox" role="dialog" aria-modal="true" aria-label={`${lightbox.label} view`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)} onKeyDown={e => { if (e.key === 'Escape') setLightbox(null) }}>
            <motion.figure initial={{ scale: .96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .97 }} onClick={e => e.stopPropagation()}>
              <img src={lightbox.image} alt={`${design.name} — ${lightbox.label.toLowerCase()} view`} />
              <figcaption>
                <span>{design.name} · {lightbox.label}</span>
                <span>
                  <button type="button" className="button button-lime button-sm" autoFocus onClick={() => { const a = document.createElement('a'); a.href = lightbox.image; a.download = `${safeName(design.name)}-${safeName(lightbox.label)}.${lightbox.image.startsWith('data:image/webp') ? 'webp' : 'jpg'}`; a.click() }}><Download size={14} /> Download</button>
                  <button type="button" className="icon-button" aria-label="Close preview" onClick={() => setLightbox(null)}><X size={16} /></button>
                </span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
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

import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'

const message = (error: unknown) => error instanceof Error ? error.message : String(error)

function cdrMiddlewarePlugin(): Plugin {
  let busy = false
  return {
    name: 'cdr-middleware-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/generate-cdr', (req, res, next) => {
        if (req.method !== 'POST') { next(); return }
        const fail = (status: number, error: string) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error })) }
        if (busy) { fail(409, 'Another CorelDRAW export is running. Try again shortly.'); return }
        let body = '', oversized = false
        req.on('data', (chunk: Buffer) => {
          if (oversized) return
          body += chunk
          if (Buffer.byteLength(body) > 20 * 1024 * 1024) { oversized = true; body = ''; fail(413, 'The artwork exceeds the 20 MB export limit.') }
        })
        req.on('end', () => {
          if (oversized) return
          let tempDir = ''
          const cleanup = () => {
            if (!tempDir) return
            for (const name of ['artwork.svg', 'artwork.cdr']) fs.rmSync(path.join(tempDir, name), { force: true })
            fs.rmdirSync(tempDir)
          }
          try {
            const request = JSON.parse(body) as { design?: { name?: string }; svg?: string }
            const svg = request.svg
            if (typeof svg !== 'string' || !/^<svg\s/.test(svg) || !/width="[0-9.]+mm"/.test(svg) || !/height="[0-9.]+mm"/.test(svg) || /<!DOCTYPE|<script|<foreignObject|\son[a-z]+\s*=/i.test(svg) || /(?:href|xlink:href)="(?!#|data:image\/(?:png|jpeg);base64,)/i.test(svg)) {
              fail(400, 'Export requires a self-contained SVG drawing from the studio.'); return
            }
            if (busy) { fail(409, 'Another CorelDRAW export is running. Try again shortly.'); return }
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'minal-cdr-'))
            const inputSvg = path.join(tempDir, 'artwork.svg'), outputCdr = path.join(tempDir, 'artwork.cdr')
            fs.writeFileSync(inputSvg, svg, 'utf8')
            busy = true
            execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.resolve(__dirname, 'scripts/generate-cdr.ps1'), '-inputSvgPath', inputSvg, '-outputCdrPath', outputCdr], { timeout: 90000, windowsHide: true }, (error, _stdout, stderr) => {
              busy = false
              try {
                if (error || !fs.existsSync(outputCdr)) { fail(503, stderr.trim() || 'CorelDRAW could not complete the export. Export SVG to open in CorelDRAW.'); return }
                const bytes = fs.readFileSync(outputCdr)
                const filename = (request.design?.name || 'packaging').toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-')
                res.setHeader('Content-Type', 'application/x-coreldraw')
                res.setHeader('Content-Disposition', `attachment; filename="${filename}-full-design.cdr"`)
                res.end(bytes)
              } catch (err) { fail(500, message(err)) }
              finally { cleanup() }
            })
          } catch (err) { busy = false; cleanup(); fail(400, message(err)) }
        })
      })
    }
  }
}

export default defineConfig(async ({ mode }) => {
  const plugins: Plugin[] = [...react(), ...tailwindcss(), cdrMiddlewarePlugin()]
  try {
    // @ts-expect-error Optional generated plugin is absent in local checkouts.
    const m = await import('./.vite-source-tags.js')
    plugins.push(m.sourceTags())
  } catch { /* Optional generated plugin is absent. */ }

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_'])
  const processEnvDefines: Record<string, string> = {}
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value)
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  }
})

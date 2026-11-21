import { build } from 'esbuild'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()

const FORBIDDEN_BACKEND_PATTERNS = [
  { label: 'native fetch()', regex: /\bfetch\s*\(/ },
  { label: 'Bun global access', regex: /\bBun\./ },
  { label: 'process global access', regex: /\bprocess\./ },
  { label: 'eval() dynamic code execution', regex: /\beval\s*\(/ },
  { label: 'Function() dynamic code execution', regex: /\bFunction\s*\(/ },
  { label: 'Node built-in module import', regex: /['"](?:node:)?(?:fs|http|https|net|tls|dgram|child_process|crypto)['"]/ },
  { label: 'Buffer base64 decoding', regex: /Buffer\.from\([^)]*base64/i },
]

async function main() {
  const backendOut = resolve(root, 'dist/backend.js')
  const frontendOut = resolve(root, 'dist/frontend.js')

  await build({
    entryPoints: [resolve(root, 'src/backend.ts')],
    outfile: backendOut,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    mainFields: ['module', 'main'],
    logLevel: 'info',
  })

  await build({
    entryPoints: [resolve(root, 'src/frontend.ts')],
    outfile: frontendOut,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    logLevel: 'info',
  })

  const backendBundle = readFileSync(backendOut, 'utf8')
  const violations = FORBIDDEN_BACKEND_PATTERNS.filter((p) => p.regex.test(backendBundle))
  if (violations.length > 0) {
    const names = violations.map((v) => v.label).join(', ')
    throw new Error(`El bundle backend contiene patrones bloqueados por Spindle: ${names}`)
  }

  const backendSize = statSync(backendOut).size
  const frontendSize = statSync(frontendOut).size
  console.log(`Build OK: dist/backend.js (${backendSize} bytes), dist/frontend.js (${frontendSize} bytes)`)
  console.log('Seguridad backend Spindle: sin patrones bloqueados.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

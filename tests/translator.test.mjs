import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { build } from 'esbuild'

const root = process.cwd()

async function importTsBundle(entryRelativePath) {
  const result = await build({
    entryPoints: [resolve(root, entryRelativePath)],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    mainFields: ['module', 'main'],
  })
  const code = result.outputFiles[0].text
  const url = `data:text/javascript;base64,${Buffer.from(code, 'utf8').toString('base64')}`
  return import(url)
}

const textProcessor = await importTsBundle('src/backend/textProcessor.ts')
const providers = await importTsBundle('src/backend/providers/index.ts')
const storageMod = await importTsBundle('src/backend/storage.ts')
const markdownMod = await importTsBundle('src/frontend/markdown.ts')
const sharedTypes = await importTsBundle('src/shared/types.ts')

test('textProcessor protege bloques de código, inline code, etiquetas XML/HTML y URLs', () => {
  const input =
    'Hola <status>activo</status> visita https://lumiverse.chat/docs y ejecuta `const x = 1`\n\n```ts\nconst a = "hello world";\n```\n\nAdiós.'
  const { masked, tokens } = textProcessor.protectSegments(input)
  assert.equal(tokens.length, 5)
  assert.ok(!masked.includes('const a = "hello world"'))
  assert.ok(!masked.includes('https://lumiverse.chat/docs'))
  assert.ok(!masked.includes('<status>'))

  // Simular que el traductor metió espacios dentro de [[ LT 0 ]]
  const translatedMasked = masked.replace('[[LT0]]', '[[ LT 0 ]]')
  const restored = textProcessor.restoreSegments(translatedMasked, tokens)
  assert.equal(restored, input)
})

test('textProcessor divide mensajes largos (>3500 chars) conservando párrafos', () => {
  const p1 = 'Primera oración de roleplay. '.repeat(80).trim()
  const p2 = 'Segunda escena detallada con diálogo. '.repeat(80).trim()
  const input = `${p1}\n\n${p2}`
  assert.ok(input.length > 3500)

  const chunks = textProcessor.splitIntoChunks(input, 3200)
  assert.ok(chunks.length >= 2)
  for (const chunk of chunks) {
    assert.ok(chunk.text.length <= 3200)
  }
  const reconstructed = chunks.map((c) => c.text + c.separator).join('')
  assert.equal(reconstructed, input)
})

test('textProcessor limpia espacios espurios en cursivas de roleplay sin dañar listas', () => {
  const raw = '* camina hacia la ventana * y dice:\n- primer elemento\n* segundo elemento'
  const normalized = textProcessor.normalizeRoleplayFormatting(raw)
  assert.equal(
    normalized,
    '*camina hacia la ventana* y dice:\n- primer elemento\n* segundo elemento',
  )
})

test('Google Translate parsea múltiples segmentos y usa POST form-urlencoded', async () => {
  let capturedUrl = ''
  let capturedInit = null
  const mockCors = async (url, init) => {
    capturedUrl = url
    capturedInit = init
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: JSON.stringify([[['Hola ', 'Hello ', null, null, 1], ['mundo.', 'world.', null, null, 1]], null, 'en']),
    }
  }

  const config = { ...sharedTypes.DEFAULT_CONFIG, providerId: 'google', targetLang: 'es' }
  const res = await providers.translateWithProviders('Hello world.', config, mockCors)
  assert.ok(capturedUrl.includes('translate.googleapis.com/translate_a/single'))
  assert.equal(capturedInit.method, 'POST')
  assert.equal(capturedInit.headers['Content-Type'], 'application/x-www-form-urlencoded;charset=UTF-8')
  assert.equal(res.providerId, 'google')
  assert.equal(res.usedFallback, false)
  assert.equal(res.translatedText, 'Hola mundo.')
  assert.equal(res.detectedSourceLang, 'en')
})

test('Fallback automático a MyMemory cuando Google responde 429', async () => {
  const calls = []
  const mockCors = async (url) => {
    calls.push(url)
    if (url.includes('translate.googleapis.com')) {
      return { status: 429, statusText: 'Too Many Requests', headers: {}, body: 'Rate limited' }
    }
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: JSON.stringify({
        responseStatus: 200,
        responseData: { translatedText: 'Texto traducido por respaldo' },
      }),
    }
  }

  const config = {
    ...sharedTypes.DEFAULT_CONFIG,
    providerId: 'google',
    fallbackToMyMemory: true,
    targetLang: 'es',
  }
  const res = await providers.translateWithProviders('Fallback test text', config, mockCors)
  assert.equal(calls.length, 2)
  assert.equal(res.providerId, 'mymemory')
  assert.equal(res.usedFallback, true)
  assert.equal(res.translatedText, 'Texto traducido por respaldo')
})

test('MyMemory fragmenta textos mayores a 450 caracteres', async () => {
  const calls = []
  const mockCors = async (url) => {
    calls.push(url)
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: JSON.stringify({
        responseStatus: 200,
        responseData: { translatedText: 'OK' },
      }),
    }
  }

  const longText = 'Sentence one here. '.repeat(40).trim()
  const config = { ...sharedTypes.DEFAULT_CONFIG, providerId: 'mymemory', targetLang: 'es' }
  await providers.translateWithProviders(longText, config, mockCors)
  assert.ok(calls.length >= 2)
})

test('LibreTranslate envía JSON a la instancia configurada', async () => {
  let capturedUrl = ''
  let capturedBody = null
  const mockCors = async (url, init) => {
    capturedUrl = url
    capturedBody = JSON.parse(init.body)
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: JSON.stringify({
        translatedText: 'Hola desde LibreTranslate',
        detectedLanguage: { language: 'en' },
      }),
    }
  }

  const config = {
    ...sharedTypes.DEFAULT_CONFIG,
    providerId: 'libretranslate',
    libreTranslateUrl: 'http://127.0.0.1:5000/',
    libreTranslateApiKey: 'secret-key',
    targetLang: 'es',
  }
  const res = await providers.translateWithProviders('Hello', config, mockCors)
  assert.equal(capturedUrl, 'http://127.0.0.1:5000/translate')
  assert.equal(capturedBody.api_key, 'secret-key')
  assert.equal(res.translatedText, 'Hola desde LibreTranslate')
})

test('DeepL usa endpoint free/pro y cabecera DeepL-Auth-Key', async () => {
  let capturedUrl = ''
  let capturedHeaders = null
  let capturedBody = null
  const mockCors = async (url, init) => {
    capturedUrl = url
    capturedHeaders = init.headers
    capturedBody = JSON.parse(init.body)
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: JSON.stringify({
        translations: [{ text: 'Hola DeepL', detected_source_language: 'EN' }],
      }),
    }
  }

  const config = {
    ...sharedTypes.DEFAULT_CONFIG,
    providerId: 'deepl',
    deeplApiKey: 'deepl-key-123',
    deeplPlan: 'free',
    targetLang: 'es',
  }
  const res = await providers.translateWithProviders('Hello', config, mockCors)
  assert.equal(capturedUrl, 'https://api-free.deepl.com/v2/translate')
  assert.equal(capturedHeaders.Authorization, 'DeepL-Auth-Key deepl-key-123')
  assert.equal(capturedBody.target_lang, 'ES')
  assert.equal(res.translatedText, 'Hola DeepL')
  assert.equal(res.detectedSourceLang, 'en')
})

test('Storage persiste config, valida entradas e invalida caché por swipe/hash/idioma', async () => {
  const memFiles = new Map()
  const mockUserStorage = {
    async getJson(path, opts) {
      const k = `${opts?.userId ?? 'u'}:${path}`
      return memFiles.has(k) ? JSON.parse(memFiles.get(k)) : opts?.fallback
    },
    async setJson(path, val, opts) {
      const k = `${opts?.userId ?? 'u'}:${path}`
      memFiles.set(k, JSON.stringify(val))
    },
  }

  const storage = storageMod.createStorageService(mockUserStorage)
  const initial = await storage.getConfig('u1')
  assert.equal(initial.displayMode, 'replace')
  assert.equal(initial.autoTranslate, false)

  const updated = await storage.saveConfig({ targetLang: 'ja', autoTranslate: true }, 'u1')
  assert.equal(updated.targetLang, 'ja')
  assert.equal(updated.autoTranslate, true)

  const key1 = storageMod.buildCacheKey({
    chatId: 'c1',
    messageId: 'm1',
    swipeId: 0,
    sourceLang: 'auto',
    targetLang: 'es',
    providerId: 'google',
    textHash: textProcessor.hashText('Hello'),
  })
  const key2 = storageMod.buildCacheKey({
    chatId: 'c1',
    messageId: 'm1',
    swipeId: 1,
    sourceLang: 'auto',
    targetLang: 'es',
    providerId: 'google',
    textHash: textProcessor.hashText('Hello v2'),
  })

  await storage.setCacheEntry(
    key1,
    { translatedText: 'Hola', providerId: 'google', updatedAt: Date.now() },
    'u1',
  )
  assert.equal((await storage.getCacheEntry(key1, 'u1')).translatedText, 'Hola')
  assert.equal(await storage.getCacheEntry(key2, 'u1'), null)

  const remaining = await storage.clearCache('c1', 'u1')
  assert.equal(remaining, 0)
})

test('Markdown renderer formatea roleplay y neutraliza payloads XSS', () => {
  const malicious =
    '*Sonríe* y dice **hola**\n\n> cita\n\n<script>alert(1)</script> [click](javascript:alert(1)) <img src=x onerror=alert(2)>'
  const html = markdownMod.renderTranslatedMarkdown(malicious)
  assert.ok(html.includes('<em>Sonríe</em>'))
  assert.ok(html.includes('<strong>hola</strong>'))
  assert.ok(html.includes('<blockquote class="lumi-tr-quote">cita</blockquote>'))
  assert.ok(!html.includes('<script>'))
  assert.ok(!html.includes('<img'))
  assert.ok(!html.includes('javascript:'))
})

test('Integridad de spindle.json y bundles dist/backend.js + dist/frontend.js', async () => {
  const manifest = JSON.parse(readFileSync(resolve(root, 'spindle.json'), 'utf8'))
  assert.match(manifest.identifier, /^[a-z][a-z0-9_]*$/)
  assert.deepEqual(manifest.permissions, ['cors_proxy', 'chats'])
  assert.equal(manifest.entry_backend, 'dist/backend.js')
  assert.equal(manifest.entry_frontend, 'dist/frontend.js')

  const backendCode = readFileSync(resolve(root, 'dist/backend.js'), 'utf8')
  assert.ok(backendCode.length > 500)
  assert.ok(!/\bfetch\s*\(/.test(backendCode))
  assert.ok(!/\bBun\./.test(backendCode))
  assert.ok(!/\bprocess\./.test(backendCode))

  const frontendCode = readFileSync(resolve(root, 'dist/frontend.js'), 'utf8')
  assert.ok(frontendCode.length > 500)
  const frontendMod = await import(
    `data:text/javascript;base64,${Buffer.from(frontendCode, 'utf8').toString('base64')}`
  )
  assert.equal(typeof frontendMod.setup, 'function')
})

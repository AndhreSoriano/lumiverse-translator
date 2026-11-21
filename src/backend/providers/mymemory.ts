import { toMyMemoryLang } from '../../shared/languages.js'
import type { TranslatorConfig } from '../../shared/types.js'
import { splitIntoChunks } from '../textProcessor.js'
import {
  ProviderError,
  type CorsRequester,
  type ProviderTranslateRequest,
  type ProviderTranslateResponse,
  type TranslationProvider,
} from './base.js'

const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get'
const MYMEMORY_MAX_CHUNK = 450

function inferSourceLangForMyMemory(text: string, targetLang: string): string {
  const targetBase = toMyMemoryLang(targetLang)
  if (/[\u3040-\u30ff]/.test(text)) return 'ja'
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN'
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'
  if (/[áéíóúüñ¿¡]/i.test(text)) return targetBase === 'es' ? 'en' : 'es'
  return targetBase === 'en' ? 'es' : 'en'
}

export const myMemoryProvider: TranslationProvider = {
  id: 'mymemory',
  label: 'MyMemory',
  maxChunkChars: MYMEMORY_MAX_CHUNK,

  async translateChunk(
    req: ProviderTranslateRequest,
    config: TranslatorConfig,
    cors: CorsRequester,
  ): Promise<ProviderTranslateResponse> {
    const chunks = splitIntoChunks(req.text, MYMEMORY_MAX_CHUNK)
    const sl =
      req.sourceLang === 'auto'
        ? inferSourceLangForMyMemory(req.text, req.targetLang)
        : toMyMemoryLang(req.sourceLang)
    const tl = toMyMemoryLang(req.targetLang)

    let output = ''
    for (const chunk of chunks) {
      if (!chunk.text.trim()) {
        output += chunk.text + chunk.separator
        continue
      }

      let url =
        `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(chunk.text)}` +
        `&langpair=${encodeURIComponent(`${sl}|${tl}`)}`
      if (config.myMemoryEmail.trim()) {
        url += `&de=${encodeURIComponent(config.myMemoryEmail.trim())}`
      }

      const res = await cors(url, { method: 'GET' })
      if (res.status < 200 || res.status >= 300) {
        throw new ProviderError(`MyMemory respondió con HTTP ${res.status}`, {
          providerId: 'mymemory',
          status: res.status,
          retryable: res.status === 429 || res.status >= 500,
        })
      }

      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(res.body) as Record<string, unknown>
      } catch {
        throw new ProviderError('MyMemory devolvió JSON inválido', {
          providerId: 'mymemory',
          retryable: true,
        })
      }

      const responseStatus = typeof parsed.responseStatus === 'number' ? parsed.responseStatus : res.status
      const responseData = parsed.responseData as Record<string, unknown> | undefined
      const translated = typeof responseData?.translatedText === 'string' ? responseData.translatedText : ''

      if (responseStatus === 429 || /MYMEMORY WARNING/i.test(translated)) {
        throw new ProviderError('Límite diario de MyMemory alcanzado', {
          providerId: 'mymemory',
          status: 429,
          retryable: true,
        })
      }

      if (responseStatus >= 400 || !translated) {
        const details = typeof parsed.responseDetails === 'string' ? parsed.responseDetails : `Error ${responseStatus}`
        throw new ProviderError(`MyMemory: ${details}`, {
          providerId: 'mymemory',
          status: responseStatus,
          retryable: responseStatus >= 500,
        })
      }

      output += translated + chunk.separator
    }

    return {
      translatedText: output,
      detectedSourceLang: req.sourceLang === 'auto' ? sl : undefined,
    }
  },
}

import { toLibreTranslateLang } from '../../shared/languages.js'
import type { TranslatorConfig } from '../../shared/types.js'
import {
  ProviderError,
  type CorsRequester,
  type ProviderTranslateRequest,
  type ProviderTranslateResponse,
  type TranslationProvider,
} from './base.js'

export const libreTranslateProvider: TranslationProvider = {
  id: 'libretranslate',
  label: 'LibreTranslate',
  maxChunkChars: 3000,

  async translateChunk(
    req: ProviderTranslateRequest,
    config: TranslatorConfig,
    cors: CorsRequester,
  ): Promise<ProviderTranslateResponse> {
    const rawUrl = config.libreTranslateUrl.trim().replace(/\/+$/, '')
    if (!/^https?:\/\/.+/.test(rawUrl)) {
      throw new ProviderError('Configura una URL válida para LibreTranslate (http:// o https://)', {
        providerId: 'libretranslate',
        retryable: false,
      })
    }

    const endpoint = `${rawUrl}/translate`
    const payload: Record<string, string> = {
      q: req.text,
      source: toLibreTranslateLang(req.sourceLang),
      target: toLibreTranslateLang(req.targetLang),
      format: 'text',
    }
    if (config.libreTranslateApiKey.trim()) {
      payload.api_key = config.libreTranslateApiKey.trim()
    }

    const res = await cors(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.status < 200 || res.status >= 300) {
      throw new ProviderError(`LibreTranslate respondió con HTTP ${res.status}`, {
        providerId: 'libretranslate',
        status: res.status,
        retryable: res.status === 429 || res.status >= 500,
      })
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(res.body) as Record<string, unknown>
    } catch {
      throw new ProviderError('LibreTranslate devolvió una respuesta no válida', {
        providerId: 'libretranslate',
        retryable: true,
      })
    }

    if (typeof parsed.translatedText !== 'string') {
      const msg = typeof parsed.error === 'string' ? parsed.error : 'Respuesta sin translatedText'
      throw new ProviderError(`LibreTranslate: ${msg}`, {
        providerId: 'libretranslate',
        retryable: false,
      })
    }

    const detected =
      parsed.detectedLanguage && typeof parsed.detectedLanguage === 'object'
        ? (parsed.detectedLanguage as Record<string, unknown>).language
        : undefined

    return {
      translatedText: parsed.translatedText,
      detectedSourceLang: typeof detected === 'string' ? detected : undefined,
    }
  },
}

import { toDeepLSourceLang, toDeepLTargetLang } from '../../shared/languages.js'
import type { TranslatorConfig } from '../../shared/types.js'
import {
  ProviderError,
  type CorsRequester,
  type ProviderTranslateRequest,
  type ProviderTranslateResponse,
  type TranslationProvider,
} from './base.js'

export const deeplProvider: TranslationProvider = {
  id: 'deepl',
  label: 'DeepL API',
  maxChunkChars: 3500,

  async translateChunk(
    req: ProviderTranslateRequest,
    config: TranslatorConfig,
    cors: CorsRequester,
  ): Promise<ProviderTranslateResponse> {
    const apiKey = config.deeplApiKey.trim()
    if (!apiKey) {
      throw new ProviderError('Falta la API Key de DeepL en el menú del Traductor', {
        providerId: 'deepl',
        retryable: false,
      })
    }

    const host = config.deeplPlan === 'pro' ? 'https://api.deepl.com' : 'https://api-free.deepl.com'
    const endpoint = `${host}/v2/translate`
    const bodyPayload: Record<string, unknown> = {
      text: [req.text],
      target_lang: toDeepLTargetLang(req.targetLang),
    }
    if (req.sourceLang && req.sourceLang !== 'auto') {
      bodyPayload.source_lang = toDeepLSourceLang(req.sourceLang)
    }

    const res = await cors(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    })

    if (res.status < 200 || res.status >= 300) {
      throw new ProviderError(`DeepL respondió con HTTP ${res.status}`, {
        providerId: 'deepl',
        status: res.status,
        retryable: res.status === 429 || res.status >= 500,
      })
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(res.body) as Record<string, unknown>
    } catch {
      throw new ProviderError('DeepL devolvió una respuesta no válida', {
        providerId: 'deepl',
        retryable: true,
      })
    }

    const translations = parsed.translations
    if (!Array.isArray(translations) || !translations[0] || typeof translations[0] !== 'object') {
      throw new ProviderError('DeepL no devolvió traducciones', {
        providerId: 'deepl',
        retryable: true,
      })
    }

    const first = translations[0] as Record<string, unknown>
    return {
      translatedText: typeof first.text === 'string' ? first.text : '',
      detectedSourceLang:
        typeof first.detected_source_language === 'string'
          ? first.detected_source_language.toLowerCase()
          : undefined,
    }
  },
}

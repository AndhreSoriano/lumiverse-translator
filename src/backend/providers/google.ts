import { ProviderError, type CorsRequester, type ProviderTranslateRequest, type ProviderTranslateResponse, type TranslationProvider } from './base.js'
import type { TranslatorConfig } from '../../shared/types.js'

const GOOGLE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single'

export const googleProvider: TranslationProvider = {
  id: 'google',
  label: 'Google Translate',
  maxChunkChars: 3200,

  async translateChunk(
    req: ProviderTranslateRequest,
    _config: TranslatorConfig,
    cors: CorsRequester,
  ): Promise<ProviderTranslateResponse> {
    const sl = req.sourceLang || 'auto'
    const tl = req.targetLang || 'es'
    const url =
      `${GOOGLE_ENDPOINT}?client=gtx&sl=${encodeURIComponent(sl)}` +
      `&tl=${encodeURIComponent(tl)}&dt=t`

    const res = await cors(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: `q=${encodeURIComponent(req.text)}`,
    })

    if (res.status < 200 || res.status >= 300) {
      throw new ProviderError(`Google Translate respondió con HTTP ${res.status}`, {
        providerId: 'google',
        status: res.status,
        retryable: res.status === 429 || res.status >= 500,
      })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(res.body)
    } catch {
      throw new ProviderError('Google Translate devolvió una respuesta no válida', {
        providerId: 'google',
        retryable: true,
      })
    }

    if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
      throw new ProviderError('Formato inesperado en respuesta de Google Translate', {
        providerId: 'google',
        retryable: true,
      })
    }

    let translatedText = ''
    for (const seg of parsed[0]) {
      if (Array.isArray(seg) && typeof seg[0] === 'string') {
        translatedText += seg[0]
      }
    }

    const detectedSourceLang = typeof parsed[2] === 'string' ? parsed[2] : undefined
    return { translatedText, detectedSourceLang }
  },
}

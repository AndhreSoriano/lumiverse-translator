import type { ProviderId, TranslatorConfig } from '../../shared/types.js'
import {
  normalizeRoleplayFormatting,
  protectSegments,
  restoreSegments,
  splitIntoChunks,
} from '../textProcessor.js'
import { ProviderError, type CorsRequester, type TranslationProvider } from './base.js'
import { deeplProvider } from './deepl.js'
import { googleProvider } from './google.js'
import { libreTranslateProvider } from './libretranslate.js'
import { myMemoryProvider } from './mymemory.js'

const PROVIDERS: Record<ProviderId, TranslationProvider> = {
  google: googleProvider,
  mymemory: myMemoryProvider,
  libretranslate: libreTranslateProvider,
  deepl: deeplProvider,
}

export interface FullTranslationResult {
  translatedText: string
  detectedSourceLang?: string
  providerId: ProviderId
  usedFallback: boolean
}

export async function translateWithProvider(
  provider: TranslationProvider,
  text: string,
  config: TranslatorConfig,
  cors: CorsRequester,
): Promise<{ translatedText: string; detectedSourceLang?: string }> {
  const { masked, tokens } = protectSegments(text)
  const chunks = splitIntoChunks(masked, provider.maxChunkChars)
  if (chunks.length === 0) return { translatedText: text }

  let detectedSourceLang: string | undefined
  let combined = ''

  for (const chunk of chunks) {
    if (!chunk.text.trim()) {
      combined += chunk.text + chunk.separator
      continue
    }
    const res = await provider.translateChunk(
      {
        text: chunk.text,
        sourceLang: config.sourceLang,
        targetLang: config.targetLang,
      },
      config,
      cors,
    )
    if (!detectedSourceLang && res.detectedSourceLang) {
      detectedSourceLang = res.detectedSourceLang
    }
    combined += res.translatedText + chunk.separator
  }

  const restored = restoreSegments(combined, tokens)
  return {
    translatedText: normalizeRoleplayFormatting(restored),
    detectedSourceLang,
  }
}

export async function translateWithProviders(
  text: string,
  config: TranslatorConfig,
  cors: CorsRequester,
): Promise<FullTranslationResult> {
  if (!text.trim()) {
    return {
      translatedText: text,
      providerId: config.providerId,
      usedFallback: false,
    }
  }

  const primary = PROVIDERS[config.providerId] ?? googleProvider
  try {
    const res = await translateWithProvider(primary, text, config, cors)
    return {
      ...res,
      providerId: primary.id,
      usedFallback: false,
    }
  } catch (err) {
    const isPerm = err instanceof ProviderError && err.needsCorsPermission
    const canFallback =
      !isPerm &&
      config.fallbackToMyMemory &&
      primary.id !== 'mymemory' &&
      (!(err instanceof ProviderError) || err.retryable)

    if (!canFallback) throw err

    const fallbackRes = await translateWithProvider(myMemoryProvider, text, config, cors)
    return {
      ...fallbackRes,
      providerId: 'mymemory',
      usedFallback: true,
    }
  }
}

export { isCorsPermissionError, ProviderError, runCorsRequest } from './base.js'
export type { CorsRequester } from './base.js'

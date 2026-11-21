export type ProviderId = 'google' | 'mymemory' | 'libretranslate' | 'deepl'

export type DisplayMode = 'replace' | 'bilingual'

export type DeepLPlan = 'free' | 'pro'

export interface TranslatorConfig {
  enabled: boolean
  sourceLang: string
  targetLang: string
  autoTranslate: boolean
  displayMode: DisplayMode
  providerId: ProviderId
  fallbackToMyMemory: boolean
  libreTranslateUrl: string
  libreTranslateApiKey: string
  deeplApiKey: string
  deeplPlan: DeepLPlan
  myMemoryEmail: string
}

export const DEFAULT_CONFIG: TranslatorConfig = {
  enabled: true,
  sourceLang: 'auto',
  targetLang: 'es',
  autoTranslate: false,
  displayMode: 'replace',
  providerId: 'google',
  fallbackToMyMemory: true,
  libreTranslateUrl: 'http://localhost:5000',
  libreTranslateApiKey: '',
  deeplApiKey: '',
  deeplPlan: 'free',
  myMemoryEmail: '',
}

export interface CorsProxyResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
}

export interface TranslationCacheEntry {
  translatedText: string
  detectedSourceLang?: string
  providerId: ProviderId
  updatedAt: number
}

export interface ChatMessageMeta {
  id: string
  isUser: boolean
  swipeId: number
}

export type FrontendToBackendMessage =
  | { type: 'get_config' }
  | { type: 'save_config'; config: Partial<TranslatorConfig> }
  | {
      type: 'translate_message'
      chatId: string
      messageId: string
      swipeId?: number
      text?: string
      fallbackText?: string
      forceRefresh?: boolean
    }
  | { type: 'clear_cache'; chatId?: string }
  | { type: 'get_chat_messages_meta'; chatId: string }

export type BackendToFrontendMessage =
  | {
      type: 'config_updated'
      config: TranslatorConfig
      cacheCount: number
    }
  | {
      type: 'translation_result'
      chatId: string
      messageId: string
      swipeId: number
      targetLang: string
      providerId: ProviderId
      translatedText: string
      detectedSourceLang?: string
      fromCache: boolean
      usedFallback?: boolean
      error?: string
      needsCorsPermission?: boolean
    }
  | {
      type: 'cache_cleared'
      chatId?: string
      cacheCount: number
    }
  | {
      type: 'chat_messages_meta'
      chatId: string
      messages: ChatMessageMeta[]
    }

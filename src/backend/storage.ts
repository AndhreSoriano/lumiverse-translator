import { DEFAULT_CONFIG, type ProviderId, type TranslationCacheEntry, type TranslatorConfig } from '../shared/types.js'

const CONFIG_PATH = 'config.json'
const CACHE_PATH = 'cache.json'
const MAX_CACHE_ENTRIES = 600

export interface UserStorageLike {
  getJson<T>(path: string, options?: { fallback?: T; userId?: string }): Promise<T>
  setJson(path: string, value: unknown, options?: { indent?: number; userId?: string }): Promise<void>
}

interface CacheFile {
  entries: Record<string, TranslationCacheEntry>
}

const VALID_PROVIDERS = new Set<ProviderId>(['google', 'mymemory', 'libretranslate', 'deepl'])

export function sanitizeConfig(raw: unknown, current: TranslatorConfig = DEFAULT_CONFIG): TranslatorConfig {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const providerId =
    typeof input.providerId === 'string' && VALID_PROVIDERS.has(input.providerId as ProviderId)
      ? (input.providerId as ProviderId)
      : current.providerId

  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : current.enabled,
    sourceLang:
      typeof input.sourceLang === 'string' && input.sourceLang.trim()
        ? input.sourceLang.trim()
        : current.sourceLang,
    targetLang:
      typeof input.targetLang === 'string' && input.targetLang.trim()
        ? input.targetLang.trim()
        : current.targetLang,
    autoTranslate:
      typeof input.autoTranslate === 'boolean' ? input.autoTranslate : current.autoTranslate,
    displayMode:
      input.displayMode === 'replace' || input.displayMode === 'bilingual'
        ? input.displayMode
        : current.displayMode,
    providerId,
    fallbackToMyMemory:
      typeof input.fallbackToMyMemory === 'boolean'
        ? input.fallbackToMyMemory
        : current.fallbackToMyMemory,
    libreTranslateUrl:
      typeof input.libreTranslateUrl === 'string'
        ? input.libreTranslateUrl.trim()
        : current.libreTranslateUrl,
    libreTranslateApiKey:
      typeof input.libreTranslateApiKey === 'string'
        ? input.libreTranslateApiKey
        : current.libreTranslateApiKey,
    deeplApiKey:
      typeof input.deeplApiKey === 'string' ? input.deeplApiKey : current.deeplApiKey,
    deeplPlan: input.deeplPlan === 'pro' || input.deeplPlan === 'free' ? input.deeplPlan : current.deeplPlan,
    myMemoryEmail:
      typeof input.myMemoryEmail === 'string' ? input.myMemoryEmail.trim() : current.myMemoryEmail,
  }
}

export function buildCacheKey(params: {
  chatId: string
  messageId: string
  swipeId: number
  sourceLang: string
  targetLang: string
  providerId: ProviderId
  textHash: string
}): string {
  return [
    params.chatId,
    params.messageId,
    String(params.swipeId),
    params.sourceLang,
    params.targetLang,
    params.providerId,
    params.textHash,
  ].join(':')
}

export function createStorageService(userStorage: UserStorageLike) {
  const configMem = new Map<string, TranslatorConfig>()
  const cacheMem = new Map<string, Record<string, TranslationCacheEntry>>()
  const writeChains = new Map<string, Promise<unknown>>()

  const enqueueWrite = <T>(userKey: string, task: () => Promise<T>): Promise<T> => {
    const prev = writeChains.get(userKey) ?? Promise.resolve()
    const next = prev.then(task, task)
    writeChains.set(userKey, next.catch(() => {}))
    return next
  }

  const userKeyOf = (userId?: string): string => userId || '__default__'

  async function loadConfig(userId?: string): Promise<TranslatorConfig> {
    const key = userKeyOf(userId)
    const cached = configMem.get(key)
    if (cached) return cached

    const raw = await userStorage.getJson<Partial<TranslatorConfig>>(CONFIG_PATH, {
      fallback: DEFAULT_CONFIG,
      userId,
    })
    const clean = sanitizeConfig(raw, DEFAULT_CONFIG)
    configMem.set(key, clean)
    return clean
  }

  async function saveConfig(patch: Partial<TranslatorConfig>, userId?: string): Promise<TranslatorConfig> {
    const key = userKeyOf(userId)
    return enqueueWrite(`cfg:${key}`, async () => {
      const current = await loadConfig(userId)
      const next = sanitizeConfig(patch, current)
      configMem.set(key, next)
      await userStorage.setJson(CONFIG_PATH, next, { indent: 2, userId })
      return next
    })
  }

  async function loadCacheMap(userId?: string): Promise<Record<string, TranslationCacheEntry>> {
    const key = userKeyOf(userId)
    const cached = cacheMem.get(key)
    if (cached) return cached

    const file = await userStorage.getJson<CacheFile>(CACHE_PATH, {
      fallback: { entries: {} },
      userId,
    })
    const entries =
      file && typeof file === 'object' && file.entries && typeof file.entries === 'object'
        ? { ...file.entries }
        : {}
    cacheMem.set(key, entries)
    return entries
  }

  async function getCacheEntry(cacheKey: string, userId?: string): Promise<TranslationCacheEntry | null> {
    const entries = await loadCacheMap(userId)
    return entries[cacheKey] ?? null
  }

  async function setCacheEntry(
    cacheKey: string,
    entry: TranslationCacheEntry,
    userId?: string,
  ): Promise<number> {
    const key = userKeyOf(userId)
    return enqueueWrite(`cache:${key}`, async () => {
      const entries = await loadCacheMap(userId)
      entries[cacheKey] = entry

      const keys = Object.keys(entries)
      if (keys.length > MAX_CACHE_ENTRIES) {
        keys.sort((a, b) => (entries[a]?.updatedAt ?? 0) - (entries[b]?.updatedAt ?? 0))
        const toDelete = keys.length - MAX_CACHE_ENTRIES
        for (let i = 0; i < toDelete; i += 1) {
          delete entries[keys[i]]
        }
      }

      await userStorage.setJson(CACHE_PATH, { entries }, { userId })
      return Object.keys(entries).length
    })
  }

  async function clearCache(chatId?: string, userId?: string): Promise<number> {
    const key = userKeyOf(userId)
    return enqueueWrite(`cache:${key}`, async () => {
      const entries = await loadCacheMap(userId)
      if (!chatId) {
        for (const k of Object.keys(entries)) delete entries[k]
      } else {
        const prefix = `${chatId}:`
        for (const k of Object.keys(entries)) {
          if (k.startsWith(prefix)) delete entries[k]
        }
      }
      await userStorage.setJson(CACHE_PATH, { entries }, { userId })
      return Object.keys(entries).length
    })
  }

  async function getCacheCount(userId?: string): Promise<number> {
    const entries = await loadCacheMap(userId)
    return Object.keys(entries).length
  }

  return {
    getConfig: loadConfig,
    saveConfig,
    getCacheEntry,
    setCacheEntry,
    clearCache,
    getCacheCount,
  }
}

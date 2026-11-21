declare const spindle: import('lumiverse-spindle-types').SpindleAPI

import type {
  BackendToFrontendMessage,
  ChatMessageMeta,
  FrontendToBackendMessage,
  TranslatorConfig,
} from './shared/types.js'
import {
  isCorsPermissionError,
  ProviderError,
  runCorsRequest,
  translateWithProviders,
  type CorsRequester,
} from './backend/providers/index.js'
import { buildCacheKey, createStorageService } from './backend/storage.js'
import { hashText } from './backend/textProcessor.js'

const MAX_CONCURRENT_JOBS_PER_USER = 2

const storage = createStorageService(spindle.userStorage)
const inFlight = new Map<string, Promise<void>>()
const activeUserJobs = new Map<string, number>()
const pendingUserQueues = new Map<string, Array<() => void>>()

function enqueueUserWork<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = async () => {
      activeUserJobs.set(userId, (activeUserJobs.get(userId) ?? 0) + 1)
      try {
        resolve(await fn())
      } catch (err) {
        reject(err)
      } finally {
        const remaining = Math.max(0, (activeUserJobs.get(userId) ?? 1) - 1)
        activeUserJobs.set(userId, remaining)
        const queue = pendingUserQueues.get(userId)
        if (queue && queue.length > 0 && remaining < MAX_CONCURRENT_JOBS_PER_USER) {
          const next = queue.shift()
          next?.()
        }
      }
    }

    const active = activeUserJobs.get(userId) ?? 0
    if (active < MAX_CONCURRENT_JOBS_PER_USER) {
      void run()
    } else {
      const queue = pendingUserQueues.get(userId) ?? []
      queue.push(() => void run())
      pendingUserQueues.set(userId, queue)
    }
  })
}

function send(
  msg: BackendToFrontendMessage,
  userId: string,
  frontendSessionId?: string,
): void {
  if (frontendSessionId) {
    spindle.sendToFrontend(msg, userId, { frontendSessionId })
  } else {
    spindle.sendToFrontend(msg, userId)
  }
}

async function resolveAuthoritativeMessage(
  chatId: string,
  messageId: string,
  providedText?: string,
  providedSwipeId?: number,
  fallbackText?: string,
): Promise<{ text: string; swipeId: number }> {
  let swipeId = typeof providedSwipeId === 'number' ? providedSwipeId : 0
  let text = typeof providedText === 'string' ? providedText : ''

  if (!text || typeof providedSwipeId !== 'number') {
    try {
      const messages = await spindle.chat.getMessages(chatId)
      const match = messages.find((m) => m.id === messageId)
      if (match) {
        swipeId = typeof match.swipe_id === 'number' ? match.swipe_id : swipeId
        if (!text && typeof match.content === 'string') {
          text = match.content
        }
      }
    } catch {
      // Optional fallback when chats permission is temporarily unavailable
    }
  }

  if (!text && typeof fallbackText === 'string') {
    text = fallbackText
  }

  return { text, swipeId }
}

async function handleTranslateMessage(
  req: Extract<FrontendToBackendMessage, { type: 'translate_message' }>,
  userId: string,
  frontendSessionId?: string,
): Promise<void> {
  const config: TranslatorConfig = await storage.getConfig(userId)
  const { text, swipeId } = await resolveAuthoritativeMessage(
    req.chatId,
    req.messageId,
    req.text,
    req.swipeId,
    req.fallbackText,
  )

  if (!text.trim()) {
    send(
      {
        type: 'translation_result',
        chatId: req.chatId,
        messageId: req.messageId,
        swipeId,
        targetLang: config.targetLang,
        providerId: config.providerId,
        translatedText: '',
        fromCache: false,
        error: 'El mensaje no contiene texto traducible.',
      },
      userId,
      frontendSessionId,
    )
    return
  }

  const cacheKey = buildCacheKey({
    chatId: req.chatId,
    messageId: req.messageId,
    swipeId,
    sourceLang: config.sourceLang,
    targetLang: config.targetLang,
    providerId: config.providerId,
    textHash: hashText(text),
  })

  if (!req.forceRefresh) {
    const cached = await storage.getCacheEntry(cacheKey, userId)
    if (cached) {
      send(
        {
          type: 'translation_result',
          chatId: req.chatId,
          messageId: req.messageId,
          swipeId,
          targetLang: config.targetLang,
          providerId: cached.providerId,
          translatedText: cached.translatedText,
          detectedSourceLang: cached.detectedSourceLang,
          fromCache: true,
        },
        userId,
        frontendSessionId,
      )
      return
    }
  }

  const dedupeKey = `${userId}:${cacheKey}`
  let job = inFlight.get(dedupeKey)

  if (!job) {
    job = enqueueUserWork(userId, async () => {
      const corsRequester: CorsRequester = (url, options) =>
        runCorsRequest((u, opts) => spindle.cors(u, opts), config.providerId, url, options)

      try {
        const result = await translateWithProviders(text, config, corsRequester)
        await storage.setCacheEntry(
          cacheKey,
          {
            translatedText: result.translatedText,
            detectedSourceLang: result.detectedSourceLang,
            providerId: result.providerId,
            updatedAt: Date.now(),
          },
          userId,
        )

        send(
          {
            type: 'translation_result',
            chatId: req.chatId,
            messageId: req.messageId,
            swipeId,
            targetLang: config.targetLang,
            providerId: result.providerId,
            translatedText: result.translatedText,
            detectedSourceLang: result.detectedSourceLang,
            fromCache: false,
            usedFallback: result.usedFallback,
          },
          userId,
          frontendSessionId,
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const needsCorsPermission =
          (err instanceof ProviderError && err.needsCorsPermission) || isCorsPermissionError(err)

        spindle.log.warn(`[Translator] Error traduciendo ${req.messageId}: ${message}`)
        spindle.toast.error(
          needsCorsPermission
            ? 'Concede el permiso cors_proxy en la extensión para traducir mensajes.'
            : `Error al traducir: ${message}`,
          { userId },
        )

        send(
          {
            type: 'translation_result',
            chatId: req.chatId,
            messageId: req.messageId,
            swipeId,
            targetLang: config.targetLang,
            providerId: config.providerId,
            translatedText: '',
            fromCache: false,
            error: message,
            needsCorsPermission,
          },
          userId,
          frontendSessionId,
        )
      }
    }).finally(() => {
      inFlight.delete(dedupeKey)
    })

    inFlight.set(dedupeKey, job)
  }

  await job
}

spindle.onFrontendMessage(async (rawPayload, userId, frontendSessionId) => {
  if (!rawPayload || typeof rawPayload !== 'object') return
  const payload = rawPayload as FrontendToBackendMessage

  switch (payload.type) {
    case 'get_config': {
      const [config, cacheCount] = await Promise.all([
        storage.getConfig(userId),
        storage.getCacheCount(userId),
      ])
      send({ type: 'config_updated', config, cacheCount }, userId, frontendSessionId)
      break
    }

    case 'save_config': {
      const config = await storage.saveConfig(payload.config, userId)
      const cacheCount = await storage.getCacheCount(userId)
      // Broadcast to all sessions belonging to this user so open tabs stay synchronized.
      send({ type: 'config_updated', config, cacheCount }, userId)
      break
    }

    case 'clear_cache': {
      const cacheCount = await storage.clearCache(payload.chatId, userId)
      send({ type: 'cache_cleared', chatId: payload.chatId, cacheCount }, userId)
      spindle.toast.info('Caché de traducciones limpiada.', { userId })
      break
    }

    case 'get_chat_messages_meta': {
      try {
        const rawMessages = await spindle.chat.getMessages(payload.chatId)
        const messages: ChatMessageMeta[] = rawMessages.map((m) => ({
          id: m.id,
          isUser: Boolean(m.is_user),
          swipeId: typeof m.swipe_id === 'number' ? m.swipe_id : 0,
        }))
        send({ type: 'chat_messages_meta', chatId: payload.chatId, messages }, userId, frontendSessionId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        spindle.log.warn(`[Translator] No se pudieron leer mensajes del chat: ${msg}`)
      }
      break
    }

    case 'translate_message': {
      await handleTranslateMessage(payload, userId, frontendSessionId)
      break
    }
  }
})

spindle.log.info('[Lumiverse Translator] Backend inicializado.')

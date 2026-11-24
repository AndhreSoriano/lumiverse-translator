import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import { getLanguageShortCode } from '../shared/languages.js'
import type {
  BackendToFrontendMessage,
  ChatMessageMeta,
  FrontendToBackendMessage,
  ProviderId,
  TranslatorConfig,
} from '../shared/types.js'
import { renderTranslatedMarkdown } from './markdown.js'

interface ButtonInjection {
  wrapper: Element
  button: HTMLButtonElement
}

interface PanelInjection {
  wrapper: Element
  panel: HTMLElement
}

interface SessionTranslation {
  swipeId: number
  targetLang: string
  providerId: ProviderId
  translatedText: string
  showing: boolean
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  google: 'Google Translate',
  mymemory: 'MyMemory',
  libretranslate: 'LibreTranslate',
  deepl: 'DeepL',
}

function createTranslateSvg(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('class', 'lumi-tr-icon')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')

  const paths = [
    'm5 8 6 6',
    'm4 14 6-6 2-3',
    'M2 5h12',
    'M7 2h1',
    'm22 22-5-10-5 10',
    'M14 18h6',
  ]
  for (const d of paths) {
    const p = document.createElementNS(ns, 'path')
    p.setAttribute('d', d)
    svg.appendChild(p)
  }
  return svg
}

function createRestoreSvg(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('class', 'lumi-tr-icon')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')

  const p1 = document.createElementNS(ns, 'path')
  p1.setAttribute('d', 'M3 7v6h6')
  const p2 = document.createElementNS(ns, 'path')
  p2.setAttribute('d', 'M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13')
  svg.appendChild(p1)
  svg.appendChild(p2)
  return svg
}

function createSpinnerEl(): HTMLSpanElement {
  const spinner = document.createElement('span')
  spinner.className = 'lumi-tr-spinner'
  spinner.setAttribute('aria-hidden', 'true')
  return spinner
}

function extractFallbackDomText(bubbleEl: Element): string {
  const contentEl = bubbleEl.querySelector('[data-component="MessageContent"]')
  if (!contentEl) return ''
  const clone = contentEl.cloneNode(true) as Element
  for (const ignored of clone.querySelectorAll('.lumi-tr-panel, .lumi-tr-btn-wrap, [data-long-message-toggle]')) {
    ignored.remove()
  }
  return (clone.textContent || '').trim()
}

export interface MessageTranslatorController {
  applyConfig: (next: TranslatorConfig) => void
  handleTranslationResult: (msg: Extract<BackendToFrontendMessage, { type: 'translation_result' }>) => void
  handleChatMessagesMeta: (msg: Extract<BackendToFrontendMessage, { type: 'chat_messages_meta' }>) => void
  translateVisibleBotMessages: () => void
  restoreAllToOriginal: () => void
  destroy: () => void
}

export function createMessageTranslator(
  ctx: SpindleFrontendContext,
  initialConfig: TranslatorConfig,
  onNeedsCorsPermission: (needs: boolean) => void,
): MessageTranslatorController {
  let config: TranslatorConfig = { ...initialConfig }
  let activeChatId: string | null = ctx.getActiveChat().chatId
  let disposed = false
  let syncTimer: ReturnType<typeof setTimeout> | null = null

  const metaByMessageId = new Map<string, ChatMessageMeta>()
  const buttonInjections = new Map<string, ButtonInjection>()
  const panelInjections = new Map<string, PanelInjection>()
  const sessionTranslations = new Map<string, SessionTranslation>()
  const pendingMessages = new Set<string>()
  const errorMessages = new Map<string, string>()

  function sendToBackend(msg: FrontendToBackendMessage): void {
    ctx.sendToBackend(msg)
  }

  function requestChatMeta(chatId: string | null): void {
    if (!chatId) return
    sendToBackend({ type: 'get_chat_messages_meta', chatId })
    if (ctx.messages.list) {
      void ctx.messages
        .list(chatId)
        .then((list) => {
          if (disposed || ctx.getActiveChat().chatId !== chatId || !Array.isArray(list)) return
          for (const item of list) {
            metaByMessageId.set(item.id, {
              id: item.id,
              isUser: Boolean(item.is_user),
              swipeId: typeof item.swipe_id === 'number' ? item.swipe_id : 0,
            })
          }
          syncVisibleMessages()
        })
        .catch(() => {})
    }
  }

  function resolveInnerMessageCard(el: Element | null): Element | null {
    if (!el) return null
    if (!el.hasAttribute('data-virtual-index')) return el
    return el.querySelector('[data-message-id]:not([data-virtual-index])')
  }

  function listInnerMessageCards(): Array<{ messageId: string; element: Element }> {
    const byId = new Map<string, Element>()
    for (const { messageId, element } of ctx.dom.listMessageElements()) {
      if (element.hasAttribute('data-virtual-index')) continue
      if (!byId.has(messageId)) {
        byId.set(messageId, element)
      }
    }
    return Array.from(byId, ([messageId, element]) => ({ messageId, element }))
  }

  function findInnerCardById(messageId: string): Element | null {
    for (const item of ctx.dom.listMessageElements()) {
      if (item.messageId === messageId && !item.element.hasAttribute('data-virtual-index')) {
        return item.element
      }
    }
    return resolveInnerMessageCard(ctx.dom.findMessageElement(messageId))
  }

  function isBotMessage(messageId: string, cardEl: Element): boolean {
    const meta = metaByMessageId.get(messageId)
    if (meta) return !meta.isUser
    const part = cardEl.getAttribute('data-part')
    if (part === 'user') return false
    if (part === 'character' || part === 'streaming') return true

    // Fallback para MinimalMessage antes de recibir metadatos del backend
    const cls = typeof cardEl.className === 'string' ? cardEl.className : ''
    const hasChar = /(?:^|[\s_-])character(?:$|[\s_-])/i.test(cls)
    const hasUser = /(?:^|[\s_-])user(?:$|[\s_-])/i.test(cls)
    if (hasUser && !hasChar) return false
    if (hasChar) return true
    return false
  }

  function updateButtonVisual(messageId: string, btn: HTMLButtonElement): void {
    btn.replaceChildren()
    btn.classList.remove('is-idle', 'is-loading', 'is-active', 'is-error')
    btn.disabled = false

    const shortLang = getLanguageShortCode(config.targetLang)
    const isLoading = pendingMessages.has(messageId)
    const errText = errorMessages.get(messageId)
    const entry = sessionTranslations.get(messageId)
    const isShowing =
      Boolean(entry?.showing) && entry?.targetLang === config.targetLang

    if (isLoading) {
      btn.classList.add('is-loading')
      btn.disabled = true
      btn.title = 'Traduciendo mensaje...'
      btn.appendChild(createSpinnerEl())
      const span = document.createElement('span')
      span.textContent = '...'
      btn.appendChild(span)
      return
    }

    if (errText) {
      btn.classList.add('is-error')
      btn.title = `Error al traducir (${errText}). Clic para reintentar.`
      btn.appendChild(createTranslateSvg())
      const span = document.createElement('span')
      span.textContent = 'Reintentar'
      btn.appendChild(span)
      return
    }

    if (isShowing) {
      btn.classList.add('is-active')
      btn.title = 'Clic para volver al texto original'
      btn.appendChild(createRestoreSvg())
      const span = document.createElement('span')
      span.textContent = `Original · ${shortLang}`
      btn.appendChild(span)
      return
    }

    btn.classList.add('is-idle')
    btn.title = `Traducir mensaje a ${shortLang}`
    btn.appendChild(createTranslateSvg())
    const span = document.createElement('span')
    span.textContent = 'Traducir'
    btn.appendChild(span)
  }

  function removePanel(messageId: string, bubbleEl: Element | null): void {
    const existing = panelInjections.get(messageId)
    if (existing) {
      ctx.dom.uninject(existing.wrapper)
      panelInjections.delete(messageId)
    }
    if (bubbleEl) {
      bubbleEl.removeAttribute('data-lumi-tr-view')
    }
  }

  function removeButton(messageId: string, bubbleEl: Element | null): void {
    const existing = buttonInjections.get(messageId)
    if (existing) {
      ctx.dom.uninject(existing.wrapper)
      buttonInjections.delete(messageId)
    }
    if (bubbleEl) {
      bubbleEl.removeAttribute('data-lumi-tr-bot')
    }
  }

  function syncPanelForMessage(messageId: string, bubbleEl: Element): void {
    const entry = sessionTranslations.get(messageId)
    const currentSwipe = metaByMessageId.get(messageId)?.swipeId ?? 0
    const matchesCurrent =
      Boolean(entry?.showing) &&
      entry?.targetLang === config.targetLang &&
      entry?.swipeId === currentSwipe

    if (!config.enabled || !matchesCurrent || !entry) {
      removePanel(messageId, bubbleEl)
      return
    }

    const contentEl = bubbleEl.querySelector('[data-component="MessageContent"]')
    const existing = panelInjections.get(messageId)
    if (existing && !existing.wrapper.isConnected) {
      ctx.dom.uninject(existing.wrapper)
      panelInjections.delete(messageId)
    }

    let inj = panelInjections.get(messageId)
    if (!inj) {
      const targetEl = contentEl ?? bubbleEl
      const position: InsertPosition = contentEl ? 'afterend' : 'beforeend'
      const wrapper = ctx.dom.inject(targetEl, '<div class="lumi-tr-panel"></div>', position)
      wrapper.classList.add('lumi-tr-panel-host')
      const panel = wrapper.querySelector('.lumi-tr-panel') as HTMLElement
      inj = { wrapper, panel }
      panelInjections.set(messageId, inj)
    }

    if (config.displayMode === 'replace') {
      bubbleEl.setAttribute('data-lumi-tr-view', 'replace')
      inj.panel.classList.remove('is-bilingual')
      inj.panel.innerHTML = renderTranslatedMarkdown(entry.translatedText)
    } else {
      bubbleEl.setAttribute('data-lumi-tr-view', 'bilingual')
      inj.panel.classList.add('is-bilingual')
      const shortLang = getLanguageShortCode(entry.targetLang)
      const providerLabel = PROVIDER_LABELS[entry.providerId] ?? entry.providerId
      inj.panel.innerHTML =
        `<div class="lumi-tr-panel-meta">Traducción (${shortLang}) · ${providerLabel}</div>` +
        renderTranslatedMarkdown(entry.translatedText)
    }
  }

  function ensureButtonForMessage(messageId: string, bubbleEl: Element): void {
    if (!config.enabled || !isBotMessage(messageId, bubbleEl)) {
      removeButton(messageId, bubbleEl)
      removePanel(messageId, bubbleEl)
      return
    }

    bubbleEl.setAttribute('data-lumi-tr-bot', 'true')

    const existing = buttonInjections.get(messageId)
    if (existing && !existing.wrapper.isConnected) {
      ctx.dom.uninject(existing.wrapper)
      buttonInjections.delete(messageId)
    }

    let inj = buttonInjections.get(messageId)
    if (!inj) {
      const wrapper = ctx.dom.inject(
        bubbleEl,
        '<div class="lumi-tr-btn-wrap"><button type="button" class="lumi-tr-btn is-idle"></button></div>',
        'afterbegin',
      )
      wrapper.classList.add('lumi-tr-btn-host')
      const button = wrapper.querySelector('button.lumi-tr-btn') as HTMLButtonElement
      button.addEventListener('click', (event) => {
        event.stopPropagation()
        void handleButtonClick(messageId)
      })
      inj = { wrapper, button }
      buttonInjections.set(messageId, inj)
    }

    updateButtonVisual(messageId, inj.button)
    syncPanelForMessage(messageId, bubbleEl)
  }

  async function requestTranslation(
    messageId: string,
    opts?: { chatId?: string; text?: string; swipeId?: number; forceRefresh?: boolean },
  ): Promise<void> {
    const chatId = opts?.chatId ?? ctx.getActiveChat().chatId
    if (!chatId || !config.enabled) return

    errorMessages.delete(messageId)
    pendingMessages.add(messageId)
    refreshMessageUi(messageId)

    let rawText = opts?.text
    let swipeId = opts?.swipeId ?? metaByMessageId.get(messageId)?.swipeId

    if (!rawText && ctx.messages.get) {
      try {
        const dto = await ctx.messages.get(messageId)
        if (dto) {
          if (dto.is_user) {
            pendingMessages.delete(messageId)
            refreshMessageUi(messageId)
            return
          }
          rawText = dto.content
          swipeId = dto.swipe_id
          metaByMessageId.set(messageId, {
            id: dto.id,
            isUser: dto.is_user,
            swipeId: dto.swipe_id,
          })
        }
      } catch {
        // Fallback to backend chat fetch or DOM text
      }
    }

    const bubbleEl = findInnerCardById(messageId)
    const fallbackText = bubbleEl ? extractFallbackDomText(bubbleEl) : undefined

    sendToBackend({
      type: 'translate_message',
      chatId,
      messageId,
      swipeId,
      text: rawText,
      fallbackText,
      forceRefresh: opts?.forceRefresh,
    })
  }

  async function handleButtonClick(messageId: string): Promise<void> {
    if (pendingMessages.has(messageId) || !config.enabled) return

    const currentSwipe = metaByMessageId.get(messageId)?.swipeId ?? 0
    const existing = sessionTranslations.get(messageId)

    if (
      existing &&
      existing.targetLang === config.targetLang &&
      existing.swipeId === currentSwipe &&
      existing.providerId === config.providerId
    ) {
      existing.showing = !existing.showing
      refreshMessageUi(messageId)
      return
    }

    await requestTranslation(messageId)
  }

  function refreshMessageUi(messageId: string): void {
    const bubbleEl = findInnerCardById(messageId)
    if (!bubbleEl) return
    ensureButtonForMessage(messageId, bubbleEl)
  }

  function syncVisibleMessages(): void {
    if (disposed) return
    const currentChat = ctx.getActiveChat().chatId
    if (currentChat !== activeChatId) {
      handleChatSwitch(currentChat)
    }

    // Limpia cualquier atributo residual en filas externas virtualizadas [data-virtual-index]
    for (const { element } of ctx.dom.listMessageElements()) {
      if (element.hasAttribute('data-virtual-index')) {
        if (element.hasAttribute('data-lumi-tr-bot')) element.removeAttribute('data-lumi-tr-bot')
        if (element.hasAttribute('data-lumi-tr-view')) element.removeAttribute('data-lumi-tr-view')
      }
    }

    const mounted = listInnerMessageCards()
    const mountedIds = new Set<string>()
    for (const { messageId, element } of mounted) {
      mountedIds.add(messageId)
      ensureButtonForMessage(messageId, element)
    }

    for (const [id, inj] of buttonInjections) {
      if (!mountedIds.has(id) && !inj.wrapper.isConnected) {
        // Keep registration when virtualizer unmounted bubble, only drop orphaned if disabled
        if (!config.enabled) {
          ctx.dom.uninject(inj.wrapper)
          buttonInjections.delete(id)
        }
      }
    }
  }

  function scheduleSync(delayMs = 50): void {
    if (disposed || syncTimer !== null) return
    syncTimer = setTimeout(() => {
      syncTimer = null
      syncVisibleMessages()
    }, delayMs)
  }

  function clearAllInjections(): void {
    for (const [id, inj] of buttonInjections) {
      ctx.dom.uninject(inj.wrapper)
      const el = findInnerCardById(id)
      el?.removeAttribute('data-lumi-tr-bot')
    }
    buttonInjections.clear()

    for (const [id, inj] of panelInjections) {
      ctx.dom.uninject(inj.wrapper)
      const el = findInnerCardById(id)
      el?.removeAttribute('data-lumi-tr-view')
    }
    panelInjections.clear()
  }

  function handleChatSwitch(nextChatId: string | null): void {
    activeChatId = nextChatId
    metaByMessageId.clear()
    sessionTranslations.clear()
    pendingMessages.clear()
    errorMessages.clear()
    clearAllInjections()
    if (nextChatId) {
      requestChatMeta(nextChatId)
    }
  }

  // Suscripción a eventos de Lumiverse
  const unsubs: Array<() => void> = []

  unsubs.push(
    ctx.events.on('CHAT_SWITCHED', (raw) => {
      const p = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
      const chatId = typeof p?.chatId === 'string' ? p.chatId : ctx.getActiveChat().chatId
      handleChatSwitch(chatId)
      scheduleSync(60)
    }),
  )

  unsubs.push(
    ctx.events.on('CHAT_CHANGED', () => {
      const current = ctx.getActiveChat().chatId
      if (current !== activeChatId) {
        handleChatSwitch(current)
      }
      scheduleSync(60)
    }),
  )

  unsubs.push(
    ctx.events.on('CHARACTER_MESSAGE_RENDERED', () => {
      scheduleSync(40)
    }),
  )

  // Solo mensajes NUEVOS del bot cuando autoTranslate está activo
  unsubs.push(
    ctx.events.on('GENERATION_ENDED', (raw) => {
      if (!config.enabled || !config.autoTranslate) return
      if (!raw || typeof raw !== 'object') return
      const payload = raw as {
        chatId?: string
        messageId?: string
        content?: string
        error?: string
        generationType?: string
      }

      if (payload.error || !payload.messageId) return
      if (payload.generationType === 'impersonate') return

      const currentChatId = ctx.getActiveChat().chatId
      if (payload.chatId && currentChatId && payload.chatId !== currentChatId) return

      metaByMessageId.set(payload.messageId, {
        id: payload.messageId,
        isUser: false,
        swipeId: metaByMessageId.get(payload.messageId)?.swipeId ?? 0,
      })

      void requestTranslation(payload.messageId, {
        chatId: payload.chatId ?? currentChatId ?? undefined,
        text: payload.content,
      })
    }),
  )

  unsubs.push(
    ctx.events.on('MESSAGE_SWIPED', (raw) => {
      if (!raw || typeof raw !== 'object') return
      const payload = raw as {
        chatId?: string
        action?: string
        swipeId?: number
        message?: { id?: string; is_user?: boolean; content?: string; swipe_id?: number }
      }
      const msg = payload.message
      if (!msg?.id) return

      const swipeId = typeof msg.swipe_id === 'number' ? msg.swipe_id : (payload.swipeId ?? 0)
      metaByMessageId.set(msg.id, {
        id: msg.id,
        isUser: Boolean(msg.is_user),
        swipeId,
      })

      if (!msg.is_user && payload.action === 'added' && config.enabled && config.autoTranslate) {
        void requestTranslation(msg.id, {
          chatId: payload.chatId ?? ctx.getActiveChat().chatId ?? undefined,
          text: msg.content,
          swipeId,
        })
      } else {
        refreshMessageUi(msg.id)
      }
    }),
  )

  unsubs.push(
    ctx.events.on('MESSAGE_EDITED', (raw) => {
      if (!raw || typeof raw !== 'object') return
      const payload = raw as { messageId?: string; id?: string; message?: { id?: string } }
      const id = payload.messageId ?? payload.id ?? payload.message?.id
      if (id) {
        sessionTranslations.delete(id)
        errorMessages.delete(id)
        refreshMessageUi(id)
      }
    }),
  )

  // Observa montaje/desmontaje de burbujas virtualizadas al hacer scroll
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type !== 'childList') continue
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue
        if (
          node.hasAttribute('data-message-id') ||
          node.getAttribute('data-component') === 'MessageContent' ||
          node.querySelector?.('[data-message-id]')
        ) {
          scheduleSync(40)
          return
        }
      }
    }
  })

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true })
  }

  requestChatMeta(activeChatId)
  scheduleSync(80)

  return {
    applyConfig(next: TranslatorConfig) {
      const langOrProviderChanged =
        next.targetLang !== config.targetLang ||
        next.sourceLang !== config.sourceLang ||
        next.providerId !== config.providerId

      config = { ...next }

      if (!config.enabled) {
        clearAllInjections()
        return
      }

      if (langOrProviderChanged) {
        sessionTranslations.clear()
        errorMessages.clear()
      }
      syncVisibleMessages()
    },

    handleTranslationResult(msg) {
      pendingMessages.delete(msg.messageId)
      const currentChatId = ctx.getActiveChat().chatId
      if (currentChatId && msg.chatId !== currentChatId) return

      if (msg.needsCorsPermission) {
        onNeedsCorsPermission(true)
      }

      if (msg.error) {
        errorMessages.set(msg.messageId, msg.error)
        refreshMessageUi(msg.messageId)
        return
      }

      onNeedsCorsPermission(false)
      errorMessages.delete(msg.messageId)
      metaByMessageId.set(msg.messageId, {
        id: msg.messageId,
        isUser: false,
        swipeId: msg.swipeId,
      })

      sessionTranslations.set(msg.messageId, {
        swipeId: msg.swipeId,
        targetLang: msg.targetLang,
        providerId: msg.providerId,
        translatedText: msg.translatedText,
        showing: true,
      })
      refreshMessageUi(msg.messageId)
    },

    handleChatMessagesMeta(msg) {
      const currentChatId = ctx.getActiveChat().chatId
      if (currentChatId && msg.chatId !== currentChatId) return
      for (const item of msg.messages) {
        metaByMessageId.set(item.id, item)
      }
      syncVisibleMessages()
    },

    translateVisibleBotMessages() {
      if (!config.enabled) return
      const mounted = listInnerMessageCards()
      for (const { messageId, element } of mounted) {
        if (!isBotMessage(messageId, element)) continue
        const existing = sessionTranslations.get(messageId)
        const currentSwipe = metaByMessageId.get(messageId)?.swipeId ?? 0
        if (
          existing &&
          existing.targetLang === config.targetLang &&
          existing.swipeId === currentSwipe &&
          existing.providerId === config.providerId
        ) {
          existing.showing = true
          refreshMessageUi(messageId)
        } else {
          void requestTranslation(messageId)
        }
      }
    },

    restoreAllToOriginal() {
      for (const entry of sessionTranslations.values()) {
        entry.showing = false
      }
      syncVisibleMessages()
    },

    destroy() {
      disposed = true
      if (syncTimer !== null) {
        clearTimeout(syncTimer)
        syncTimer = null
      }
      observer.disconnect()
      for (const unsub of unsubs) {
        try {
          unsub()
        } catch {
          // ignore
        }
      }
      clearAllInjections()
      metaByMessageId.clear()
      sessionTranslations.clear()
      pendingMessages.clear()
      errorMessages.clear()
    },
  }
}

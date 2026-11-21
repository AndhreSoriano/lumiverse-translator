import type {
  SpindleBadgeHandle,
  SpindleCollapsibleSectionHandle,
  SpindleFrontendContext,
  SpindleSelectHandle,
  SpindleSelectOption,
  SpindleSwitchHandle,
  SpindleTextInputHandle,
} from 'lumiverse-spindle-types'
import { LANGUAGE_OPTIONS, SOURCE_LANGUAGE_OPTIONS } from '../shared/languages.js'
import { DEFAULT_CONFIG, type DisplayMode, type ProviderId, type TranslatorConfig } from '../shared/types.js'

const TRANSLATOR_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>'

const TARGET_OPTIONS: SpindleSelectOption[] = LANGUAGE_OPTIONS.map((lang) => ({
  value: lang.code,
  label: lang.label,
  sublabel: `${lang.nativeName} · ${lang.code}`,
}))

const SOURCE_OPTIONS: SpindleSelectOption[] = SOURCE_LANGUAGE_OPTIONS.map((lang) => ({
  value: lang.code,
  label: lang.label,
  sublabel: lang.code === 'auto' ? 'Recomendado' : `${lang.nativeName} · ${lang.code}`,
}))

const PROVIDER_OPTIONS: SpindleSelectOption[] = [
  { value: 'google', label: 'Google Translate', sublabel: 'Gratis · sin API Key (por defecto)' },
  { value: 'mymemory', label: 'MyMemory', sublabel: 'Gratis · útil como respaldo' },
  { value: 'libretranslate', label: 'LibreTranslate', sublabel: 'Self-hosted o instancia propia' },
  { value: 'deepl', label: 'DeepL API', sublabel: 'Alta calidad · requiere API Key' },
]

const DISPLAY_MODE_OPTIONS: SpindleSelectOption[] = [
  {
    value: 'replace',
    label: 'Reemplazar texto visualmente',
    sublabel: 'Oculta el original en pantalla y vuelve con un clic',
  },
  {
    value: 'bilingual',
    label: 'Mostrar debajo (Bilingüe)',
    sublabel: 'Conserva el mensaje original y añade la traducción',
  },
]

const DEEPL_PLAN_OPTIONS: SpindleSelectOption[] = [
  { value: 'free', label: 'DeepL Free (api-free.deepl.com)' },
  { value: 'pro', label: 'DeepL Pro (api.deepl.com)' },
]

export interface DrawerMenuCallbacks {
  onConfigPatch: (patch: Partial<TranslatorConfig>) => void
  onTranslateVisible: () => void
  onRestoreAll: () => void
  onClearCache: () => void
}

export interface DrawerMenuHandle {
  syncConfig: (config: TranslatorConfig, cacheCount?: number) => void
  setNeedsCorsPermission: (needs: boolean) => void
  destroy: () => void
}

function makeField(parent: HTMLElement, labelText: string, hintText?: string): HTMLDivElement {
  const field = document.createElement('div')
  field.className = 'lumi-tr-field'

  const label = document.createElement('div')
  label.className = 'lumi-tr-label'
  label.textContent = labelText
  field.appendChild(label)

  const slot = document.createElement('div')
  field.appendChild(slot)

  if (hintText) {
    const hint = document.createElement('div')
    hint.className = 'lumi-tr-hint'
    hint.textContent = hintText
    field.appendChild(hint)
  }

  parent.appendChild(field)
  return slot
}

function makeSwitchRow(
  parent: HTMLElement,
  labelText: string,
  hintText: string,
): HTMLDivElement {
  const container = document.createElement('div')
  container.className = 'lumi-tr-field'

  const row = document.createElement('div')
  row.className = 'lumi-tr-row'

  const textCol = document.createElement('div')
  textCol.className = 'lumi-tr-title-col'

  const label = document.createElement('div')
  label.className = 'lumi-tr-label'
  label.textContent = labelText
  textCol.appendChild(label)

  const hint = document.createElement('div')
  hint.className = 'lumi-tr-hint'
  hint.textContent = hintText
  textCol.appendChild(hint)

  const slot = document.createElement('div')
  row.appendChild(textCol)
  row.appendChild(slot)
  container.appendChild(row)
  parent.appendChild(container)
  return slot
}

export function createDrawerMenu(
  ctx: SpindleFrontendContext,
  initialConfig: TranslatorConfig,
  callbacks: DrawerMenuCallbacks,
): DrawerMenuHandle {
  let currentConfig: TranslatorConfig = { ...initialConfig }
  let currentCacheCount = 0
  let syncing = false
  const timers = new Set<ReturnType<typeof setTimeout>>()

  const tab = ctx.ui.registerDrawerTab({
    id: 'lumi-translator',
    title: 'Traductor',
    shortName: 'Traducir',
    description: 'Traduce mensajes del bot/personaje con Google Translate y otros motores',
    keywords: ['translate', 'traducir', 'traductor', 'idioma', 'google', 'deepl'],
    iconSvg: TRANSLATOR_ICON_SVG,
  })

  const root = document.createElement('div')
  root.className = 'lumi-tr-drawer'
  tab.root.appendChild(root)

  // Header
  const headerCard = document.createElement('div')
  headerCard.className = 'lumi-tr-header-card'
  const titleCol = document.createElement('div')
  titleCol.className = 'lumi-tr-title-col'
  const titleEl = document.createElement('div')
  titleEl.className = 'lumi-tr-title'
  titleEl.textContent = 'Lumiverse Translator'
  const subtitleEl = document.createElement('div')
  subtitleEl.className = 'lumi-tr-subtitle'
  subtitleEl.textContent = 'Botón superior izquierdo en mensajes del bot'
  titleCol.appendChild(titleEl)
  titleCol.appendChild(subtitleEl)
  const badgeSlot = document.createElement('div')
  headerCard.appendChild(titleCol)
  headerCard.appendChild(badgeSlot)
  root.appendChild(headerCard)

  const statusBadge: SpindleBadgeHandle = ctx.components.mountBadge(badgeSlot, {
    text: currentConfig.enabled ? 'Activo' : 'Pausado',
    color: currentConfig.enabled ? 'success' : 'neutral',
    size: 'pill',
  })

  // Banner de permisos (visible solo si falta cors_proxy)
  const permBanner = document.createElement('div')
  permBanner.className = 'lumi-tr-perm-banner'
  permBanner.style.display = 'none'
  const permText = document.createElement('div')
  permText.textContent =
    'Falta el permiso cors_proxy para consultar Google Translate u otros motores externos.'
  const permBtn = document.createElement('button')
  permBtn.type = 'button'
  permBtn.className = 'lumi-tr-action-btn is-primary'
  permBtn.textContent = 'Conceder permisos necesarios'
  permBtn.addEventListener('click', () => {
    void ctx.permissions
      .request(['cors_proxy', 'chats'], {
        reason:
          'Permite traducir mensajes del bot usando Google Translate, MyMemory, LibreTranslate o DeepL sin modificar tu historial.',
      })
      .then((granted) => {
        if (granted.includes('cors_proxy')) {
          permBanner.style.display = 'none'
        }
      })
      .catch(() => {})
  })
  permBanner.appendChild(permText)
  permBanner.appendChild(permBtn)
  root.appendChild(permBanner)

  void ctx.permissions
    .getGranted()
    .then((granted) => {
      if (!granted.includes('cors_proxy')) {
        permBanner.style.display = 'flex'
      }
    })
    .catch(() => {})

  // Sección principal: estado, idiomas, modo automático y visualización
  const mainSection = document.createElement('div')
  mainSection.className = 'lumi-tr-section'
  root.appendChild(mainSection)

  const enabledSlot = makeSwitchRow(
    mainSection,
    'Activar traductor',
    'Muestra el botón de traducción en la esquina superior izquierda del bot.',
  )
  const enabledSwitch: SpindleSwitchHandle = ctx.components.mountSwitch(enabledSlot, {
    checked: currentConfig.enabled,
    ariaLabel: 'Activar traductor',
    onChange: (checked) => {
      if (!syncing) callbacks.onConfigPatch({ enabled: checked })
    },
  })

  const autoSlot = makeSwitchRow(
    mainSection,
    'Traducir automáticamente mensajes nuevos',
    'Cada respuesta nueva generada por el bot se traducirá al instante al finalizar.',
  )
  const autoSwitch: SpindleSwitchHandle = ctx.components.mountSwitch(autoSlot, {
    checked: currentConfig.autoTranslate,
    ariaLabel: 'Traducir automáticamente mensajes nuevos del bot',
    onChange: (checked) => {
      if (!syncing) callbacks.onConfigPatch({ autoTranslate: checked })
    },
  })

  const targetSlot = makeField(mainSection, 'Traducir al idioma')
  const targetSelect: SpindleSelectHandle = ctx.components.mountSelect(targetSlot, {
    value: currentConfig.targetLang,
    options: TARGET_OPTIONS,
    searchThreshold: 6,
    searchPlaceholder: 'Buscar idioma...',
    ariaLabel: 'Idioma de destino',
    onChange: (value) => {
      if (!syncing && value) callbacks.onConfigPatch({ targetLang: value })
    },
  })

  const sourceSlot = makeField(mainSection, 'Idioma original')
  const sourceSelect: SpindleSelectHandle = ctx.components.mountSelect(sourceSlot, {
    value: currentConfig.sourceLang,
    options: SOURCE_OPTIONS,
    searchThreshold: 6,
    searchPlaceholder: 'Buscar idioma...',
    ariaLabel: 'Idioma de origen',
    onChange: (value) => {
      if (!syncing && value) callbacks.onConfigPatch({ sourceLang: value })
    },
  })

  const displaySlot = makeField(mainSection, 'Cómo mostrar la traducción')
  const displaySelect: SpindleSelectHandle = ctx.components.mountSelect(displaySlot, {
    value: currentConfig.displayMode,
    options: DISPLAY_MODE_OPTIONS,
    searchThreshold: 99,
    ariaLabel: 'Modo de visualización',
    onChange: (value) => {
      if (!syncing && (value === 'replace' || value === 'bilingual')) {
        callbacks.onConfigPatch({ displayMode: value as DisplayMode })
      }
    },
  })

  // Sección plegable: motor de traducción y credenciales opcionales
  const providerSectionWrap = document.createElement('div')
  root.appendChild(providerSectionWrap)
  const providerCollapsible: SpindleCollapsibleSectionHandle = ctx.components.mountCollapsibleSection(
    providerSectionWrap,
    {
      title: 'Motor de traducción',
      badge: 'Google',
      defaultExpanded: false,
    },
  )

  const providerBody = document.createElement('div')
  providerBody.className = 'lumi-tr-section'
  providerCollapsible.body.appendChild(providerBody)

  const providerSlot = makeField(providerBody, 'Proveedor activo')
  const providerSelect: SpindleSelectHandle = ctx.components.mountSelect(providerSlot, {
    value: currentConfig.providerId,
    options: PROVIDER_OPTIONS,
    searchThreshold: 99,
    ariaLabel: 'Proveedor de traducción',
    onChange: (value) => {
      if (!syncing && value) {
        callbacks.onConfigPatch({ providerId: value as ProviderId })
      }
    },
  })

  const fallbackSlot = makeSwitchRow(
    providerBody,
    'Respaldo automático (MyMemory)',
    'Si el motor principal falla o alcanza límite temporal, reintenta con MyMemory.',
  )
  const fallbackSwitch: SpindleSwitchHandle = ctx.components.mountSwitch(fallbackSlot, {
    checked: currentConfig.fallbackToMyMemory,
    ariaLabel: 'Respaldo automático con MyMemory',
    onChange: (checked) => {
      if (!syncing) callbacks.onConfigPatch({ fallbackToMyMemory: checked })
    },
  })

  const debouncedPatch = (key: keyof TranslatorConfig, val: string) => {
    const t = setTimeout(() => {
      timers.delete(t)
      callbacks.onConfigPatch({ [key]: val } as Partial<TranslatorConfig>)
    }, 350)
    timers.add(t)
  }

  // Campos condicionales por proveedor
  const libreGroup = document.createElement('div')
  libreGroup.className = 'lumi-tr-field'
  providerBody.appendChild(libreGroup)
  const libreUrlSlot = makeField(
    libreGroup,
    'URL de LibreTranslate',
    'Ejemplo: http://localhost:5000 o tu instancia self-hosted',
  )
  const libreUrlInput: SpindleTextInputHandle = ctx.components.mountTextInput(libreUrlSlot, {
    value: currentConfig.libreTranslateUrl,
    placeholder: DEFAULT_CONFIG.libreTranslateUrl,
    ariaLabel: 'URL de LibreTranslate',
    onChange: (val) => {
      if (!syncing) debouncedPatch('libreTranslateUrl', val)
    },
  })
  const libreKeySlot = makeField(libreGroup, 'API Key de LibreTranslate (opcional)')
  const libreKeyInput: SpindleTextInputHandle = ctx.components.mountTextInput(libreKeySlot, {
    value: currentConfig.libreTranslateApiKey,
    placeholder: 'Opcional si tu instancia no requiere clave',
    ariaLabel: 'API Key de LibreTranslate',
    onChange: (val) => {
      if (!syncing) debouncedPatch('libreTranslateApiKey', val)
    },
  })

  const deeplGroup = document.createElement('div')
  deeplGroup.className = 'lumi-tr-field'
  providerBody.appendChild(deeplGroup)
  const deeplPlanSlot = makeField(deeplGroup, 'Plan de DeepL')
  const deeplPlanSelect: SpindleSelectHandle = ctx.components.mountSelect(deeplPlanSlot, {
    value: currentConfig.deeplPlan,
    options: DEEPL_PLAN_OPTIONS,
    searchThreshold: 99,
    ariaLabel: 'Plan DeepL',
    onChange: (val) => {
      if (!syncing && (val === 'free' || val === 'pro')) {
        callbacks.onConfigPatch({ deeplPlan: val })
      }
    },
  })
  const deeplKeySlot = makeField(deeplGroup, 'API Key de DeepL')
  const deeplKeyInput: SpindleTextInputHandle = ctx.components.mountTextInput(deeplKeySlot, {
    value: currentConfig.deeplApiKey,
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx',
    ariaLabel: 'API Key de DeepL',
    onChange: (val) => {
      if (!syncing) debouncedPatch('deeplApiKey', val)
    },
  })

  const myMemoryGroup = document.createElement('div')
  myMemoryGroup.className = 'lumi-tr-field'
  providerBody.appendChild(myMemoryGroup)
  const myMemoryEmailSlot = makeField(
    myMemoryGroup,
    'Email para MyMemory (opcional)',
    'Aumenta la cuota diaria gratuita de MyMemory.',
  )
  const myMemoryEmailInput: SpindleTextInputHandle = ctx.components.mountTextInput(myMemoryEmailSlot, {
    value: currentConfig.myMemoryEmail,
    placeholder: 'tu@correo.com',
    ariaLabel: 'Email para MyMemory',
    onChange: (val) => {
      if (!syncing) debouncedPatch('myMemoryEmail', val)
    },
  })

  // Acciones rápidas
  const actionsSection = document.createElement('div')
  actionsSection.className = 'lumi-tr-section'
  const actionsTitle = document.createElement('div')
  actionsTitle.className = 'lumi-tr-label'
  actionsTitle.textContent = 'Acciones rápidas en el chat'
  const actionsWrap = document.createElement('div')
  actionsWrap.className = 'lumi-tr-actions'

  const translateVisibleBtn = document.createElement('button')
  translateVisibleBtn.type = 'button'
  translateVisibleBtn.className = 'lumi-tr-action-btn is-primary'
  translateVisibleBtn.textContent = 'Traducir mensajes visibles del bot'
  translateVisibleBtn.addEventListener('click', () => callbacks.onTranslateVisible())

  const restoreAllBtn = document.createElement('button')
  restoreAllBtn.type = 'button'
  restoreAllBtn.className = 'lumi-tr-action-btn'
  restoreAllBtn.textContent = 'Restaurar todos al original'
  restoreAllBtn.addEventListener('click', () => callbacks.onRestoreAll())

  const clearCacheBtn = document.createElement('button')
  clearCacheBtn.type = 'button'
  clearCacheBtn.className = 'lumi-tr-action-btn is-danger'
  clearCacheBtn.textContent = 'Limpiar caché de traducciones (0)'
  clearCacheBtn.addEventListener('click', () => callbacks.onClearCache())

  actionsWrap.appendChild(translateVisibleBtn)
  actionsWrap.appendChild(restoreAllBtn)
  actionsWrap.appendChild(clearCacheBtn)
  actionsSection.appendChild(actionsTitle)
  actionsSection.appendChild(actionsWrap)
  root.appendChild(actionsSection)

  function updateConditionalGroups(cfg: TranslatorConfig) {
    libreGroup.style.display = cfg.providerId === 'libretranslate' ? 'flex' : 'none'
    deeplGroup.style.display = cfg.providerId === 'deepl' ? 'flex' : 'none'
    myMemoryGroup.style.display =
      cfg.providerId === 'mymemory' || cfg.fallbackToMyMemory ? 'flex' : 'none'

    const badgeMap: Record<ProviderId, string> = {
      google: 'Google',
      mymemory: 'MyMemory',
      libretranslate: 'Libre',
      deepl: 'DeepL',
    }
    providerCollapsible.update({ badge: badgeMap[cfg.providerId] })
  }

  function syncConfig(config: TranslatorConfig, cacheCount?: number) {
    currentConfig = { ...config }
    if (typeof cacheCount === 'number') currentCacheCount = cacheCount

    syncing = true
    try {
      statusBadge.update({
        text: config.enabled ? 'Activo' : 'Pausado',
        color: config.enabled ? 'success' : 'neutral',
      })
      enabledSwitch.update({ checked: config.enabled })
      autoSwitch.update({ checked: config.autoTranslate })
      targetSelect.update({ value: config.targetLang })
      sourceSelect.update({ value: config.sourceLang })
      displaySelect.update({ value: config.displayMode })
      providerSelect.update({ value: config.providerId })
      fallbackSwitch.update({ checked: config.fallbackToMyMemory })
      libreUrlInput.update({ value: config.libreTranslateUrl })
      libreKeyInput.update({ value: config.libreTranslateApiKey })
      deeplPlanSelect.update({ value: config.deeplPlan })
      deeplKeyInput.update({ value: config.deeplApiKey })
      myMemoryEmailInput.update({ value: config.myMemoryEmail })
      clearCacheBtn.textContent = `Limpiar caché de traducciones (${currentCacheCount})`
      updateConditionalGroups(config)
    } finally {
      syncing = false
    }
  }

  updateConditionalGroups(currentConfig)

  return {
    syncConfig,
    setNeedsCorsPermission(needs: boolean) {
      permBanner.style.display = needs ? 'flex' : 'none'
    },
    destroy() {
      for (const t of timers) clearTimeout(t)
      timers.clear()
      statusBadge.destroy()
      enabledSwitch.destroy()
      autoSwitch.destroy()
      targetSelect.destroy()
      sourceSelect.destroy()
      displaySelect.destroy()
      providerSelect.destroy()
      fallbackSwitch.destroy()
      libreUrlInput.destroy()
      libreKeyInput.destroy()
      deeplPlanSelect.destroy()
      deeplKeyInput.destroy()
      myMemoryEmailInput.destroy()
      providerCollapsible.destroy()
      tab.destroy()
    },
  }
}

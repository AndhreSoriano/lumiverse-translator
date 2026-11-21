import type { SpindleFrontendContext, SpindleFrontendTeardown } from 'lumiverse-spindle-types'
import { DEFAULT_CONFIG, type BackendToFrontendMessage, type TranslatorConfig } from './shared/types.js'
import { createDrawerMenu } from './frontend/drawerMenu.js'
import { createMessageTranslator } from './frontend/messageTranslator.js'
import { TRANSLATOR_STYLES } from './frontend/styles.js'

export function setup(ctx: SpindleFrontendContext): SpindleFrontendTeardown {
  let currentConfig: TranslatorConfig = { ...DEFAULT_CONFIG }

  const removeStyle = ctx.dom.addStyle(TRANSLATOR_STYLES)

  const translator = createMessageTranslator(ctx, currentConfig, (needs) => {
    drawerMenu.setNeedsCorsPermission(needs)
  })

  const drawerMenu = createDrawerMenu(ctx, currentConfig, {
    onConfigPatch(patch) {
      currentConfig = { ...currentConfig, ...patch }
      translator.applyConfig(currentConfig)
      ctx.sendToBackend({ type: 'save_config', config: patch })
    },
    onTranslateVisible() {
      translator.translateVisibleBotMessages()
    },
    onRestoreAll() {
      translator.restoreAllToOriginal()
    },
    onClearCache() {
      ctx.sendToBackend({ type: 'clear_cache' })
    },
  })

  const unsubBackend = ctx.onBackendMessage((raw) => {
    if (!raw || typeof raw !== 'object') return
    const msg = raw as BackendToFrontendMessage

    switch (msg.type) {
      case 'config_updated': {
        currentConfig = { ...msg.config }
        drawerMenu.syncConfig(currentConfig, msg.cacheCount)
        translator.applyConfig(currentConfig)
        break
      }
      case 'translation_result': {
        translator.handleTranslationResult(msg)
        break
      }
      case 'cache_cleared': {
        drawerMenu.syncConfig(currentConfig, msg.cacheCount)
        break
      }
      case 'chat_messages_meta': {
        translator.handleChatMessagesMeta(msg)
        break
      }
    }
  })

  ctx.sendToBackend({ type: 'get_config' })

  const cleanup = () => {
    unsubBackend()
    translator.destroy()
    drawerMenu.destroy()
    removeStyle()
  }

  ctx.onTeardown?.(cleanup)
  return cleanup
}

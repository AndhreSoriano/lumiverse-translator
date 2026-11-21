export interface LanguageOption {
  code: string
  label: string
  nativeName: string
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: 'es', label: 'Español', nativeName: 'Español' },
  { code: 'en', label: 'Inglés', nativeName: 'English' },
  { code: 'pt', label: 'Portugués', nativeName: 'Português' },
  { code: 'fr', label: 'Francés', nativeName: 'Français' },
  { code: 'de', label: 'Alemán', nativeName: 'Deutsch' },
  { code: 'it', label: 'Italiano', nativeName: 'Italiano' },
  { code: 'ja', label: 'Japonés', nativeName: '日本語' },
  { code: 'ko', label: 'Coreano', nativeName: '한국어' },
  { code: 'zh-CN', label: 'Chino (Simplificado)', nativeName: '简体中文' },
  { code: 'zh-TW', label: 'Chino (Tradicional)', nativeName: '繁體中文' },
  { code: 'ru', label: 'Ruso', nativeName: 'Русский' },
  { code: 'ar', label: 'Árabe', nativeName: 'العربية' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pl', label: 'Polaco', nativeName: 'Polski' },
  { code: 'nl', label: 'Neerlandés', nativeName: 'Nederlands' },
  { code: 'tr', label: 'Turco', nativeName: 'Türkçe' },
  { code: 'sv', label: 'Sueco', nativeName: 'Svenska' },
  { code: 'uk', label: 'Ucraniano', nativeName: 'Українська' },
  { code: 'vi', label: 'Vietnamita', nativeName: 'Tiếng Việt' },
  { code: 'th', label: 'Tailandés', nativeName: 'ไทย' },
  { code: 'id', label: 'Indonesio', nativeName: 'Bahasa Indonesia' },
  { code: 'ca', label: 'Catalán', nativeName: 'Català' },
  { code: 'gl', label: 'Gallego', nativeName: 'Galego' },
  { code: 'eu', label: 'Euskera', nativeName: 'Euskara' },
]

export const SOURCE_LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: 'auto', label: 'Detectar automáticamente', nativeName: 'Auto' },
  ...LANGUAGE_OPTIONS,
]

export function getLanguageLabel(code: string): string {
  if (code === 'auto') return 'Detectar automáticamente'
  const found = LANGUAGE_OPTIONS.find((item) => item.code === code)
  return found ? `${found.label} (${found.nativeName})` : code
}

export function getLanguageShortCode(code: string): string {
  return code.split('-')[0].toUpperCase()
}

export function toDeepLTargetLang(code: string): string {
  const map: Record<string, string> = {
    en: 'EN-US',
    pt: 'PT-BR',
    'zh-CN': 'ZH-HANS',
    'zh-TW': 'ZH-HANT',
  }
  return map[code] ?? code.split('-')[0].toUpperCase()
}

export function toDeepLSourceLang(code: string): string {
  if (code === 'zh-CN' || code === 'zh-TW') return 'ZH'
  return code.split('-')[0].toUpperCase()
}

export function toMyMemoryLang(code: string): string {
  if (code === 'zh-CN' || code === 'zh-TW') return code
  return code.split('-')[0].toLowerCase()
}

export function toLibreTranslateLang(code: string): string {
  if (code === 'auto') return 'auto'
  if (code === 'zh-CN' || code === 'zh-TW') return 'zh'
  return code.split('-')[0].toLowerCase()
}

export interface ProtectedTextResult {
  masked: string
  tokens: string[]
}

export interface TextChunk {
  text: string
  separator: string
}

const TOKEN_PREFIX = '[[LT'
const TOKEN_SUFFIX = ']]'

/** Pure-JS FNV-1a 32-bit hex hash (avoids Node crypto dependency in Spindle workers). */
export function hashText(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * Replaces code blocks, inline code, HTML/XML tags and URLs with opaque markers
 * so translation engines do not alter code syntax or markup attributes.
 */
export function protectSegments(text: string): ProtectedTextResult {
  const tokens: string[] = []
  const stash = (segment: string): string => {
    const idx = tokens.length
    tokens.push(segment)
    return `${TOKEN_PREFIX}${idx}${TOKEN_SUFFIX}`
  }

  let masked = text
  // 1. Fenced code blocks (```...```)
  masked = masked.replace(/```[\s\S]*?```/g, (m) => stash(m))
  // 2. Inline code (`...`)
  masked = masked.replace(/`[^`\n]+`/g, (m) => stash(m))
  // 3. HTML/XML tags (e.g. <details>, <status>, <br/>)
  masked = masked.replace(/<\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\s+[^<>]*)?\/?>/g, (m) => stash(m))
  // 4. Explicit HTTP/HTTPS URLs
  masked = masked.replace(/https?:\/\/[^\s<>)\]]+/g, (m) => stash(m))

  return { masked, tokens }
}

/** Restores protected segments even if a translator inserted spaces inside the marker. */
export function restoreSegments(text: string, tokens: string[]): string {
  if (tokens.length === 0) return text
  return text.replace(/\[\[\s*LT\s*(\d+)\s*\]\]/gi, (full, rawIdx) => {
    const idx = Number(rawIdx)
    return Number.isInteger(idx) && idx >= 0 && idx < tokens.length ? tokens[idx] : full
  })
}

/** Splits long roleplay messages into bounded chunks while preserving exact separators. */
export function splitIntoChunks(text: string, maxChars = 3200): TextChunk[] {
  if (!text) return []
  if (text.length <= maxChars) return [{ text, separator: '' }]

  const rawUnits = splitByRegexWithSeparators(text, /(\n\n+)/)
  const sizedUnits: TextChunk[] = []

  for (const unit of rawUnits) {
    if (unit.text.length <= maxChars) {
      sizedUnits.push(unit)
      continue
    }
    const lineUnits = splitOversizedUnit(unit.text, maxChars, /(\n)/)
    attachTrailingSeparator(lineUnits, unit.separator)
    sizedUnits.push(...lineUnits)
  }

  return mergeSmallChunks(sizedUnits, maxChars)
}

function splitOversizedUnit(text: string, maxChars: number, primarySep: RegExp): TextChunk[] {
  const parts = splitByRegexWithSeparators(text, primarySep)
  const out: TextChunk[] = []
  for (const part of parts) {
    if (part.text.length <= maxChars) {
      out.push(part)
      continue
    }
    const sentenceUnits = splitBySentence(part.text, maxChars)
    attachTrailingSeparator(sentenceUnits, part.separator)
    out.push(...sentenceUnits)
  }
  return out
}

function splitBySentence(text: string, maxChars: number): TextChunk[] {
  const parts = splitByRegexWithSeparators(text, /((?<=[.!?…。！？])\s+)/)
  const out: TextChunk[] = []
  for (const part of parts) {
    if (part.text.length <= maxChars) {
      out.push(part)
      continue
    }
    const hardSlices = hardSplit(part.text, maxChars)
    attachTrailingSeparator(hardSlices, part.separator)
    out.push(...hardSlices)
  }
  return out
}

function hardSplit(text: string, maxChars: number): TextChunk[] {
  const chunks: TextChunk[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length)
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end)
      if (lastSpace > start + Math.floor(maxChars * 0.5)) {
        end = lastSpace + 1
      }
    }
    chunks.push({ text: text.slice(start, end), separator: '' })
    start = end
  }
  return chunks
}

function splitByRegexWithSeparators(text: string, sepRegex: RegExp): TextChunk[] {
  const tokens = text.split(sepRegex)
  const result: TextChunk[] = []
  for (let i = 0; i < tokens.length; i += 2) {
    const body = tokens[i] ?? ''
    const sep = tokens[i + 1] ?? ''
    if (body.length === 0 && sep.length === 0) continue
    result.push({ text: body, separator: sep })
  }
  return result
}

function attachTrailingSeparator(chunks: TextChunk[], separator: string): void {
  if (chunks.length > 0 && separator) {
    chunks[chunks.length - 1].separator += separator
  }
}

function mergeSmallChunks(units: TextChunk[], maxChars: number): TextChunk[] {
  const merged: TextChunk[] = []
  let currentText = ''
  let currentSep = ''

  for (const unit of units) {
    if (!currentText) {
      currentText = unit.text
      currentSep = unit.separator
      continue
    }
    const candidate = `${currentText}${currentSep}${unit.text}`
    if (candidate.length <= maxChars) {
      currentText = candidate
      currentSep = unit.separator
    } else {
      merged.push({ text: currentText, separator: currentSep })
      currentText = unit.text
      currentSep = unit.separator
    }
  }

  if (currentText || currentSep) {
    merged.push({ text: currentText, separator: currentSep })
  }
  return merged
}

/**
 * Cleans extra spaces that automated translators often introduce inside
 * roleplay emphasis spans like `* camina lentamente *` without harming Markdown lists.
 */
export function normalizeRoleplayFormatting(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*[-*+]\s+/.test(line) && (line.match(/\*/g)?.length ?? 0) === 1) {
        return line
      }
      // Trim spaces immediately inside **bold** pairs on a line
      let fixed = line.replace(/\*\*([^*\n]+?)\*\*/g, (_, inner: string) => `**${inner.trim()}**`)
      // Trim spaces immediately inside *action* pairs when not preceded by list bullet
      fixed = fixed.replace(/(^|[^\w*])\*([^*\n]+?)\*(?!\*)/g, (full, prefix: string, inner: string) => {
        if (!inner.trim()) return full
        return `${prefix}*${inner.trim()}*`
      })
      return fixed
    })
    .join('\n')
}

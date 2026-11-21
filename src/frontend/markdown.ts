function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeSafeUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (/^https?:\/\/[^\s<>"']+$/i.test(trimmed)) {
    return escapeHtml(trimmed)
  }
  return null
}

function formatInlineMarkdown(escapedLine: string): string {
  const inlineCodes: string[] = []
  let out = escapedLine.replace(/`([^`\n]+)`/g, (_, code: string) => {
    const idx = inlineCodes.length
    inlineCodes.push(`<code class="lumi-tr-inline-code">${code}</code>`)
    return `\u0000IC${idx}\u0000`
  })

  out = out.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (full, label: string, url: string) => {
    const safeUrl = sanitizeSafeUrl(url)
    if (!safeUrl) return label
    return `<a class="lumi-tr-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`
  })

  out = out.replace(/\*\*\*([^*\n]+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>')
  out = out.replace(/(^|[^\w*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^\w_])_([^_\n]+?)_(?!_)/g, '$1<em>$2</em>')

  out = out.replace(/\u0000IC(\d+)\u0000/g, (_, idxStr: string) => {
    return inlineCodes[Number(idxStr)] ?? ''
  })

  return out
}

function renderBlock(rawEscapedBlock: string, codeBlocks: string[]): string {
  const block = rawEscapedBlock.trim()
  if (!block) return ''

  const pureCodeMatch = /^\u0000CB(\d+)\u0000$/.exec(block)
  if (pureCodeMatch) {
    return codeBlocks[Number(pureCodeMatch[1])] ?? ''
  }

  const lines = block.split('\n')

  if (lines.length === 1) {
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(lines[0])
    if (headingMatch) {
      const level = headingMatch[1].length
      return `<h${level} class="lumi-tr-heading">${formatInlineMarkdown(headingMatch[2])}</h${level}>`
    }
  }

  if (lines.every((l) => /^&gt;\s?/.test(l))) {
    const inner = lines.map((l) => formatInlineMarkdown(l.replace(/^&gt;\s?/, ''))).join('<br>')
    return `<blockquote class="lumi-tr-quote">${inner}</blockquote>`
  }

  if (lines.every((l) => /^\s*[-*+]\s+/.test(l))) {
    const items = lines
      .map((l) => `<li>${formatInlineMarkdown(l.replace(/^\s*[-*+]\s+/, ''))}</li>`)
      .join('')
    return `<ul class="lumi-tr-list">${items}</ul>`
  }

  if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
    const items = lines
      .map((l) => `<li>${formatInlineMarkdown(l.replace(/^\s*\d+\.\s+/, ''))}</li>`)
      .join('')
    return `<ol class="lumi-tr-list">${items}</ol>`
  }

  const htmlLines = lines.map((line) => {
    const cbOnly = /^\u0000CB(\d+)\u0000$/.exec(line.trim())
    if (cbOnly) return codeBlocks[Number(cbOnly[1])] ?? ''
    return formatInlineMarkdown(line)
  })

  return `<p class="lumi-tr-p">${htmlLines.join('<br>')}</p>`.replace(
    /\u0000CB(\d+)\u0000/g,
    (_, idxStr: string) => codeBlocks[Number(idxStr)] ?? '',
  )
}

/**
 * Converts translated Markdown/roleplay prose into sanitized HTML without allowing
 * arbitrary raw HTML tags or unsafe script/URL payloads.
 */
export function renderTranslatedMarkdown(markdownText: string): string {
  if (!markdownText) return ''

  const codeBlocks: string[] = []
  const withCodePlaceholders = markdownText
    .replace(/\r\n/g, '\n')
    .replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang: string, code: string) => {
      const idx = codeBlocks.length
      const langBadge = lang ? `<div class="lumi-tr-code-lang">${escapeHtml(lang)}</div>` : ''
      codeBlocks.push(
        `<div class="lumi-tr-codeblock">${langBadge}<pre><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre></div>`,
      )
      return `\n\n\u0000CB${idx}\u0000\n\n`
    })

  const escaped = escapeHtml(withCodePlaceholders)
  const blocks = escaped.split(/\n{2,}/)
  return blocks
    .map((block) => renderBlock(block, codeBlocks))
    .filter(Boolean)
    .join('')
}

import type { RequestInitDTO } from 'lumiverse-spindle-types'
import type { CorsProxyResponse, ProviderId, TranslatorConfig } from '../../shared/types.js'

export type CorsRequester = (url: string, options?: RequestInitDTO) => Promise<CorsProxyResponse>

export interface ProviderTranslateRequest {
  text: string
  sourceLang: string
  targetLang: string
}

export interface ProviderTranslateResponse {
  translatedText: string
  detectedSourceLang?: string
}

export interface TranslationProvider {
  id: ProviderId
  label: string
  maxChunkChars: number
  translateChunk(
    req: ProviderTranslateRequest,
    config: TranslatorConfig,
    cors: CorsRequester,
  ): Promise<ProviderTranslateResponse>
}

export class ProviderError extends Error {
  readonly providerId: ProviderId
  readonly status?: number
  readonly retryable: boolean
  readonly needsCorsPermission: boolean

  constructor(
    message: string,
    opts: {
      providerId: ProviderId
      status?: number
      retryable?: boolean
      needsCorsPermission?: boolean
    },
  ) {
    super(message)
    this.name = 'ProviderError'
    this.providerId = opts.providerId
    this.status = opts.status
    this.retryable = opts.retryable ?? false
    this.needsCorsPermission = opts.needsCorsPermission ?? false
  }
}

export function normalizeCorsResponse(raw: unknown): CorsProxyResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Respuesta inválida del proxy CORS de Lumiverse')
  }
  const candidate = raw as Record<string, unknown>
  const status = typeof candidate.status === 'number' ? candidate.status : 0
  const statusText = typeof candidate.statusText === 'string' ? candidate.statusText : ''
  const headers =
    candidate.headers && typeof candidate.headers === 'object'
      ? (candidate.headers as Record<string, string>)
      : {}
  const body = typeof candidate.body === 'string' ? candidate.body : ''
  return { status, statusText, headers, body }
}

export function isCorsPermissionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /cors_proxy|permission denied|not granted/i.test(msg)
}

export async function runCorsRequest(
  rawCors: (url: string, options?: RequestInitDTO) => Promise<unknown>,
  providerId: ProviderId,
  url: string,
  options?: RequestInitDTO,
): Promise<CorsProxyResponse> {
  try {
    const raw = await rawCors(url, options)
    return normalizeCorsResponse(raw)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new ProviderError(msg, {
      providerId,
      retryable: !isCorsPermissionError(err),
      needsCorsPermission: isCorsPermissionError(err),
    })
  }
}

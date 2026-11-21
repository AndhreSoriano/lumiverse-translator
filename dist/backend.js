// src/backend/textProcessor.ts
var TOKEN_PREFIX = "[[LT";
var TOKEN_SUFFIX = "]]";
function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
function protectSegments(text) {
  const tokens = [];
  const stash = (segment) => {
    const idx = tokens.length;
    tokens.push(segment);
    return `${TOKEN_PREFIX}${idx}${TOKEN_SUFFIX}`;
  };
  let masked = text;
  masked = masked.replace(/```[\s\S]*?```/g, (m) => stash(m));
  masked = masked.replace(/`[^`\n]+`/g, (m) => stash(m));
  masked = masked.replace(/<\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\s+[^<>]*)?\/?>/g, (m) => stash(m));
  masked = masked.replace(/https?:\/\/[^\s<>)\]]+/g, (m) => stash(m));
  return { masked, tokens };
}
function restoreSegments(text, tokens) {
  if (tokens.length === 0) return text;
  return text.replace(/\[\[\s*LT\s*(\d+)\s*\]\]/gi, (full, rawIdx) => {
    const idx = Number(rawIdx);
    return Number.isInteger(idx) && idx >= 0 && idx < tokens.length ? tokens[idx] : full;
  });
}
function splitIntoChunks(text, maxChars = 3200) {
  if (!text) return [];
  if (text.length <= maxChars) return [{ text, separator: "" }];
  const rawUnits = splitByRegexWithSeparators(text, /(\n\n+)/);
  const sizedUnits = [];
  for (const unit of rawUnits) {
    if (unit.text.length <= maxChars) {
      sizedUnits.push(unit);
      continue;
    }
    const lineUnits = splitOversizedUnit(unit.text, maxChars, /(\n)/);
    attachTrailingSeparator(lineUnits, unit.separator);
    sizedUnits.push(...lineUnits);
  }
  return mergeSmallChunks(sizedUnits, maxChars);
}
function splitOversizedUnit(text, maxChars, primarySep) {
  const parts = splitByRegexWithSeparators(text, primarySep);
  const out = [];
  for (const part of parts) {
    if (part.text.length <= maxChars) {
      out.push(part);
      continue;
    }
    const sentenceUnits = splitBySentence(part.text, maxChars);
    attachTrailingSeparator(sentenceUnits, part.separator);
    out.push(...sentenceUnits);
  }
  return out;
}
function splitBySentence(text, maxChars) {
  const parts = splitByRegexWithSeparators(text, /((?<=[.!?…。！？])\s+)/);
  const out = [];
  for (const part of parts) {
    if (part.text.length <= maxChars) {
      out.push(part);
      continue;
    }
    const hardSlices = hardSplit(part.text, maxChars);
    attachTrailingSeparator(hardSlices, part.separator);
    out.push(...hardSlices);
  }
  return out;
}
function hardSplit(text, maxChars) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start + Math.floor(maxChars * 0.5)) {
        end = lastSpace + 1;
      }
    }
    chunks.push({ text: text.slice(start, end), separator: "" });
    start = end;
  }
  return chunks;
}
function splitByRegexWithSeparators(text, sepRegex) {
  const tokens = text.split(sepRegex);
  const result = [];
  for (let i = 0; i < tokens.length; i += 2) {
    const body = tokens[i] ?? "";
    const sep = tokens[i + 1] ?? "";
    if (body.length === 0 && sep.length === 0) continue;
    result.push({ text: body, separator: sep });
  }
  return result;
}
function attachTrailingSeparator(chunks, separator) {
  if (chunks.length > 0 && separator) {
    chunks[chunks.length - 1].separator += separator;
  }
}
function mergeSmallChunks(units, maxChars) {
  const merged = [];
  let currentText = "";
  let currentSep = "";
  for (const unit of units) {
    if (!currentText) {
      currentText = unit.text;
      currentSep = unit.separator;
      continue;
    }
    const candidate = `${currentText}${currentSep}${unit.text}`;
    if (candidate.length <= maxChars) {
      currentText = candidate;
      currentSep = unit.separator;
    } else {
      merged.push({ text: currentText, separator: currentSep });
      currentText = unit.text;
      currentSep = unit.separator;
    }
  }
  if (currentText || currentSep) {
    merged.push({ text: currentText, separator: currentSep });
  }
  return merged;
}
function normalizeRoleplayFormatting(text) {
  return text.split("\n").map((line) => {
    if (/^\s*[-*+]\s+/.test(line) && (line.match(/\*/g)?.length ?? 0) === 1) {
      return line;
    }
    let fixed = line.replace(/\*\*([^*\n]+?)\*\*/g, (_, inner) => `**${inner.trim()}**`);
    fixed = fixed.replace(/(^|[^\w*])\*([^*\n]+?)\*(?!\*)/g, (full, prefix, inner) => {
      if (!inner.trim()) return full;
      return `${prefix}*${inner.trim()}*`;
    });
    return fixed;
  }).join("\n");
}

// src/backend/providers/base.ts
var ProviderError = class extends Error {
  providerId;
  status;
  retryable;
  needsCorsPermission;
  constructor(message, opts) {
    super(message);
    this.name = "ProviderError";
    this.providerId = opts.providerId;
    this.status = opts.status;
    this.retryable = opts.retryable ?? false;
    this.needsCorsPermission = opts.needsCorsPermission ?? false;
  }
};
function normalizeCorsResponse(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Respuesta inv\xE1lida del proxy CORS de Lumiverse");
  }
  const candidate = raw;
  const status = typeof candidate.status === "number" ? candidate.status : 0;
  const statusText = typeof candidate.statusText === "string" ? candidate.statusText : "";
  const headers = candidate.headers && typeof candidate.headers === "object" ? candidate.headers : {};
  const body = typeof candidate.body === "string" ? candidate.body : "";
  return { status, statusText, headers, body };
}
function isCorsPermissionError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return /cors_proxy|permission denied|not granted/i.test(msg);
}
async function runCorsRequest(rawCors, providerId, url, options) {
  try {
    const raw = await rawCors(url, options);
    return normalizeCorsResponse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ProviderError(msg, {
      providerId,
      retryable: !isCorsPermissionError(err),
      needsCorsPermission: isCorsPermissionError(err)
    });
  }
}

// src/shared/languages.ts
var LANGUAGE_OPTIONS = [
  { code: "es", label: "Espa\xF1ol", nativeName: "Espa\xF1ol" },
  { code: "en", label: "Ingl\xE9s", nativeName: "English" },
  { code: "pt", label: "Portugu\xE9s", nativeName: "Portugu\xEAs" },
  { code: "fr", label: "Franc\xE9s", nativeName: "Fran\xE7ais" },
  { code: "de", label: "Alem\xE1n", nativeName: "Deutsch" },
  { code: "it", label: "Italiano", nativeName: "Italiano" },
  { code: "ja", label: "Japon\xE9s", nativeName: "\u65E5\u672C\u8A9E" },
  { code: "ko", label: "Coreano", nativeName: "\uD55C\uAD6D\uC5B4" },
  { code: "zh-CN", label: "Chino (Simplificado)", nativeName: "\u7B80\u4F53\u4E2D\u6587" },
  { code: "zh-TW", label: "Chino (Tradicional)", nativeName: "\u7E41\u9AD4\u4E2D\u6587" },
  { code: "ru", label: "Ruso", nativeName: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
  { code: "ar", label: "\xC1rabe", nativeName: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
  { code: "hi", label: "Hindi", nativeName: "\u0939\u093F\u0928\u094D\u0926\u0940" },
  { code: "pl", label: "Polaco", nativeName: "Polski" },
  { code: "nl", label: "Neerland\xE9s", nativeName: "Nederlands" },
  { code: "tr", label: "Turco", nativeName: "T\xFCrk\xE7e" },
  { code: "sv", label: "Sueco", nativeName: "Svenska" },
  { code: "uk", label: "Ucraniano", nativeName: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430" },
  { code: "vi", label: "Vietnamita", nativeName: "Ti\u1EBFng Vi\u1EC7t" },
  { code: "th", label: "Tailand\xE9s", nativeName: "\u0E44\u0E17\u0E22" },
  { code: "id", label: "Indonesio", nativeName: "Bahasa Indonesia" },
  { code: "ca", label: "Catal\xE1n", nativeName: "Catal\xE0" },
  { code: "gl", label: "Gallego", nativeName: "Galego" },
  { code: "eu", label: "Euskera", nativeName: "Euskara" }
];
var SOURCE_LANGUAGE_OPTIONS = [
  { code: "auto", label: "Detectar autom\xE1ticamente", nativeName: "Auto" },
  ...LANGUAGE_OPTIONS
];
function toDeepLTargetLang(code) {
  const map = {
    en: "EN-US",
    pt: "PT-BR",
    "zh-CN": "ZH-HANS",
    "zh-TW": "ZH-HANT"
  };
  return map[code] ?? code.split("-")[0].toUpperCase();
}
function toDeepLSourceLang(code) {
  if (code === "zh-CN" || code === "zh-TW") return "ZH";
  return code.split("-")[0].toUpperCase();
}
function toMyMemoryLang(code) {
  if (code === "zh-CN" || code === "zh-TW") return code;
  return code.split("-")[0].toLowerCase();
}
function toLibreTranslateLang(code) {
  if (code === "auto") return "auto";
  if (code === "zh-CN" || code === "zh-TW") return "zh";
  return code.split("-")[0].toLowerCase();
}

// src/backend/providers/deepl.ts
var deeplProvider = {
  id: "deepl",
  label: "DeepL API",
  maxChunkChars: 3500,
  async translateChunk(req, config, cors) {
    const apiKey = config.deeplApiKey.trim();
    if (!apiKey) {
      throw new ProviderError("Falta la API Key de DeepL en el men\xFA del Traductor", {
        providerId: "deepl",
        retryable: false
      });
    }
    const host = config.deeplPlan === "pro" ? "https://api.deepl.com" : "https://api-free.deepl.com";
    const endpoint = `${host}/v2/translate`;
    const bodyPayload = {
      text: [req.text],
      target_lang: toDeepLTargetLang(req.targetLang)
    };
    if (req.sourceLang && req.sourceLang !== "auto") {
      bodyPayload.source_lang = toDeepLSourceLang(req.sourceLang);
    }
    const res = await cors(endpoint, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyPayload)
    });
    if (res.status < 200 || res.status >= 300) {
      throw new ProviderError(`DeepL respondi\xF3 con HTTP ${res.status}`, {
        providerId: "deepl",
        status: res.status,
        retryable: res.status === 429 || res.status >= 500
      });
    }
    let parsed;
    try {
      parsed = JSON.parse(res.body);
    } catch {
      throw new ProviderError("DeepL devolvi\xF3 una respuesta no v\xE1lida", {
        providerId: "deepl",
        retryable: true
      });
    }
    const translations = parsed.translations;
    if (!Array.isArray(translations) || !translations[0] || typeof translations[0] !== "object") {
      throw new ProviderError("DeepL no devolvi\xF3 traducciones", {
        providerId: "deepl",
        retryable: true
      });
    }
    const first = translations[0];
    return {
      translatedText: typeof first.text === "string" ? first.text : "",
      detectedSourceLang: typeof first.detected_source_language === "string" ? first.detected_source_language.toLowerCase() : void 0
    };
  }
};

// src/backend/providers/google.ts
var GOOGLE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
var googleProvider = {
  id: "google",
  label: "Google Translate",
  maxChunkChars: 3200,
  async translateChunk(req, _config, cors) {
    const sl = req.sourceLang || "auto";
    const tl = req.targetLang || "es";
    const url = `${GOOGLE_ENDPOINT}?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t`;
    const res = await cors(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: `q=${encodeURIComponent(req.text)}`
    });
    if (res.status < 200 || res.status >= 300) {
      throw new ProviderError(`Google Translate respondi\xF3 con HTTP ${res.status}`, {
        providerId: "google",
        status: res.status,
        retryable: res.status === 429 || res.status >= 500
      });
    }
    let parsed;
    try {
      parsed = JSON.parse(res.body);
    } catch {
      throw new ProviderError("Google Translate devolvi\xF3 una respuesta no v\xE1lida", {
        providerId: "google",
        retryable: true
      });
    }
    if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
      throw new ProviderError("Formato inesperado en respuesta de Google Translate", {
        providerId: "google",
        retryable: true
      });
    }
    let translatedText = "";
    for (const seg of parsed[0]) {
      if (Array.isArray(seg) && typeof seg[0] === "string") {
        translatedText += seg[0];
      }
    }
    const detectedSourceLang = typeof parsed[2] === "string" ? parsed[2] : void 0;
    return { translatedText, detectedSourceLang };
  }
};

// src/backend/providers/libretranslate.ts
var libreTranslateProvider = {
  id: "libretranslate",
  label: "LibreTranslate",
  maxChunkChars: 3e3,
  async translateChunk(req, config, cors) {
    const rawUrl = config.libreTranslateUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\/.+/.test(rawUrl)) {
      throw new ProviderError("Configura una URL v\xE1lida para LibreTranslate (http:// o https://)", {
        providerId: "libretranslate",
        retryable: false
      });
    }
    const endpoint = `${rawUrl}/translate`;
    const payload = {
      q: req.text,
      source: toLibreTranslateLang(req.sourceLang),
      target: toLibreTranslateLang(req.targetLang),
      format: "text"
    };
    if (config.libreTranslateApiKey.trim()) {
      payload.api_key = config.libreTranslateApiKey.trim();
    }
    const res = await cors(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.status < 200 || res.status >= 300) {
      throw new ProviderError(`LibreTranslate respondi\xF3 con HTTP ${res.status}`, {
        providerId: "libretranslate",
        status: res.status,
        retryable: res.status === 429 || res.status >= 500
      });
    }
    let parsed;
    try {
      parsed = JSON.parse(res.body);
    } catch {
      throw new ProviderError("LibreTranslate devolvi\xF3 una respuesta no v\xE1lida", {
        providerId: "libretranslate",
        retryable: true
      });
    }
    if (typeof parsed.translatedText !== "string") {
      const msg = typeof parsed.error === "string" ? parsed.error : "Respuesta sin translatedText";
      throw new ProviderError(`LibreTranslate: ${msg}`, {
        providerId: "libretranslate",
        retryable: false
      });
    }
    const detected = parsed.detectedLanguage && typeof parsed.detectedLanguage === "object" ? parsed.detectedLanguage.language : void 0;
    return {
      translatedText: parsed.translatedText,
      detectedSourceLang: typeof detected === "string" ? detected : void 0
    };
  }
};

// src/backend/providers/mymemory.ts
var MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";
var MYMEMORY_MAX_CHUNK = 450;
function inferSourceLangForMyMemory(text, targetLang) {
  const targetBase = toMyMemoryLang(targetLang);
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh-CN";
  if (/[\u0400-\u04ff]/.test(text)) return "ru";
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  if (/[áéíóúüñ¿¡]/i.test(text)) return targetBase === "es" ? "en" : "es";
  return targetBase === "en" ? "es" : "en";
}
var myMemoryProvider = {
  id: "mymemory",
  label: "MyMemory",
  maxChunkChars: MYMEMORY_MAX_CHUNK,
  async translateChunk(req, config, cors) {
    const chunks = splitIntoChunks(req.text, MYMEMORY_MAX_CHUNK);
    const sl = req.sourceLang === "auto" ? inferSourceLangForMyMemory(req.text, req.targetLang) : toMyMemoryLang(req.sourceLang);
    const tl = toMyMemoryLang(req.targetLang);
    let output = "";
    for (const chunk of chunks) {
      if (!chunk.text.trim()) {
        output += chunk.text + chunk.separator;
        continue;
      }
      let url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(chunk.text)}&langpair=${encodeURIComponent(`${sl}|${tl}`)}`;
      if (config.myMemoryEmail.trim()) {
        url += `&de=${encodeURIComponent(config.myMemoryEmail.trim())}`;
      }
      const res = await cors(url, { method: "GET" });
      if (res.status < 200 || res.status >= 300) {
        throw new ProviderError(`MyMemory respondi\xF3 con HTTP ${res.status}`, {
          providerId: "mymemory",
          status: res.status,
          retryable: res.status === 429 || res.status >= 500
        });
      }
      let parsed;
      try {
        parsed = JSON.parse(res.body);
      } catch {
        throw new ProviderError("MyMemory devolvi\xF3 JSON inv\xE1lido", {
          providerId: "mymemory",
          retryable: true
        });
      }
      const responseStatus = typeof parsed.responseStatus === "number" ? parsed.responseStatus : res.status;
      const responseData = parsed.responseData;
      const translated = typeof responseData?.translatedText === "string" ? responseData.translatedText : "";
      if (responseStatus === 429 || /MYMEMORY WARNING/i.test(translated)) {
        throw new ProviderError("L\xEDmite diario de MyMemory alcanzado", {
          providerId: "mymemory",
          status: 429,
          retryable: true
        });
      }
      if (responseStatus >= 400 || !translated) {
        const details = typeof parsed.responseDetails === "string" ? parsed.responseDetails : `Error ${responseStatus}`;
        throw new ProviderError(`MyMemory: ${details}`, {
          providerId: "mymemory",
          status: responseStatus,
          retryable: responseStatus >= 500
        });
      }
      output += translated + chunk.separator;
    }
    return {
      translatedText: output,
      detectedSourceLang: req.sourceLang === "auto" ? sl : void 0
    };
  }
};

// src/backend/providers/index.ts
var PROVIDERS = {
  google: googleProvider,
  mymemory: myMemoryProvider,
  libretranslate: libreTranslateProvider,
  deepl: deeplProvider
};
async function translateWithProvider(provider, text, config, cors) {
  const { masked, tokens } = protectSegments(text);
  const chunks = splitIntoChunks(masked, provider.maxChunkChars);
  if (chunks.length === 0) return { translatedText: text };
  let detectedSourceLang;
  let combined = "";
  for (const chunk of chunks) {
    if (!chunk.text.trim()) {
      combined += chunk.text + chunk.separator;
      continue;
    }
    const res = await provider.translateChunk(
      {
        text: chunk.text,
        sourceLang: config.sourceLang,
        targetLang: config.targetLang
      },
      config,
      cors
    );
    if (!detectedSourceLang && res.detectedSourceLang) {
      detectedSourceLang = res.detectedSourceLang;
    }
    combined += res.translatedText + chunk.separator;
  }
  const restored = restoreSegments(combined, tokens);
  return {
    translatedText: normalizeRoleplayFormatting(restored),
    detectedSourceLang
  };
}
async function translateWithProviders(text, config, cors) {
  if (!text.trim()) {
    return {
      translatedText: text,
      providerId: config.providerId,
      usedFallback: false
    };
  }
  const primary = PROVIDERS[config.providerId] ?? googleProvider;
  try {
    const res = await translateWithProvider(primary, text, config, cors);
    return {
      ...res,
      providerId: primary.id,
      usedFallback: false
    };
  } catch (err) {
    const isPerm = err instanceof ProviderError && err.needsCorsPermission;
    const canFallback = !isPerm && config.fallbackToMyMemory && primary.id !== "mymemory" && (!(err instanceof ProviderError) || err.retryable);
    if (!canFallback) throw err;
    const fallbackRes = await translateWithProvider(myMemoryProvider, text, config, cors);
    return {
      ...fallbackRes,
      providerId: "mymemory",
      usedFallback: true
    };
  }
}

// src/shared/types.ts
var DEFAULT_CONFIG = {
  enabled: true,
  sourceLang: "auto",
  targetLang: "es",
  autoTranslate: false,
  displayMode: "replace",
  providerId: "google",
  fallbackToMyMemory: true,
  libreTranslateUrl: "http://localhost:5000",
  libreTranslateApiKey: "",
  deeplApiKey: "",
  deeplPlan: "free",
  myMemoryEmail: ""
};

// src/backend/storage.ts
var CONFIG_PATH = "config.json";
var CACHE_PATH = "cache.json";
var MAX_CACHE_ENTRIES = 600;
var VALID_PROVIDERS = /* @__PURE__ */ new Set(["google", "mymemory", "libretranslate", "deepl"]);
function sanitizeConfig(raw, current = DEFAULT_CONFIG) {
  const input = raw && typeof raw === "object" ? raw : {};
  const providerId = typeof input.providerId === "string" && VALID_PROVIDERS.has(input.providerId) ? input.providerId : current.providerId;
  return {
    enabled: typeof input.enabled === "boolean" ? input.enabled : current.enabled,
    sourceLang: typeof input.sourceLang === "string" && input.sourceLang.trim() ? input.sourceLang.trim() : current.sourceLang,
    targetLang: typeof input.targetLang === "string" && input.targetLang.trim() ? input.targetLang.trim() : current.targetLang,
    autoTranslate: typeof input.autoTranslate === "boolean" ? input.autoTranslate : current.autoTranslate,
    displayMode: input.displayMode === "replace" || input.displayMode === "bilingual" ? input.displayMode : current.displayMode,
    providerId,
    fallbackToMyMemory: typeof input.fallbackToMyMemory === "boolean" ? input.fallbackToMyMemory : current.fallbackToMyMemory,
    libreTranslateUrl: typeof input.libreTranslateUrl === "string" ? input.libreTranslateUrl.trim() : current.libreTranslateUrl,
    libreTranslateApiKey: typeof input.libreTranslateApiKey === "string" ? input.libreTranslateApiKey : current.libreTranslateApiKey,
    deeplApiKey: typeof input.deeplApiKey === "string" ? input.deeplApiKey : current.deeplApiKey,
    deeplPlan: input.deeplPlan === "pro" || input.deeplPlan === "free" ? input.deeplPlan : current.deeplPlan,
    myMemoryEmail: typeof input.myMemoryEmail === "string" ? input.myMemoryEmail.trim() : current.myMemoryEmail
  };
}
function buildCacheKey(params) {
  return [
    params.chatId,
    params.messageId,
    String(params.swipeId),
    params.sourceLang,
    params.targetLang,
    params.providerId,
    params.textHash
  ].join(":");
}
function createStorageService(userStorage) {
  const configMem = /* @__PURE__ */ new Map();
  const cacheMem = /* @__PURE__ */ new Map();
  const writeChains = /* @__PURE__ */ new Map();
  const enqueueWrite = (userKey, task) => {
    const prev = writeChains.get(userKey) ?? Promise.resolve();
    const next = prev.then(task, task);
    writeChains.set(userKey, next.catch(() => {
    }));
    return next;
  };
  const userKeyOf = (userId) => userId || "__default__";
  async function loadConfig(userId) {
    const key = userKeyOf(userId);
    const cached = configMem.get(key);
    if (cached) return cached;
    const raw = await userStorage.getJson(CONFIG_PATH, {
      fallback: DEFAULT_CONFIG,
      userId
    });
    const clean = sanitizeConfig(raw, DEFAULT_CONFIG);
    configMem.set(key, clean);
    return clean;
  }
  async function saveConfig(patch, userId) {
    const key = userKeyOf(userId);
    return enqueueWrite(`cfg:${key}`, async () => {
      const current = await loadConfig(userId);
      const next = sanitizeConfig(patch, current);
      configMem.set(key, next);
      await userStorage.setJson(CONFIG_PATH, next, { indent: 2, userId });
      return next;
    });
  }
  async function loadCacheMap(userId) {
    const key = userKeyOf(userId);
    const cached = cacheMem.get(key);
    if (cached) return cached;
    const file = await userStorage.getJson(CACHE_PATH, {
      fallback: { entries: {} },
      userId
    });
    const entries = file && typeof file === "object" && file.entries && typeof file.entries === "object" ? { ...file.entries } : {};
    cacheMem.set(key, entries);
    return entries;
  }
  async function getCacheEntry(cacheKey, userId) {
    const entries = await loadCacheMap(userId);
    return entries[cacheKey] ?? null;
  }
  async function setCacheEntry(cacheKey, entry, userId) {
    const key = userKeyOf(userId);
    return enqueueWrite(`cache:${key}`, async () => {
      const entries = await loadCacheMap(userId);
      entries[cacheKey] = entry;
      const keys = Object.keys(entries);
      if (keys.length > MAX_CACHE_ENTRIES) {
        keys.sort((a, b) => (entries[a]?.updatedAt ?? 0) - (entries[b]?.updatedAt ?? 0));
        const toDelete = keys.length - MAX_CACHE_ENTRIES;
        for (let i = 0; i < toDelete; i += 1) {
          delete entries[keys[i]];
        }
      }
      await userStorage.setJson(CACHE_PATH, { entries }, { userId });
      return Object.keys(entries).length;
    });
  }
  async function clearCache(chatId, userId) {
    const key = userKeyOf(userId);
    return enqueueWrite(`cache:${key}`, async () => {
      const entries = await loadCacheMap(userId);
      if (!chatId) {
        for (const k of Object.keys(entries)) delete entries[k];
      } else {
        const prefix = `${chatId}:`;
        for (const k of Object.keys(entries)) {
          if (k.startsWith(prefix)) delete entries[k];
        }
      }
      await userStorage.setJson(CACHE_PATH, { entries }, { userId });
      return Object.keys(entries).length;
    });
  }
  async function getCacheCount(userId) {
    const entries = await loadCacheMap(userId);
    return Object.keys(entries).length;
  }
  return {
    getConfig: loadConfig,
    saveConfig,
    getCacheEntry,
    setCacheEntry,
    clearCache,
    getCacheCount
  };
}

// src/backend.ts
var MAX_CONCURRENT_JOBS_PER_USER = 2;
var storage = createStorageService(spindle.userStorage);
var inFlight = /* @__PURE__ */ new Map();
var activeUserJobs = /* @__PURE__ */ new Map();
var pendingUserQueues = /* @__PURE__ */ new Map();
function enqueueUserWork(userId, fn) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      activeUserJobs.set(userId, (activeUserJobs.get(userId) ?? 0) + 1);
      try {
        resolve(await fn());
      } catch (err) {
        reject(err);
      } finally {
        const remaining = Math.max(0, (activeUserJobs.get(userId) ?? 1) - 1);
        activeUserJobs.set(userId, remaining);
        const queue = pendingUserQueues.get(userId);
        if (queue && queue.length > 0 && remaining < MAX_CONCURRENT_JOBS_PER_USER) {
          const next = queue.shift();
          next?.();
        }
      }
    };
    const active = activeUserJobs.get(userId) ?? 0;
    if (active < MAX_CONCURRENT_JOBS_PER_USER) {
      void run();
    } else {
      const queue = pendingUserQueues.get(userId) ?? [];
      queue.push(() => void run());
      pendingUserQueues.set(userId, queue);
    }
  });
}
function send(msg, userId, frontendSessionId) {
  if (frontendSessionId) {
    spindle.sendToFrontend(msg, userId, { frontendSessionId });
  } else {
    spindle.sendToFrontend(msg, userId);
  }
}
async function resolveAuthoritativeMessage(chatId, messageId, providedText, providedSwipeId, fallbackText) {
  let swipeId = typeof providedSwipeId === "number" ? providedSwipeId : 0;
  let text = typeof providedText === "string" ? providedText : "";
  if (!text || typeof providedSwipeId !== "number") {
    try {
      const messages = await spindle.chat.getMessages(chatId);
      const match = messages.find((m) => m.id === messageId);
      if (match) {
        swipeId = typeof match.swipe_id === "number" ? match.swipe_id : swipeId;
        if (!text && typeof match.content === "string") {
          text = match.content;
        }
      }
    } catch {
    }
  }
  if (!text && typeof fallbackText === "string") {
    text = fallbackText;
  }
  return { text, swipeId };
}
async function handleTranslateMessage(req, userId, frontendSessionId) {
  const config = await storage.getConfig(userId);
  const { text, swipeId } = await resolveAuthoritativeMessage(
    req.chatId,
    req.messageId,
    req.text,
    req.swipeId,
    req.fallbackText
  );
  if (!text.trim()) {
    send(
      {
        type: "translation_result",
        chatId: req.chatId,
        messageId: req.messageId,
        swipeId,
        targetLang: config.targetLang,
        providerId: config.providerId,
        translatedText: "",
        fromCache: false,
        error: "El mensaje no contiene texto traducible."
      },
      userId,
      frontendSessionId
    );
    return;
  }
  const cacheKey = buildCacheKey({
    chatId: req.chatId,
    messageId: req.messageId,
    swipeId,
    sourceLang: config.sourceLang,
    targetLang: config.targetLang,
    providerId: config.providerId,
    textHash: hashText(text)
  });
  if (!req.forceRefresh) {
    const cached = await storage.getCacheEntry(cacheKey, userId);
    if (cached) {
      send(
        {
          type: "translation_result",
          chatId: req.chatId,
          messageId: req.messageId,
          swipeId,
          targetLang: config.targetLang,
          providerId: cached.providerId,
          translatedText: cached.translatedText,
          detectedSourceLang: cached.detectedSourceLang,
          fromCache: true
        },
        userId,
        frontendSessionId
      );
      return;
    }
  }
  const dedupeKey = `${userId}:${cacheKey}`;
  let job = inFlight.get(dedupeKey);
  if (!job) {
    job = enqueueUserWork(userId, async () => {
      const corsRequester = (url, options) => runCorsRequest((u, opts) => spindle.cors(u, opts), config.providerId, url, options);
      try {
        const result = await translateWithProviders(text, config, corsRequester);
        await storage.setCacheEntry(
          cacheKey,
          {
            translatedText: result.translatedText,
            detectedSourceLang: result.detectedSourceLang,
            providerId: result.providerId,
            updatedAt: Date.now()
          },
          userId
        );
        send(
          {
            type: "translation_result",
            chatId: req.chatId,
            messageId: req.messageId,
            swipeId,
            targetLang: config.targetLang,
            providerId: result.providerId,
            translatedText: result.translatedText,
            detectedSourceLang: result.detectedSourceLang,
            fromCache: false,
            usedFallback: result.usedFallback
          },
          userId,
          frontendSessionId
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const needsCorsPermission = err instanceof ProviderError && err.needsCorsPermission || isCorsPermissionError(err);
        spindle.log.warn(`[Translator] Error traduciendo ${req.messageId}: ${message}`);
        spindle.toast.error(
          needsCorsPermission ? "Concede el permiso cors_proxy en la extensi\xF3n para traducir mensajes." : `Error al traducir: ${message}`,
          { userId }
        );
        send(
          {
            type: "translation_result",
            chatId: req.chatId,
            messageId: req.messageId,
            swipeId,
            targetLang: config.targetLang,
            providerId: config.providerId,
            translatedText: "",
            fromCache: false,
            error: message,
            needsCorsPermission
          },
          userId,
          frontendSessionId
        );
      }
    }).finally(() => {
      inFlight.delete(dedupeKey);
    });
    inFlight.set(dedupeKey, job);
  }
  await job;
}
spindle.onFrontendMessage(async (rawPayload, userId, frontendSessionId) => {
  if (!rawPayload || typeof rawPayload !== "object") return;
  const payload = rawPayload;
  switch (payload.type) {
    case "get_config": {
      const [config, cacheCount] = await Promise.all([
        storage.getConfig(userId),
        storage.getCacheCount(userId)
      ]);
      send({ type: "config_updated", config, cacheCount }, userId, frontendSessionId);
      break;
    }
    case "save_config": {
      const config = await storage.saveConfig(payload.config, userId);
      const cacheCount = await storage.getCacheCount(userId);
      send({ type: "config_updated", config, cacheCount }, userId);
      break;
    }
    case "clear_cache": {
      const cacheCount = await storage.clearCache(payload.chatId, userId);
      send({ type: "cache_cleared", chatId: payload.chatId, cacheCount }, userId);
      spindle.toast.info("Cach\xE9 de traducciones limpiada.", { userId });
      break;
    }
    case "get_chat_messages_meta": {
      try {
        const rawMessages = await spindle.chat.getMessages(payload.chatId);
        const messages = rawMessages.map((m) => ({
          id: m.id,
          isUser: Boolean(m.is_user),
          swipeId: typeof m.swipe_id === "number" ? m.swipe_id : 0
        }));
        send({ type: "chat_messages_meta", chatId: payload.chatId, messages }, userId, frontendSessionId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        spindle.log.warn(`[Translator] No se pudieron leer mensajes del chat: ${msg}`);
      }
      break;
    }
    case "translate_message": {
      await handleTranslateMessage(payload, userId, frontendSessionId);
      break;
    }
  }
});
spindle.log.info("[Lumiverse Translator] Backend inicializado.");

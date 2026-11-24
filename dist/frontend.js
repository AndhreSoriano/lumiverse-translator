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
function getLanguageShortCode(code) {
  return code.split("-")[0].toUpperCase();
}

// src/frontend/drawerMenu.ts
var TRANSLATOR_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>';
var TARGET_OPTIONS = LANGUAGE_OPTIONS.map((lang) => ({
  value: lang.code,
  label: lang.label,
  sublabel: `${lang.nativeName} \xB7 ${lang.code}`
}));
var SOURCE_OPTIONS = SOURCE_LANGUAGE_OPTIONS.map((lang) => ({
  value: lang.code,
  label: lang.label,
  sublabel: lang.code === "auto" ? "Recomendado" : `${lang.nativeName} \xB7 ${lang.code}`
}));
var PROVIDER_OPTIONS = [
  { value: "google", label: "Google Translate", sublabel: "Gratis \xB7 sin API Key (por defecto)" },
  { value: "mymemory", label: "MyMemory", sublabel: "Gratis \xB7 \xFAtil como respaldo" },
  { value: "libretranslate", label: "LibreTranslate", sublabel: "Self-hosted o instancia propia" },
  { value: "deepl", label: "DeepL API", sublabel: "Alta calidad \xB7 requiere API Key" }
];
var DISPLAY_MODE_OPTIONS = [
  {
    value: "replace",
    label: "Reemplazar texto visualmente",
    sublabel: "Oculta el original en pantalla y vuelve con un clic"
  },
  {
    value: "bilingual",
    label: "Mostrar debajo (Biling\xFCe)",
    sublabel: "Conserva el mensaje original y a\xF1ade la traducci\xF3n"
  }
];
var DEEPL_PLAN_OPTIONS = [
  { value: "free", label: "DeepL Free (api-free.deepl.com)" },
  { value: "pro", label: "DeepL Pro (api.deepl.com)" }
];
function makeField(parent, labelText, hintText) {
  const field = document.createElement("div");
  field.className = "lumi-tr-field";
  const label = document.createElement("div");
  label.className = "lumi-tr-label";
  label.textContent = labelText;
  field.appendChild(label);
  const slot = document.createElement("div");
  field.appendChild(slot);
  if (hintText) {
    const hint = document.createElement("div");
    hint.className = "lumi-tr-hint";
    hint.textContent = hintText;
    field.appendChild(hint);
  }
  parent.appendChild(field);
  return slot;
}
function makeSwitchRow(parent, labelText, hintText) {
  const container = document.createElement("div");
  container.className = "lumi-tr-field";
  const row = document.createElement("div");
  row.className = "lumi-tr-row";
  const textCol = document.createElement("div");
  textCol.className = "lumi-tr-title-col";
  const label = document.createElement("div");
  label.className = "lumi-tr-label";
  label.textContent = labelText;
  textCol.appendChild(label);
  const hint = document.createElement("div");
  hint.className = "lumi-tr-hint";
  hint.textContent = hintText;
  textCol.appendChild(hint);
  const slot = document.createElement("div");
  row.appendChild(textCol);
  row.appendChild(slot);
  container.appendChild(row);
  parent.appendChild(container);
  return slot;
}
function mountTranslatorPanel(ctx, hostRoot, initialConfig, callbacks) {
  let currentConfig = { ...initialConfig };
  let currentCacheCount = 0;
  let syncing = false;
  const timers = /* @__PURE__ */ new Set();
  const root = document.createElement("div");
  root.className = "lumi-tr-drawer";
  hostRoot.appendChild(root);
  const headerCard = document.createElement("div");
  headerCard.className = "lumi-tr-header-card";
  const titleCol = document.createElement("div");
  titleCol.className = "lumi-tr-title-col";
  const titleEl = document.createElement("div");
  titleEl.className = "lumi-tr-title";
  titleEl.textContent = "Lumiverse Translator";
  const subtitleEl = document.createElement("div");
  subtitleEl.className = "lumi-tr-subtitle";
  subtitleEl.textContent = "Bot\xF3n superior izquierdo en mensajes del bot";
  titleCol.appendChild(titleEl);
  titleCol.appendChild(subtitleEl);
  const badgeSlot = document.createElement("div");
  headerCard.appendChild(titleCol);
  headerCard.appendChild(badgeSlot);
  root.appendChild(headerCard);
  const statusBadge = ctx.components.mountBadge(badgeSlot, {
    text: currentConfig.enabled ? "Activo" : "Pausado",
    color: currentConfig.enabled ? "success" : "neutral",
    size: "pill"
  });
  const permBanner = document.createElement("div");
  permBanner.className = "lumi-tr-perm-banner";
  permBanner.style.display = "none";
  const permText = document.createElement("div");
  permText.textContent = "Falta el permiso cors_proxy para consultar Google Translate u otros motores externos.";
  const permBtn = document.createElement("button");
  permBtn.type = "button";
  permBtn.className = "lumi-tr-action-btn is-primary";
  permBtn.textContent = "Conceder permisos necesarios";
  permBtn.addEventListener("click", () => {
    void ctx.permissions.request(["cors_proxy", "chats"], {
      reason: "Permite traducir mensajes del bot usando Google Translate, MyMemory, LibreTranslate o DeepL sin modificar tu historial."
    }).then((granted) => {
      if (granted.includes("cors_proxy")) {
        permBanner.style.display = "none";
      }
    }).catch(() => {
    });
  });
  permBanner.appendChild(permText);
  permBanner.appendChild(permBtn);
  root.appendChild(permBanner);
  void ctx.permissions.getGranted().then((granted) => {
    if (!granted.includes("cors_proxy")) {
      permBanner.style.display = "flex";
    }
  }).catch(() => {
  });
  const mainSection = document.createElement("div");
  mainSection.className = "lumi-tr-section";
  root.appendChild(mainSection);
  const enabledSlot = makeSwitchRow(
    mainSection,
    "Activar traductor",
    "Muestra el bot\xF3n de traducci\xF3n en la esquina superior izquierda del bot."
  );
  const enabledSwitch = ctx.components.mountSwitch(enabledSlot, {
    checked: currentConfig.enabled,
    ariaLabel: "Activar traductor",
    onChange: (checked) => {
      if (!syncing) callbacks.onConfigPatch({ enabled: checked });
    }
  });
  const autoSlot = makeSwitchRow(
    mainSection,
    "Traducir autom\xE1ticamente mensajes nuevos",
    "Cada respuesta nueva generada por el bot se traducir\xE1 al instante al finalizar."
  );
  const autoSwitch = ctx.components.mountSwitch(autoSlot, {
    checked: currentConfig.autoTranslate,
    ariaLabel: "Traducir autom\xE1ticamente mensajes nuevos del bot",
    onChange: (checked) => {
      if (!syncing) callbacks.onConfigPatch({ autoTranslate: checked });
    }
  });
  const targetSlot = makeField(mainSection, "Traducir al idioma");
  const targetSelect = ctx.components.mountSelect(targetSlot, {
    value: currentConfig.targetLang,
    options: TARGET_OPTIONS,
    searchThreshold: 6,
    searchPlaceholder: "Buscar idioma...",
    ariaLabel: "Idioma de destino",
    onChange: (value) => {
      if (!syncing && value) callbacks.onConfigPatch({ targetLang: value });
    }
  });
  const sourceSlot = makeField(mainSection, "Idioma original");
  const sourceSelect = ctx.components.mountSelect(sourceSlot, {
    value: currentConfig.sourceLang,
    options: SOURCE_OPTIONS,
    searchThreshold: 6,
    searchPlaceholder: "Buscar idioma...",
    ariaLabel: "Idioma de origen",
    onChange: (value) => {
      if (!syncing && value) callbacks.onConfigPatch({ sourceLang: value });
    }
  });
  const displaySlot = makeField(mainSection, "C\xF3mo mostrar la traducci\xF3n");
  const displaySelect = ctx.components.mountSelect(displaySlot, {
    value: currentConfig.displayMode,
    options: DISPLAY_MODE_OPTIONS,
    searchThreshold: 99,
    ariaLabel: "Modo de visualizaci\xF3n",
    onChange: (value) => {
      if (!syncing && (value === "replace" || value === "bilingual")) {
        callbacks.onConfigPatch({ displayMode: value });
      }
    }
  });
  const providerSectionWrap = document.createElement("div");
  root.appendChild(providerSectionWrap);
  const providerCollapsible = ctx.components.mountCollapsibleSection(
    providerSectionWrap,
    {
      title: "Motor de traducci\xF3n",
      badge: "Google",
      defaultExpanded: false
    }
  );
  const providerBody = document.createElement("div");
  providerBody.className = "lumi-tr-section";
  providerCollapsible.body.appendChild(providerBody);
  const providerSlot = makeField(providerBody, "Proveedor activo");
  const providerSelect = ctx.components.mountSelect(providerSlot, {
    value: currentConfig.providerId,
    options: PROVIDER_OPTIONS,
    searchThreshold: 99,
    ariaLabel: "Proveedor de traducci\xF3n",
    onChange: (value) => {
      if (!syncing && value) {
        callbacks.onConfigPatch({ providerId: value });
      }
    }
  });
  const fallbackSlot = makeSwitchRow(
    providerBody,
    "Respaldo autom\xE1tico (MyMemory)",
    "Si el motor principal falla o alcanza l\xEDmite temporal, reintenta con MyMemory."
  );
  const fallbackSwitch = ctx.components.mountSwitch(fallbackSlot, {
    checked: currentConfig.fallbackToMyMemory,
    ariaLabel: "Respaldo autom\xE1tico con MyMemory",
    onChange: (checked) => {
      if (!syncing) callbacks.onConfigPatch({ fallbackToMyMemory: checked });
    }
  });
  const debouncedPatch = (key, val) => {
    const t = setTimeout(() => {
      timers.delete(t);
      callbacks.onConfigPatch({ [key]: val });
    }, 350);
    timers.add(t);
  };
  const libreGroup = document.createElement("div");
  libreGroup.className = "lumi-tr-field";
  providerBody.appendChild(libreGroup);
  const libreUrlSlot = makeField(
    libreGroup,
    "URL de LibreTranslate",
    "Ejemplo: http://localhost:5000 o tu instancia self-hosted"
  );
  const libreUrlInput = ctx.components.mountTextInput(libreUrlSlot, {
    value: currentConfig.libreTranslateUrl,
    placeholder: DEFAULT_CONFIG.libreTranslateUrl,
    ariaLabel: "URL de LibreTranslate",
    onChange: (val) => {
      if (!syncing) debouncedPatch("libreTranslateUrl", val);
    }
  });
  const libreKeySlot = makeField(libreGroup, "API Key de LibreTranslate (opcional)");
  const libreKeyInput = ctx.components.mountTextInput(libreKeySlot, {
    value: currentConfig.libreTranslateApiKey,
    placeholder: "Opcional si tu instancia no requiere clave",
    ariaLabel: "API Key de LibreTranslate",
    onChange: (val) => {
      if (!syncing) debouncedPatch("libreTranslateApiKey", val);
    }
  });
  const deeplGroup = document.createElement("div");
  deeplGroup.className = "lumi-tr-field";
  providerBody.appendChild(deeplGroup);
  const deeplPlanSlot = makeField(deeplGroup, "Plan de DeepL");
  const deeplPlanSelect = ctx.components.mountSelect(deeplPlanSlot, {
    value: currentConfig.deeplPlan,
    options: DEEPL_PLAN_OPTIONS,
    searchThreshold: 99,
    ariaLabel: "Plan DeepL",
    onChange: (val) => {
      if (!syncing && (val === "free" || val === "pro")) {
        callbacks.onConfigPatch({ deeplPlan: val });
      }
    }
  });
  const deeplKeySlot = makeField(deeplGroup, "API Key de DeepL");
  const deeplKeyInput = ctx.components.mountTextInput(deeplKeySlot, {
    value: currentConfig.deeplApiKey,
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx",
    ariaLabel: "API Key de DeepL",
    onChange: (val) => {
      if (!syncing) debouncedPatch("deeplApiKey", val);
    }
  });
  const myMemoryGroup = document.createElement("div");
  myMemoryGroup.className = "lumi-tr-field";
  providerBody.appendChild(myMemoryGroup);
  const myMemoryEmailSlot = makeField(
    myMemoryGroup,
    "Email para MyMemory (opcional)",
    "Aumenta la cuota diaria gratuita de MyMemory."
  );
  const myMemoryEmailInput = ctx.components.mountTextInput(myMemoryEmailSlot, {
    value: currentConfig.myMemoryEmail,
    placeholder: "tu@correo.com",
    ariaLabel: "Email para MyMemory",
    onChange: (val) => {
      if (!syncing) debouncedPatch("myMemoryEmail", val);
    }
  });
  const actionsSection = document.createElement("div");
  actionsSection.className = "lumi-tr-section";
  const actionsTitle = document.createElement("div");
  actionsTitle.className = "lumi-tr-label";
  actionsTitle.textContent = "Acciones r\xE1pidas en el chat";
  const actionsWrap = document.createElement("div");
  actionsWrap.className = "lumi-tr-actions";
  const translateVisibleBtn = document.createElement("button");
  translateVisibleBtn.type = "button";
  translateVisibleBtn.className = "lumi-tr-action-btn is-primary";
  translateVisibleBtn.textContent = "Traducir mensajes visibles del bot";
  translateVisibleBtn.addEventListener("click", () => callbacks.onTranslateVisible());
  const restoreAllBtn = document.createElement("button");
  restoreAllBtn.type = "button";
  restoreAllBtn.className = "lumi-tr-action-btn";
  restoreAllBtn.textContent = "Restaurar todos al original";
  restoreAllBtn.addEventListener("click", () => callbacks.onRestoreAll());
  const clearCacheBtn = document.createElement("button");
  clearCacheBtn.type = "button";
  clearCacheBtn.className = "lumi-tr-action-btn is-danger";
  clearCacheBtn.textContent = "Limpiar cach\xE9 de traducciones (0)";
  clearCacheBtn.addEventListener("click", () => callbacks.onClearCache());
  actionsWrap.appendChild(translateVisibleBtn);
  actionsWrap.appendChild(restoreAllBtn);
  actionsWrap.appendChild(clearCacheBtn);
  actionsSection.appendChild(actionsTitle);
  actionsSection.appendChild(actionsWrap);
  root.appendChild(actionsSection);
  function updateConditionalGroups(cfg) {
    libreGroup.style.display = cfg.providerId === "libretranslate" ? "flex" : "none";
    deeplGroup.style.display = cfg.providerId === "deepl" ? "flex" : "none";
    myMemoryGroup.style.display = cfg.providerId === "mymemory" || cfg.fallbackToMyMemory ? "flex" : "none";
    const badgeMap = {
      google: "Google",
      mymemory: "MyMemory",
      libretranslate: "Libre",
      deepl: "DeepL"
    };
    providerCollapsible.update({ badge: badgeMap[cfg.providerId] });
  }
  function syncConfig(config, cacheCount) {
    currentConfig = { ...config };
    if (typeof cacheCount === "number") currentCacheCount = cacheCount;
    syncing = true;
    try {
      statusBadge.update({
        text: config.enabled ? "Activo" : "Pausado",
        color: config.enabled ? "success" : "neutral"
      });
      enabledSwitch.update({ checked: config.enabled });
      autoSwitch.update({ checked: config.autoTranslate });
      targetSelect.update({ value: config.targetLang });
      sourceSelect.update({ value: config.sourceLang });
      displaySelect.update({ value: config.displayMode });
      providerSelect.update({ value: config.providerId });
      fallbackSwitch.update({ checked: config.fallbackToMyMemory });
      libreUrlInput.update({ value: config.libreTranslateUrl });
      libreKeyInput.update({ value: config.libreTranslateApiKey });
      deeplPlanSelect.update({ value: config.deeplPlan });
      deeplKeyInput.update({ value: config.deeplApiKey });
      myMemoryEmailInput.update({ value: config.myMemoryEmail });
      clearCacheBtn.textContent = `Limpiar cach\xE9 de traducciones (${currentCacheCount})`;
      updateConditionalGroups(config);
    } finally {
      syncing = false;
    }
  }
  updateConditionalGroups(currentConfig);
  return {
    syncConfig,
    setNeedsCorsPermission(needs) {
      permBanner.style.display = needs ? "flex" : "none";
    },
    destroy() {
      for (const t of timers) clearTimeout(t);
      timers.clear();
      statusBadge.destroy();
      enabledSwitch.destroy();
      autoSwitch.destroy();
      targetSelect.destroy();
      sourceSelect.destroy();
      displaySelect.destroy();
      providerSelect.destroy();
      fallbackSwitch.destroy();
      libreUrlInput.destroy();
      libreKeyInput.destroy();
      deeplPlanSelect.destroy();
      deeplKeyInput.destroy();
      myMemoryEmailInput.destroy();
      providerCollapsible.destroy();
      root.remove();
    }
  };
}
function createDrawerMenu(ctx, initialConfig, callbacks) {
  const panels = [];
  const disposers = [];
  const drawerTab = ctx.ui.registerDrawerTab({
    id: "lumi-translator",
    title: "Traductor",
    shortName: "Traducir",
    description: "Traduce mensajes del bot/personaje con Google Translate y otros motores",
    keywords: ["translate", "traducir", "traductor", "idioma", "google", "deepl"],
    iconSvg: TRANSLATOR_ICON_SVG
  });
  panels.push(mountTranslatorPanel(ctx, drawerTab.root, initialConfig, callbacks));
  disposers.push(() => drawerTab.destroy());
  if (typeof ctx.ui.registerSettingsTab === "function") {
    try {
      const settingsTab = ctx.ui.registerSettingsTab({
        id: "lumi-translator",
        title: "Traductor",
        shortName: "Traducir",
        description: "Configura idioma, motor de traducci\xF3n y traducci\xF3n autom\xE1tica",
        keywords: ["translate", "traducir", "traductor", "idioma", "google", "deepl"],
        position: "bottom",
        iconSvg: TRANSLATOR_ICON_SVG
      });
      panels.push(mountTranslatorPanel(ctx, settingsTab.root, initialConfig, callbacks));
      disposers.push(() => settingsTab.destroy());
    } catch {
    }
  }
  return {
    syncConfig(config, cacheCount) {
      for (const panel of panels) panel.syncConfig(config, cacheCount);
    },
    setNeedsCorsPermission(needs) {
      for (const panel of panels) panel.setNeedsCorsPermission(needs);
    },
    destroy() {
      for (const panel of panels) panel.destroy();
      for (const dispose of disposers) {
        try {
          dispose();
        } catch {
        }
      }
    }
  };
}

// src/frontend/markdown.ts
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function sanitizeSafeUrl(rawUrl) {
  const trimmed = rawUrl.trim();
  if (/^https?:\/\/[^\s<>"']+$/i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return null;
}
function formatInlineMarkdown(escapedLine) {
  const inlineCodes = [];
  let out = escapedLine.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code class="lumi-tr-inline-code">${code}</code>`);
    return `\0IC${idx}\0`;
  });
  out = out.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (full, label, url) => {
    const safeUrl = sanitizeSafeUrl(url);
    if (!safeUrl) return label;
    return `<a class="lumi-tr-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  out = out.replace(/\*\*\*([^*\n]+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  out = out.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/~~([^~\n]+?)~~/g, "<del>$1</del>");
  out = out.replace(/(^|[^\w*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
  out = out.replace(/(^|[^\w_])_([^_\n]+?)_(?!_)/g, "$1<em>$2</em>");
  out = out.replace(/\u0000IC(\d+)\u0000/g, (_, idxStr) => {
    return inlineCodes[Number(idxStr)] ?? "";
  });
  return out;
}
function renderBlock(rawEscapedBlock, codeBlocks) {
  const block = rawEscapedBlock.trim();
  if (!block) return "";
  const pureCodeMatch = /^\u0000CB(\d+)\u0000$/.exec(block);
  if (pureCodeMatch) {
    return codeBlocks[Number(pureCodeMatch[1])] ?? "";
  }
  const lines = block.split("\n");
  if (lines.length === 1) {
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(lines[0]);
    if (headingMatch) {
      const level = headingMatch[1].length;
      return `<h${level} class="lumi-tr-heading">${formatInlineMarkdown(headingMatch[2])}</h${level}>`;
    }
  }
  if (lines.every((l) => /^&gt;\s?/.test(l))) {
    const inner = lines.map((l) => formatInlineMarkdown(l.replace(/^&gt;\s?/, ""))).join("<br>");
    return `<blockquote class="lumi-tr-quote">${inner}</blockquote>`;
  }
  if (lines.every((l) => /^\s*[-*+]\s+/.test(l))) {
    const items = lines.map((l) => `<li>${formatInlineMarkdown(l.replace(/^\s*[-*+]\s+/, ""))}</li>`).join("");
    return `<ul class="lumi-tr-list">${items}</ul>`;
  }
  if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
    const items = lines.map((l) => `<li>${formatInlineMarkdown(l.replace(/^\s*\d+\.\s+/, ""))}</li>`).join("");
    return `<ol class="lumi-tr-list">${items}</ol>`;
  }
  const htmlLines = lines.map((line) => {
    const cbOnly = /^\u0000CB(\d+)\u0000$/.exec(line.trim());
    if (cbOnly) return codeBlocks[Number(cbOnly[1])] ?? "";
    return formatInlineMarkdown(line);
  });
  return `<p class="lumi-tr-p">${htmlLines.join("<br>")}</p>`.replace(
    /\u0000CB(\d+)\u0000/g,
    (_, idxStr) => codeBlocks[Number(idxStr)] ?? ""
  );
}
function renderTranslatedMarkdown(markdownText) {
  if (!markdownText) return "";
  const codeBlocks = [];
  const withCodePlaceholders = markdownText.replace(/\r\n/g, "\n").replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const langBadge = lang ? `<div class="lumi-tr-code-lang">${escapeHtml(lang)}</div>` : "";
    codeBlocks.push(
      `<div class="lumi-tr-codeblock">${langBadge}<pre><code>${escapeHtml(code.replace(/\n$/, ""))}</code></pre></div>`
    );
    return `

\0CB${idx}\0

`;
  });
  const escaped = escapeHtml(withCodePlaceholders);
  const blocks = escaped.split(/\n{2,}/);
  return blocks.map((block) => renderBlock(block, codeBlocks)).filter(Boolean).join("");
}

// src/frontend/messageTranslator.ts
var PROVIDER_LABELS = {
  google: "Google Translate",
  mymemory: "MyMemory",
  libretranslate: "LibreTranslate",
  deepl: "DeepL"
};
function createTranslateSvg() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "lumi-tr-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const paths = [
    "m5 8 6 6",
    "m4 14 6-6 2-3",
    "M2 5h12",
    "M7 2h1",
    "m22 22-5-10-5 10",
    "M14 18h6"
  ];
  for (const d of paths) {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
  }
  return svg;
}
function createRestoreSvg() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "lumi-tr-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const p1 = document.createElementNS(ns, "path");
  p1.setAttribute("d", "M3 7v6h6");
  const p2 = document.createElementNS(ns, "path");
  p2.setAttribute("d", "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13");
  svg.appendChild(p1);
  svg.appendChild(p2);
  return svg;
}
function createSpinnerEl() {
  const spinner = document.createElement("span");
  spinner.className = "lumi-tr-spinner";
  spinner.setAttribute("aria-hidden", "true");
  return spinner;
}
function extractFallbackDomText(bubbleEl) {
  const contentEl = bubbleEl.querySelector('[data-component="MessageContent"]');
  if (!contentEl) return "";
  const clone = contentEl.cloneNode(true);
  for (const ignored of clone.querySelectorAll(".lumi-tr-panel, .lumi-tr-btn-wrap, [data-long-message-toggle]")) {
    ignored.remove();
  }
  return (clone.textContent || "").trim();
}
function createMessageTranslator(ctx, initialConfig, onNeedsCorsPermission) {
  let config = { ...initialConfig };
  let activeChatId = ctx.getActiveChat().chatId;
  let disposed = false;
  let syncTimer = null;
  const metaByMessageId = /* @__PURE__ */ new Map();
  const buttonInjections = /* @__PURE__ */ new Map();
  const panelInjections = /* @__PURE__ */ new Map();
  const sessionTranslations = /* @__PURE__ */ new Map();
  const pendingMessages = /* @__PURE__ */ new Set();
  const errorMessages = /* @__PURE__ */ new Map();
  function sendToBackend(msg) {
    ctx.sendToBackend(msg);
  }
  function requestChatMeta(chatId) {
    if (!chatId) return;
    sendToBackend({ type: "get_chat_messages_meta", chatId });
    if (ctx.messages.list) {
      void ctx.messages.list(chatId).then((list) => {
        if (disposed || ctx.getActiveChat().chatId !== chatId || !Array.isArray(list)) return;
        for (const item of list) {
          metaByMessageId.set(item.id, {
            id: item.id,
            isUser: Boolean(item.is_user),
            swipeId: typeof item.swipe_id === "number" ? item.swipe_id : 0
          });
        }
        syncVisibleMessages();
      }).catch(() => {
      });
    }
  }
  function resolveInnerMessageCard(el) {
    if (!el) return null;
    if (!el.hasAttribute("data-virtual-index")) return el;
    return el.querySelector("[data-message-id]:not([data-virtual-index])");
  }
  function listInnerMessageCards() {
    const byId = /* @__PURE__ */ new Map();
    for (const { messageId, element } of ctx.dom.listMessageElements()) {
      if (element.hasAttribute("data-virtual-index")) continue;
      if (!byId.has(messageId)) {
        byId.set(messageId, element);
      }
    }
    return Array.from(byId, ([messageId, element]) => ({ messageId, element }));
  }
  function findInnerCardById(messageId) {
    for (const item of ctx.dom.listMessageElements()) {
      if (item.messageId === messageId && !item.element.hasAttribute("data-virtual-index")) {
        return item.element;
      }
    }
    return resolveInnerMessageCard(ctx.dom.findMessageElement(messageId));
  }
  function isBotMessage(messageId, cardEl) {
    const meta = metaByMessageId.get(messageId);
    if (meta) return !meta.isUser;
    const part = cardEl.getAttribute("data-part");
    if (part === "user") return false;
    if (part === "character" || part === "streaming") return true;
    const cls = typeof cardEl.className === "string" ? cardEl.className : "";
    const hasChar = /(?:^|[\s_-])character(?:$|[\s_-])/i.test(cls);
    const hasUser = /(?:^|[\s_-])user(?:$|[\s_-])/i.test(cls);
    if (hasUser && !hasChar) return false;
    if (hasChar) return true;
    return false;
  }
  function updateButtonVisual(messageId, btn) {
    btn.replaceChildren();
    btn.classList.remove("is-idle", "is-loading", "is-active", "is-error");
    btn.disabled = false;
    const shortLang = getLanguageShortCode(config.targetLang);
    const isLoading = pendingMessages.has(messageId);
    const errText = errorMessages.get(messageId);
    const entry = sessionTranslations.get(messageId);
    const isShowing = Boolean(entry?.showing) && entry?.targetLang === config.targetLang;
    if (isLoading) {
      btn.classList.add("is-loading");
      btn.disabled = true;
      btn.title = "Traduciendo mensaje...";
      btn.appendChild(createSpinnerEl());
      const span2 = document.createElement("span");
      span2.textContent = "...";
      btn.appendChild(span2);
      return;
    }
    if (errText) {
      btn.classList.add("is-error");
      btn.title = `Error al traducir (${errText}). Clic para reintentar.`;
      btn.appendChild(createTranslateSvg());
      const span2 = document.createElement("span");
      span2.textContent = "Reintentar";
      btn.appendChild(span2);
      return;
    }
    if (isShowing) {
      btn.classList.add("is-active");
      btn.title = "Clic para volver al texto original";
      btn.appendChild(createRestoreSvg());
      const span2 = document.createElement("span");
      span2.textContent = `Original \xB7 ${shortLang}`;
      btn.appendChild(span2);
      return;
    }
    btn.classList.add("is-idle");
    btn.title = `Traducir mensaje a ${shortLang}`;
    btn.appendChild(createTranslateSvg());
    const span = document.createElement("span");
    span.textContent = "Traducir";
    btn.appendChild(span);
  }
  function removePanel(messageId, bubbleEl) {
    const existing = panelInjections.get(messageId);
    if (existing) {
      ctx.dom.uninject(existing.wrapper);
      panelInjections.delete(messageId);
    }
    if (bubbleEl) {
      bubbleEl.removeAttribute("data-lumi-tr-view");
    }
  }
  function removeButton(messageId, bubbleEl) {
    const existing = buttonInjections.get(messageId);
    if (existing) {
      ctx.dom.uninject(existing.wrapper);
      buttonInjections.delete(messageId);
    }
    if (bubbleEl) {
      bubbleEl.removeAttribute("data-lumi-tr-bot");
    }
  }
  function syncPanelForMessage(messageId, bubbleEl) {
    const entry = sessionTranslations.get(messageId);
    const currentSwipe = metaByMessageId.get(messageId)?.swipeId ?? 0;
    const matchesCurrent = Boolean(entry?.showing) && entry?.targetLang === config.targetLang && entry?.swipeId === currentSwipe;
    if (!config.enabled || !matchesCurrent || !entry) {
      removePanel(messageId, bubbleEl);
      return;
    }
    const contentEl = bubbleEl.querySelector('[data-component="MessageContent"]');
    const existing = panelInjections.get(messageId);
    if (existing && !existing.wrapper.isConnected) {
      ctx.dom.uninject(existing.wrapper);
      panelInjections.delete(messageId);
    }
    let inj = panelInjections.get(messageId);
    if (!inj) {
      const targetEl = contentEl ?? bubbleEl;
      const position = contentEl ? "afterend" : "beforeend";
      const wrapper = ctx.dom.inject(targetEl, '<div class="lumi-tr-panel"></div>', position);
      wrapper.classList.add("lumi-tr-panel-host");
      const panel = wrapper.querySelector(".lumi-tr-panel");
      inj = { wrapper, panel };
      panelInjections.set(messageId, inj);
    }
    if (config.displayMode === "replace") {
      bubbleEl.setAttribute("data-lumi-tr-view", "replace");
      inj.panel.classList.remove("is-bilingual");
      inj.panel.innerHTML = renderTranslatedMarkdown(entry.translatedText);
    } else {
      bubbleEl.setAttribute("data-lumi-tr-view", "bilingual");
      inj.panel.classList.add("is-bilingual");
      const shortLang = getLanguageShortCode(entry.targetLang);
      const providerLabel = PROVIDER_LABELS[entry.providerId] ?? entry.providerId;
      inj.panel.innerHTML = `<div class="lumi-tr-panel-meta">Traducci\xF3n (${shortLang}) \xB7 ${providerLabel}</div>` + renderTranslatedMarkdown(entry.translatedText);
    }
  }
  function ensureButtonForMessage(messageId, bubbleEl) {
    if (!config.enabled || !isBotMessage(messageId, bubbleEl)) {
      removeButton(messageId, bubbleEl);
      removePanel(messageId, bubbleEl);
      return;
    }
    bubbleEl.setAttribute("data-lumi-tr-bot", "true");
    const existing = buttonInjections.get(messageId);
    if (existing && !existing.wrapper.isConnected) {
      ctx.dom.uninject(existing.wrapper);
      buttonInjections.delete(messageId);
    }
    let inj = buttonInjections.get(messageId);
    if (!inj) {
      const wrapper = ctx.dom.inject(
        bubbleEl,
        '<div class="lumi-tr-btn-wrap"><button type="button" class="lumi-tr-btn is-idle"></button></div>',
        "afterbegin"
      );
      wrapper.classList.add("lumi-tr-btn-host");
      const button = wrapper.querySelector("button.lumi-tr-btn");
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        void handleButtonClick(messageId);
      });
      inj = { wrapper, button };
      buttonInjections.set(messageId, inj);
    }
    updateButtonVisual(messageId, inj.button);
    syncPanelForMessage(messageId, bubbleEl);
  }
  async function requestTranslation(messageId, opts) {
    const chatId = opts?.chatId ?? ctx.getActiveChat().chatId;
    if (!chatId || !config.enabled) return;
    errorMessages.delete(messageId);
    pendingMessages.add(messageId);
    refreshMessageUi(messageId);
    let rawText = opts?.text;
    let swipeId = opts?.swipeId ?? metaByMessageId.get(messageId)?.swipeId;
    if (!rawText && ctx.messages.get) {
      try {
        const dto = await ctx.messages.get(messageId);
        if (dto) {
          if (dto.is_user) {
            pendingMessages.delete(messageId);
            refreshMessageUi(messageId);
            return;
          }
          rawText = dto.content;
          swipeId = dto.swipe_id;
          metaByMessageId.set(messageId, {
            id: dto.id,
            isUser: dto.is_user,
            swipeId: dto.swipe_id
          });
        }
      } catch {
      }
    }
    const bubbleEl = findInnerCardById(messageId);
    const fallbackText = bubbleEl ? extractFallbackDomText(bubbleEl) : void 0;
    sendToBackend({
      type: "translate_message",
      chatId,
      messageId,
      swipeId,
      text: rawText,
      fallbackText,
      forceRefresh: opts?.forceRefresh
    });
  }
  async function handleButtonClick(messageId) {
    if (pendingMessages.has(messageId) || !config.enabled) return;
    const currentSwipe = metaByMessageId.get(messageId)?.swipeId ?? 0;
    const existing = sessionTranslations.get(messageId);
    if (existing && existing.targetLang === config.targetLang && existing.swipeId === currentSwipe && existing.providerId === config.providerId) {
      existing.showing = !existing.showing;
      refreshMessageUi(messageId);
      return;
    }
    await requestTranslation(messageId);
  }
  function refreshMessageUi(messageId) {
    const bubbleEl = findInnerCardById(messageId);
    if (!bubbleEl) return;
    ensureButtonForMessage(messageId, bubbleEl);
  }
  function syncVisibleMessages() {
    if (disposed) return;
    const currentChat = ctx.getActiveChat().chatId;
    if (currentChat !== activeChatId) {
      handleChatSwitch(currentChat);
    }
    for (const { element } of ctx.dom.listMessageElements()) {
      if (element.hasAttribute("data-virtual-index")) {
        if (element.hasAttribute("data-lumi-tr-bot")) element.removeAttribute("data-lumi-tr-bot");
        if (element.hasAttribute("data-lumi-tr-view")) element.removeAttribute("data-lumi-tr-view");
      }
    }
    const mounted = listInnerMessageCards();
    const mountedIds = /* @__PURE__ */ new Set();
    for (const { messageId, element } of mounted) {
      mountedIds.add(messageId);
      ensureButtonForMessage(messageId, element);
    }
    for (const [id, inj] of buttonInjections) {
      if (!mountedIds.has(id) && !inj.wrapper.isConnected) {
        if (!config.enabled) {
          ctx.dom.uninject(inj.wrapper);
          buttonInjections.delete(id);
        }
      }
    }
  }
  function scheduleSync(delayMs = 50) {
    if (disposed || syncTimer !== null) return;
    syncTimer = setTimeout(() => {
      syncTimer = null;
      syncVisibleMessages();
    }, delayMs);
  }
  function clearAllInjections() {
    for (const [id, inj] of buttonInjections) {
      ctx.dom.uninject(inj.wrapper);
      const el = findInnerCardById(id);
      el?.removeAttribute("data-lumi-tr-bot");
    }
    buttonInjections.clear();
    for (const [id, inj] of panelInjections) {
      ctx.dom.uninject(inj.wrapper);
      const el = findInnerCardById(id);
      el?.removeAttribute("data-lumi-tr-view");
    }
    panelInjections.clear();
  }
  function handleChatSwitch(nextChatId) {
    activeChatId = nextChatId;
    metaByMessageId.clear();
    sessionTranslations.clear();
    pendingMessages.clear();
    errorMessages.clear();
    clearAllInjections();
    if (nextChatId) {
      requestChatMeta(nextChatId);
    }
  }
  const unsubs = [];
  unsubs.push(
    ctx.events.on("CHAT_SWITCHED", (raw) => {
      const p = raw && typeof raw === "object" ? raw : null;
      const chatId = typeof p?.chatId === "string" ? p.chatId : ctx.getActiveChat().chatId;
      handleChatSwitch(chatId);
      scheduleSync(60);
    })
  );
  unsubs.push(
    ctx.events.on("CHAT_CHANGED", () => {
      const current = ctx.getActiveChat().chatId;
      if (current !== activeChatId) {
        handleChatSwitch(current);
      }
      scheduleSync(60);
    })
  );
  unsubs.push(
    ctx.events.on("CHARACTER_MESSAGE_RENDERED", () => {
      scheduleSync(40);
    })
  );
  unsubs.push(
    ctx.events.on("GENERATION_ENDED", (raw) => {
      if (!config.enabled || !config.autoTranslate) return;
      if (!raw || typeof raw !== "object") return;
      const payload = raw;
      if (payload.error || !payload.messageId) return;
      if (payload.generationType === "impersonate") return;
      const currentChatId = ctx.getActiveChat().chatId;
      if (payload.chatId && currentChatId && payload.chatId !== currentChatId) return;
      metaByMessageId.set(payload.messageId, {
        id: payload.messageId,
        isUser: false,
        swipeId: metaByMessageId.get(payload.messageId)?.swipeId ?? 0
      });
      void requestTranslation(payload.messageId, {
        chatId: payload.chatId ?? currentChatId ?? void 0,
        text: payload.content
      });
    })
  );
  unsubs.push(
    ctx.events.on("MESSAGE_SWIPED", (raw) => {
      if (!raw || typeof raw !== "object") return;
      const payload = raw;
      const msg = payload.message;
      if (!msg?.id) return;
      const swipeId = typeof msg.swipe_id === "number" ? msg.swipe_id : payload.swipeId ?? 0;
      metaByMessageId.set(msg.id, {
        id: msg.id,
        isUser: Boolean(msg.is_user),
        swipeId
      });
      if (!msg.is_user && payload.action === "added" && config.enabled && config.autoTranslate) {
        void requestTranslation(msg.id, {
          chatId: payload.chatId ?? ctx.getActiveChat().chatId ?? void 0,
          text: msg.content,
          swipeId
        });
      } else {
        refreshMessageUi(msg.id);
      }
    })
  );
  unsubs.push(
    ctx.events.on("MESSAGE_EDITED", (raw) => {
      if (!raw || typeof raw !== "object") return;
      const payload = raw;
      const id = payload.messageId ?? payload.id ?? payload.message?.id;
      if (id) {
        sessionTranslations.delete(id);
        errorMessages.delete(id);
        refreshMessageUi(id);
      }
    })
  );
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type !== "childList") continue;
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.hasAttribute("data-message-id") || node.getAttribute("data-component") === "MessageContent" || node.querySelector?.("[data-message-id]")) {
          scheduleSync(40);
          return;
        }
      }
    }
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
  requestChatMeta(activeChatId);
  scheduleSync(80);
  return {
    applyConfig(next) {
      const langOrProviderChanged = next.targetLang !== config.targetLang || next.sourceLang !== config.sourceLang || next.providerId !== config.providerId;
      config = { ...next };
      if (!config.enabled) {
        clearAllInjections();
        return;
      }
      if (langOrProviderChanged) {
        sessionTranslations.clear();
        errorMessages.clear();
      }
      syncVisibleMessages();
    },
    handleTranslationResult(msg) {
      pendingMessages.delete(msg.messageId);
      const currentChatId = ctx.getActiveChat().chatId;
      if (currentChatId && msg.chatId !== currentChatId) return;
      if (msg.needsCorsPermission) {
        onNeedsCorsPermission(true);
      }
      if (msg.error) {
        errorMessages.set(msg.messageId, msg.error);
        refreshMessageUi(msg.messageId);
        return;
      }
      onNeedsCorsPermission(false);
      errorMessages.delete(msg.messageId);
      metaByMessageId.set(msg.messageId, {
        id: msg.messageId,
        isUser: false,
        swipeId: msg.swipeId
      });
      sessionTranslations.set(msg.messageId, {
        swipeId: msg.swipeId,
        targetLang: msg.targetLang,
        providerId: msg.providerId,
        translatedText: msg.translatedText,
        showing: true
      });
      refreshMessageUi(msg.messageId);
    },
    handleChatMessagesMeta(msg) {
      const currentChatId = ctx.getActiveChat().chatId;
      if (currentChatId && msg.chatId !== currentChatId) return;
      for (const item of msg.messages) {
        metaByMessageId.set(item.id, item);
      }
      syncVisibleMessages();
    },
    translateVisibleBotMessages() {
      if (!config.enabled) return;
      const mounted = listInnerMessageCards();
      for (const { messageId, element } of mounted) {
        if (!isBotMessage(messageId, element)) continue;
        const existing = sessionTranslations.get(messageId);
        const currentSwipe = metaByMessageId.get(messageId)?.swipeId ?? 0;
        if (existing && existing.targetLang === config.targetLang && existing.swipeId === currentSwipe && existing.providerId === config.providerId) {
          existing.showing = true;
          refreshMessageUi(messageId);
        } else {
          void requestTranslation(messageId);
        }
      }
    },
    restoreAllToOriginal() {
      for (const entry of sessionTranslations.values()) {
        entry.showing = false;
      }
      syncVisibleMessages();
    },
    destroy() {
      disposed = true;
      if (syncTimer !== null) {
        clearTimeout(syncTimer);
        syncTimer = null;
      }
      observer.disconnect();
      for (const unsub of unsubs) {
        try {
          unsub();
        } catch {
        }
      }
      clearAllInjections();
      metaByMessageId.clear();
      sessionTranslations.clear();
      pendingMessages.clear();
      errorMessages.clear();
    }
  };
}

// src/frontend/styles.ts
var TRANSLATOR_STYLES = `
/* En escritorio dejamos espacio superior limpio SOLO en la tarjeta interna del bot.
   En m\xF3vil (<= 768px) Lumiverse ya reserva 30px-38px arriba, as\xED a\xF1adimos 0px de altura extra. */
@media (min-width: 769px) {
  [data-message-id]:not([data-virtual-index])[data-lumi-tr-bot="true"] {
    padding-top: 34px;
  }

  [data-component="BubbleMessage"]:not([data-virtual-index])[data-lumi-tr-bot="true"] {
    padding-top: 30px;
  }
}

/* Host wrapper creado por ctx.dom.inject (incluye selector :has para replay de virtualizaci\xF3n) */
.lumi-tr-btn-host,
[data-spindle-inj-id]:has(> .lumi-tr-btn-wrap) {
  position: absolute;
  top: 6px;
  left: 10px;
  z-index: 15;
  display: inline-flex;
  align-items: center;
  pointer-events: auto;
}

.lumi-tr-btn-wrap {
  display: inline-flex;
  align-items: center;
}

.lumi-tr-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--lcs-glass-border, rgba(255, 255, 255, 0.14));
  background: var(--lcs-glass-bg, rgba(24, 24, 36, 0.72));
  color: var(--lcs-text-secondary, rgba(235, 237, 248, 0.78));
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  backdrop-filter: blur(8px);
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.lumi-tr-btn:hover:not(:disabled) {
  background: var(--lcs-glass-bg-hover, rgba(36, 36, 54, 0.9));
  color: var(--lcs-text-primary, #ffffff);
  border-color: rgba(255, 255, 255, 0.28);
}

.lumi-tr-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.lumi-tr-btn:disabled {
  cursor: wait;
  opacity: 0.85;
}

.lumi-tr-btn.is-active {
  background: color-mix(in srgb, var(--lcs-accent, #7c5cff) 24%, var(--lcs-glass-bg, rgba(24, 24, 36, 0.85)));
  border-color: color-mix(in srgb, var(--lcs-accent, #7c5cff) 65%, transparent);
  color: var(--lcs-text-primary, #ffffff);
}

.lumi-tr-btn.is-error {
  border-color: rgba(239, 68, 68, 0.65);
  color: #fca5a5;
}

.lumi-tr-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.lumi-tr-spinner {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1.8px solid currentColor;
  border-top-color: transparent;
  animation: lumi-tr-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes lumi-tr-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Reemplazo visual no destructivo: oculta el texto original en pantalla sin tocar el DOM de React */
[data-message-id]:not([data-virtual-index])[data-lumi-tr-view="replace"] [data-component="MessageContent"] {
  display: none !important;
}

/* Si el usuario est\xE1 editando el mensaje, ocultar la traducci\xF3n para dejar visible el editor */
[data-message-id]:not([data-virtual-index]):has([data-component="MessageEditArea"]) .lumi-tr-panel-host,
[data-message-id]:not([data-virtual-index]):has(textarea) .lumi-tr-panel-host {
  display: none !important;
}

.lumi-tr-panel-host {
  display: block;
}

.lumi-tr-panel {
  font-size: inherit;
  line-height: 1.62;
  color: var(--lcs-text-primary, inherit);
  word-break: break-word;
}

.lumi-tr-panel.is-bilingual {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--lcs-glass-border, rgba(255, 255, 255, 0.16));
}

.lumi-tr-panel-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: var(--lcs-text-secondary, rgba(235, 237, 248, 0.72));
  background: rgba(255, 255, 255, 0.06);
}

.lumi-tr-p {
  margin: 0 0 0.75em 0;
}

.lumi-tr-p:last-child {
  margin-bottom: 0;
}

.lumi-tr-heading {
  margin: 0.75em 0 0.4em 0;
  font-weight: 600;
  line-height: 1.3;
}

.lumi-tr-quote {
  margin: 0.5em 0;
  padding: 4px 12px;
  border-left: 3px solid var(--lcs-accent, #7c5cff);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 0 6px 6px 0;
}

.lumi-tr-list {
  margin: 0.45em 0;
  padding-left: 1.35em;
}

.lumi-tr-inline-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.88em;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
}

.lumi-tr-codeblock {
  margin: 0.65em 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--lcs-glass-border, rgba(255, 255, 255, 0.14));
  background: rgba(0, 0, 0, 0.28);
}

.lumi-tr-code-lang {
  padding: 4px 10px;
  font-size: 11px;
  opacity: 0.7;
  border-bottom: 1px solid var(--lcs-glass-border, rgba(255, 255, 255, 0.1));
}

.lumi-tr-codeblock pre {
  margin: 0;
  padding: 10px 12px;
  overflow-x: auto;
  font-size: 0.88em;
  line-height: 1.45;
}

.lumi-tr-link {
  color: var(--lcs-accent, #9d8cff);
  text-decoration: underline;
}

/* Men\xFA en el Drawer Tab */
.lumi-tr-drawer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  font-size: 13px;
}

.lumi-tr-header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--lcs-glass-border, rgba(255, 255, 255, 0.12));
  background: rgba(255, 255, 255, 0.03);
}

.lumi-tr-title-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lumi-tr-title {
  font-size: 14px;
  font-weight: 600;
}

.lumi-tr-subtitle {
  font-size: 11.5px;
  color: var(--lcs-text-secondary, rgba(235, 237, 248, 0.68));
}

.lumi-tr-perm-banner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.45);
  background: rgba(245, 158, 11, 0.1);
  font-size: 12px;
}

.lumi-tr-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--lcs-glass-border, rgba(255, 255, 255, 0.12));
  background: rgba(255, 255, 255, 0.02);
}

.lumi-tr-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.lumi-tr-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.lumi-tr-label {
  font-size: 12px;
  font-weight: 500;
}

.lumi-tr-hint {
  font-size: 11px;
  color: var(--lcs-text-secondary, rgba(235, 237, 248, 0.64));
  line-height: 1.35;
}

.lumi-tr-actions {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.lumi-tr-action-btn {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--lcs-glass-border, rgba(255, 255, 255, 0.14));
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.lumi-tr-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
}

.lumi-tr-action-btn.is-primary {
  background: color-mix(in srgb, var(--lcs-accent, #7c5cff) 28%, transparent);
  border-color: color-mix(in srgb, var(--lcs-accent, #7c5cff) 65%, transparent);
}

.lumi-tr-action-btn.is-danger:hover {
  border-color: rgba(239, 68, 68, 0.55);
  background: rgba(239, 68, 68, 0.14);
}
`;

// src/frontend.ts
function setup(ctx) {
  let currentConfig = { ...DEFAULT_CONFIG };
  const removeStyle = ctx.dom.addStyle(TRANSLATOR_STYLES);
  const translator = createMessageTranslator(ctx, currentConfig, (needs) => {
    drawerMenu.setNeedsCorsPermission(needs);
  });
  const drawerMenu = createDrawerMenu(ctx, currentConfig, {
    onConfigPatch(patch) {
      currentConfig = { ...currentConfig, ...patch };
      translator.applyConfig(currentConfig);
      ctx.sendToBackend({ type: "save_config", config: patch });
    },
    onTranslateVisible() {
      translator.translateVisibleBotMessages();
    },
    onRestoreAll() {
      translator.restoreAllToOriginal();
    },
    onClearCache() {
      ctx.sendToBackend({ type: "clear_cache" });
    }
  });
  const unsubBackend = ctx.onBackendMessage((raw) => {
    if (!raw || typeof raw !== "object") return;
    const msg = raw;
    switch (msg.type) {
      case "config_updated": {
        currentConfig = { ...msg.config };
        drawerMenu.syncConfig(currentConfig, msg.cacheCount);
        translator.applyConfig(currentConfig);
        break;
      }
      case "translation_result": {
        translator.handleTranslationResult(msg);
        break;
      }
      case "cache_cleared": {
        drawerMenu.syncConfig(currentConfig, msg.cacheCount);
        break;
      }
      case "chat_messages_meta": {
        translator.handleChatMessagesMeta(msg);
        break;
      }
    }
  });
  ctx.sendToBackend({ type: "get_config" });
  const cleanup = () => {
    unsubBackend();
    translator.destroy();
    drawerMenu.destroy();
    removeStyle();
  };
  ctx.onTeardown?.(cleanup);
  return cleanup;
}
export {
  setup
};

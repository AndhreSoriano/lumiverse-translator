export const TRANSLATOR_STYLES = `
/* Espacio superior limpio SOLO en la tarjeta interna del bot (nunca en la fila virtualizada [data-virtual-index]) */
[data-message-id]:not([data-virtual-index])[data-lumi-tr-bot="true"] {
  padding-top: 34px;
}

[data-component="BubbleMessage"]:not([data-virtual-index])[data-lumi-tr-bot="true"] {
  padding-top: 30px;
}

/* Host wrapper creado por ctx.dom.inject */
.lumi-tr-btn-host {
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

/* Si el usuario está editando el mensaje, ocultar la traducción para dejar visible el editor */
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

/* Menú en el Drawer Tab */
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
`

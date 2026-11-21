# Lumiverse Translator (Extensión Spindle)

Extensión nativa de **Lumiverse** ([lumiverse.chat](https://lumiverse.chat/)) que añade un botón en la **esquina superior izquierda** de cada mensaje del bot/personaje para traducirlo de forma no destructiva y un menú en el cajón lateral (*drawer*) para configurar idioma, motor de traducción y traducción automática.

## Características principales

- **Botón en esquina superior izquierda:** Aparece únicamente en los mensajes del bot/personaje (`role === 'assistant'`). Un clic traduce el mensaje y reemplaza visualmente el texto mostrado; otro clic vuelve al texto original al instante usando caché.
- **Traducción no destructiva:** El texto guardado en la base de datos de Lumiverse y enviado al historial del modelo de IA permanece intacto en su idioma original.
- **Menú integrado en Lumiverse (`Traductor`):**
  - Seleccionar **idioma de destino** e **idioma de origen** (`auto` por defecto).
  - Activar o pausar la **traducción automática de mensajes nuevos del bot** (no re-traduce mensajes antiguos al abrir un chat).
  - Elegir modo de visualización: **Reemplazar texto visualmente** (por defecto) o **Modo bilingüe** (debajo del original).
  - Elegir proveedor de traducción:
    - **Google Translate** (por defecto, gratuito, sin API Key).
    - **MyMemory** (respaldo automático opcional).
    - **LibreTranslate** (URL e instancia *self-hosted* configurable).
    - **DeepL API** (planes Free y Pro con API Key).
  - Acciones rápidas: *Traducir mensajes visibles*, *Restaurar todos al original* y *Limpiar caché*.

## Instalación en Lumiverse

### Instalación directa desde GitHub (recomendado)

1. En Lumiverse, abre **Settings → Extensions** (o el panel de extensiones Spindle).
2. Pega la URL de este repositorio:
   `https://github.com/AndhreSoriano/lumiverse-translator`
3. Confirma la instalación y acepta los permisos solicitados en `spindle.json`:
   - `cors_proxy`: necesario para consultar Google Translate / MyMemory / LibreTranslate / DeepL desde el servidor de Lumiverse sin bloqueos CORS.
   - `chats`: necesario para leer el texto Markdown original y el `swipe_id` del mensaje sin modificar el chat.
4. Abre la pestaña **Traductor** en el *drawer* lateral de Lumiverse y elige tu idioma de destino y preferencias.

### Instalación manual / desarrollo local

1. **Compilar los bundles** (ya incluidos en `dist/` dentro del repositorio):
   ```bash
   npm install
   npm run build
   ```
   *(O con Bun directamente: `npm run build:bun`)*
2. **Copiar en Lumiverse:** coloca esta carpeta en el directorio de extensiones de tu instancia de Lumiverse y actívala concediendo los permisos `cors_proxy` y `chats`.

## Scripts de desarrollo y pruebas

```bash
npm run typecheck   # Verificación de tipos TypeScript con lumiverse-spindle-types
npm run build       # Genera dist/backend.js y dist/frontend.js + escaneo de seguridad Spindle
npm test            # Ejecuta pruebas unitarias (procesador de texto, proveedores, caché, Markdown XSS)
npm run verify      # Ejecuta typecheck + build + test
```

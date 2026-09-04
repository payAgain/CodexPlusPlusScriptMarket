// ==UserScript==
// @name         Codex Theme Studio
// @namespace    codex-plus-plus
// @version      1.2.1
// @description  Codex 桌面端主题美化：官方 CSS 变量驱动的配色预设（Claude 陶土/墨蓝/曜石/青屿）、内置字体、自动适配深浅色的自定义强调色、圆角与超椭圆圆角、聊天字号，随时一键回到官方默认。
// @match        app://-/*
// @run-at       document-start
// ==/UserScript==

(() => {
  "use strict";

  if (window.top !== window.self) return;

  const SCRIPT_ID = "codex-theme-studio";
  const SCRIPT_VERSION = "1.2.1";
  const API_KEY = "__codexThemeStudio";
  const STYLE_ID = "codex-theme-studio-style";
  const STORAGE_KEY = "__codexThemeStudioSettingsV1";
  const BUTTON_ID = "codex-theme-studio-gear";
  const PANEL_ID = "codex-theme-studio-panel";
  const HEADER_CLUSTER_SELECTOR = ".ms-auto.flex.shrink-0.items-center";
  const POLL_INTERVAL_MS = 1000;

  const previous = window[API_KEY];
  if (previous && typeof previous.destroy === "function") previous.destroy();

  // ---------------------------------------------------------------- settings

  const DEFAULTS = {
    version: 1,
    preset: "official",
    accent: "",
    radiusScale: null,
    cornerShape: "",
    uiFont: "",
    codeFont: "",
    chatFontSize: "",
    codeFontSize: "",
  };

  const PRESETS = {
    official: { name: "官方默认", accent: "", radiusScale: null, cornerShape: "", tokens: null },
    claude: { name: "Claude 陶土", accent: "#d97757", radiusScale: 1.15, cornerShape: "superellipse(1.25)", tokens: {
      "--color-background-surface": "#121212",
      "--color-background-surface-under": "#0d0d0d",
      "--color-background-primary-soft": "rgba(30, 29, 26, 0.96)",
      "--color-background-elevated-primary": "rgba(32, 31, 28, 0.97)",
      "--color-background-elevated-primary-opaque": "#201f1c",
      "--color-background-elevated-secondary": "rgba(245, 242, 232, 0.050)",
      "--color-background-elevated-secondary-opaque": "#1a1a19",
      "--color-background-application-menu": "#191917",
      "--color-codex-application-menu": "#191917",
      "--color-background-control-opaque": "#242421",
      "--color-background-editor-opaque": "#1a1a19",
      "--color-background-mode-toggle-selected": "#242421",
      "--color-background-user-message": "color-mix(in oklab, #d97757 9%, transparent)",
      "--color-surface": "#121212",
      "--color-surface-secondary": "#191917",
      "--color-surface-tertiary": "#1a1a19",
      "--color-surface-elevated-secondary": "#242421",
      "--color-token-bg-primary": "#121212",
      "--color-token-main-surface-primary": "#121212",
      "--codex-base-surface": "#121212",
      "--wb-surface-primary": "#121212",
      "--wb-surface-secondary": "#191917",
      "--color-background-composer-primary": "#d97757",
      "--color-text-composer-primary": "#121212",
      "--color-text-on-accent": "#121212",
      "--codex-base-accent": "#d97757",
      "--color-background-primary-ghost-hover": "rgba(245, 242, 232, 0.065)",
      "--color-background-primary-solid": "#f5f2e8",
      "--color-text-primary-solid": "#121212",
      "--color-foreground-application-menu": "#f5f2e8",
      "--color-codex-application-menu-selection": "rgba(245, 242, 232, 0.065)",
      "--color-border-application-menu-separator": "#383631",
      "--color-border": "rgba(245, 242, 232, 0.10)",
      "--color-border-light": "rgba(245, 242, 232, 0.055)",
      "--color-border-subtle": "rgba(245, 242, 232, 0.055)",
      "--color-border-heavy": "rgba(245, 242, 232, 0.16)",
      "--color-border-strong": "rgba(245, 242, 232, 0.16)",
      "--color-border-primary-outline": "rgba(245, 242, 232, 0.16)",
      "--elevation-sidebar": "1px 0 0 rgba(245, 242, 232, 0.07)",
      "--elevation-composer": "inset 0 0 0 1px rgba(245, 242, 232, 0.09), 0 18px 50px rgba(0, 0, 0, 0.32)",
      "--color-text": "#f5f2e8",
      "--color-text-emphasis": "#f5f2e8",
      "--color-text-foreground": "#f5f2e8",
      "--color-text-secondary": "color-mix(in srgb, #f5f2e8 70%, transparent)",
      "--color-text-foreground-secondary": "rgba(245, 242, 232, 0.70)",
      "--color-text-tertiary": "rgba(245, 242, 232, 0.50)",
      "--color-text-foreground-tertiary": "rgba(245, 242, 232, 0.50)",
      "--color-text-disabled": "rgba(245, 242, 232, 0.44)",
      "--color-text-inverse": "#121212",
      "--color-icon-primary": "rgba(245, 242, 232, 0.92)",
      "--color-icon-secondary": "rgba(245, 242, 232, 0.70)",
      "--color-icon-tertiary": "rgba(245, 242, 232, 0.50)",
    } },
    ink: { name: "墨蓝", accent: "#4da3ff", radiusScale: 1.25, cornerShape: "superellipse(1.5)", tokens: {
      "--color-background-surface": "#0f141c",
      "--color-background-surface-under": "#0b0f16",
      "--color-background-primary-soft": "rgba(23, 32, 46, 0.96)",
      "--color-background-elevated-primary": "rgba(28, 39, 56, 0.97)",
      "--color-background-elevated-primary-opaque": "#1c2738",
      "--color-background-elevated-secondary": "rgba(255, 255, 255, 0.045)",
      "--color-background-elevated-secondary-opaque": "#16202e",
      "--color-background-application-menu": "#141c28",
      "--color-codex-application-menu": "#141c28",
      "--color-background-control-opaque": "#1b2534",
      "--color-background-editor-opaque": "#141d29",
      "--color-background-mode-toggle-selected": "#1b2534",
      "--color-background-user-message": "color-mix(in oklab, #7fb2ff 7%, transparent)",
      "--color-border": "rgba(148, 184, 255, 0.10)",
      "--color-border-light": "rgba(148, 184, 255, 0.05)",
      "--color-border-subtle": "rgba(148, 184, 255, 0.05)",
      "--color-border-heavy": "rgba(148, 184, 255, 0.18)",
      "--color-border-strong": "rgba(148, 184, 255, 0.18)",
      "--color-border-primary-outline": "rgba(148, 184, 255, 0.18)",
      "--color-text": "#dbe6f5",
      "--color-text-emphasis": "#dbe6f5",
      "--color-text-foreground": "#dbe6f5",
      "--color-text-secondary": "color-mix(in srgb, #dbe6f5 65%, transparent)",
      "--color-text-foreground-secondary": "rgba(219, 230, 245, 0.71)",
      "--color-text-tertiary": "rgba(219, 230, 245, 0.50)",
      "--color-text-foreground-tertiary": "rgba(219, 230, 245, 0.50)",
      "--color-text-disabled": "rgba(219, 230, 245, 0.50)",
      "--color-text-inverse": "#0b0f16",
      "--color-icon-primary": "rgba(219, 230, 245, 0.90)",
      "--color-icon-secondary": "rgba(219, 230, 245, 0.71)",
      "--color-icon-tertiary": "rgba(219, 230, 245, 0.51)",
    } },
    obsidian: { name: "曜石", accent: "#8b9dff", radiusScale: 1.0, cornerShape: "superellipse(1.5)", tokens: {
      "--color-background-surface": "#000000",
      "--color-background-surface-under": "#000000",
      "--color-background-primary-soft": "rgba(16, 16, 16, 0.96)",
      "--color-background-elevated-primary": "rgba(26, 26, 26, 0.97)",
      "--color-background-elevated-primary-opaque": "#1a1a1a",
      "--color-background-elevated-secondary": "rgba(255, 255, 255, 0.040)",
      "--color-background-elevated-secondary-opaque": "#111111",
      "--color-background-application-menu": "#0d0d0d",
      "--color-codex-application-menu": "#0d0d0d",
      "--color-background-control-opaque": "#141414",
      "--color-background-editor-opaque": "#0d0d0d",
      "--color-background-mode-toggle-selected": "#141414",
      "--color-background-user-message": "color-mix(in oklab, #ffffff 5%, transparent)",
      "--color-border": "rgba(255, 255, 255, 0.09)",
      "--color-border-light": "rgba(255, 255, 255, 0.045)",
      "--color-border-subtle": "rgba(255, 255, 255, 0.045)",
      "--color-border-heavy": "rgba(255, 255, 255, 0.17)",
      "--color-border-strong": "rgba(255, 255, 255, 0.17)",
      "--color-border-primary-outline": "rgba(255, 255, 255, 0.17)",
      "--color-text": "#e8e8e8",
      "--color-text-emphasis": "#e8e8e8",
      "--color-text-foreground": "#e8e8e8",
      "--color-text-secondary": "color-mix(in srgb, #e8e8e8 65%, transparent)",
      "--color-text-foreground-secondary": "rgba(232, 232, 232, 0.71)",
      "--color-text-tertiary": "rgba(232, 232, 232, 0.50)",
      "--color-text-foreground-tertiary": "rgba(232, 232, 232, 0.50)",
      "--color-text-disabled": "rgba(232, 232, 232, 0.50)",
      "--color-text-inverse": "#0a0a0a",
      "--color-icon-primary": "rgba(232, 232, 232, 0.90)",
      "--color-icon-secondary": "rgba(232, 232, 232, 0.71)",
      "--color-icon-tertiary": "rgba(232, 232, 232, 0.51)",
    } },
    tea: { name: "青屿", accent: "#3ecf8e", radiusScale: 1.5, cornerShape: "superellipse(2.5)", tokens: {
      "--color-background-surface": "#0e1512",
      "--color-background-surface-under": "#0a100e",
      "--color-background-primary-soft": "rgba(21, 33, 28, 0.96)",
      "--color-background-elevated-primary": "rgba(24, 36, 31, 0.97)",
      "--color-background-elevated-primary-opaque": "#18241f",
      "--color-background-elevated-secondary": "rgba(255, 255, 255, 0.045)",
      "--color-background-elevated-secondary-opaque": "#141f1a",
      "--color-background-application-menu": "#121a16",
      "--color-codex-application-menu": "#121a16",
      "--color-background-control-opaque": "#17231e",
      "--color-background-editor-opaque": "#121a16",
      "--color-background-mode-toggle-selected": "#17231e",
      "--color-background-user-message": "color-mix(in oklab, #3ecf8e 7%, transparent)",
      "--color-border": "rgba(160, 220, 190, 0.10)",
      "--color-border-light": "rgba(160, 220, 190, 0.05)",
      "--color-border-subtle": "rgba(160, 220, 190, 0.05)",
      "--color-border-heavy": "rgba(160, 220, 190, 0.18)",
      "--color-border-strong": "rgba(160, 220, 190, 0.18)",
      "--color-border-primary-outline": "rgba(160, 220, 190, 0.18)",
      "--color-text": "#d9e8df",
      "--color-text-emphasis": "#d9e8df",
      "--color-text-foreground": "#d9e8df",
      "--color-text-secondary": "color-mix(in srgb, #d9e8df 65%, transparent)",
      "--color-text-foreground-secondary": "rgba(217, 232, 223, 0.71)",
      "--color-text-tertiary": "rgba(217, 232, 223, 0.50)",
      "--color-text-foreground-tertiary": "rgba(217, 232, 223, 0.50)",
      "--color-text-disabled": "rgba(217, 232, 223, 0.50)",
      "--color-text-inverse": "#0a100e",
      "--color-icon-primary": "rgba(217, 232, 223, 0.90)",
      "--color-icon-secondary": "rgba(217, 232, 223, 0.71)",
      "--color-icon-tertiary": "rgba(217, 232, 223, 0.51)",
    } },
  };

  let settings = loadSettings();

  function loadSettings() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      if (raw && typeof raw === "object") {
        return normalize({ ...structuredClone(DEFAULTS), ...raw });
      }
    } catch { /* corrupted storage falls back to defaults */ }
    return structuredClone(DEFAULTS);
  }

  function normalize(value) {
    const next = value;
    if (!PRESETS[next.preset]) next.preset = "official";
    if (typeof next.radiusScale !== "number" || !Number.isFinite(next.radiusScale)) next.radiusScale = null;
    if (typeof next.accent !== "string") next.accent = "";
    for (const key of ["uiFont", "codeFont", "chatFontSize", "codeFontSize", "cornerShape"]) {
      if (typeof next[key] !== "string") next[key] = "";
    }
    delete next.icons;
    return next;
  }

  function saveSettings() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* private mode */ }
  }

  // -------------------------------------------------------------------- css

  const FONT_ASSETS = {
    plex400: "__CTS_FONT_PLEX_400__",
    plex600: "__CTS_FONT_PLEX_600__",
    noto400: "__CTS_FONT_NOTO_400__",
    noto600: "__CTS_FONT_NOTO_600__",
    recursive: "__CTS_FONT_RECURSIVE__",
  };
  const BODY_FONT_FAMILY = "Cts Reading";
  const CODE_FONT_FAMILY = "Cts Rec Mono Linear";
  const BODY_FONT_STACK = `'${BODY_FONT_FAMILY}', 'IBM Plex Serif', 'Noto Sans SC', 'Microsoft YaHei UI', 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif`;
  const CODE_FONT_STACK = `'${CODE_FONT_FAMILY}', ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace`;
  const SANS_FALLBACK = BODY_FONT_STACK;
  const MONO_FALLBACK = CODE_FONT_STACK;

  function buildFontFaceCss() {
    const latin = "U+0000-024F, U+1E00-1EFF, U+2000-206F, U+2070-209F, U+20A0-20CF, U+2100-214F, U+2190-21FF, U+2200-22FF";
    const cjk = "U+3000-303F, U+3040-309F, U+30A0-30FF, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF, U+FE30-FE4F, U+FF00-FFEF";
    return `
      @font-face {
        font-family: '${BODY_FONT_FAMILY}';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('${FONT_ASSETS.plex400}') format('woff2');
        unicode-range: ${latin};
      }
      @font-face {
        font-family: '${BODY_FONT_FAMILY}';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('${FONT_ASSETS.noto400}') format('woff2');
        unicode-range: ${cjk};
      }
      @font-face {
        font-family: '${BODY_FONT_FAMILY}';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url('${FONT_ASSETS.plex600}') format('woff2');
        unicode-range: ${latin};
      }
      @font-face {
        font-family: '${BODY_FONT_FAMILY}';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url('${FONT_ASSETS.noto600}') format('woff2');
        unicode-range: ${cjk};
      }
      @font-face {
        font-family: '${CODE_FONT_FAMILY}';
        font-style: normal;
        font-weight: 300 1000;
        font-display: swap;
        src: url('${FONT_ASSETS.recursive}') format('woff2');
        font-variation-settings: "MONO" 1, "CASL" 0, "slnt" 0;
      }
    `;
  }

  function sanitizeFontName(name) {
    return name.replace(/["';{}\\]/g, "").trim().slice(0, 80);
  }

  function fontStack(name, fallback) {
    const clean = sanitizeFontName(name);
    return clean ? `"${clean}", ${fallback}` : fallback;
  }

  function isHexColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value);
  }

  function accentTokens(accent, mode = "dark") {
    const light = mode === "light";
    return {
      "--color-accent-blue": accent,
      "--color-background-info-solid": accent,
      "--color-background-info-soft": light
        ? `color-mix(in srgb, ${accent} 14%, transparent)`
        : `color-mix(in srgb, ${accent} 30%, transparent)`,
      "--color-background-info-surface": light
        ? `color-mix(in oklab, ${accent} 12%, #fff)`
        : `color-mix(in oklab, ${accent} 22%, #000)`,
      "--color-background-accent": light
        ? `color-mix(in oklab, ${accent} 14%, #fff)`
        : `color-mix(in oklab, ${accent} 26%, #000)`,
      "--color-background-accent-hover": light
        ? `color-mix(in oklab, ${accent} 18%, #fff)`
        : `color-mix(in oklab, ${accent} 30%, #000)`,
      "--color-background-accent-active": light
        ? `color-mix(in oklab, ${accent} 22%, #fff)`
        : `color-mix(in oklab, ${accent} 34%, #000)`,
      "--color-background-tip-badge": light
        ? `color-mix(in oklab, ${accent} 10%, transparent)`
        : `color-mix(in oklab, ${accent} 16%, transparent)`,
      "--color-background-tip-soft": light
        ? `color-mix(in oklab, ${accent} 10%, transparent)`
        : `color-mix(in oklab, ${accent} 16%, transparent)`,
      "--color-background-text-selection": light
        ? `color-mix(in srgb, ${accent} 22%, transparent)`
        : `color-mix(in srgb, ${accent} 30%, transparent)`,
      "--color-background-attribution-highlight": light
        ? `color-mix(in srgb, ${accent} 14%, transparent)`
        : `color-mix(in srgb, ${accent} 30%, transparent)`,
      "--color-border-focus": `color-mix(in srgb, ${accent} 76%, transparent)`,
      "--color-text-accent": light
        ? `color-mix(in oklab, ${accent} 74%, #101418)`
        : `color-mix(in srgb, ${accent} 72%, white)`,
      "--color-text-info": light
        ? `color-mix(in oklab, ${accent} 74%, #101418)`
        : `color-mix(in srgb, ${accent} 72%, white)`,
      "--color-text-info-soft": light
        ? `color-mix(in oklab, ${accent} 78%, #101418)`
        : accent,
      "--color-text-tip": light
        ? `color-mix(in oklab, ${accent} 74%, #101418)`
        : `color-mix(in srgb, ${accent} 72%, white)`,
      "--color-text-tip-badge": light
        ? `color-mix(in oklab, ${accent} 74%, #101418)`
        : `color-mix(in srgb, ${accent} 72%, white)`,
      "--color-icon-accent": light
        ? `color-mix(in oklab, ${accent} 76%, #101418)`
        : `color-mix(in srgb, ${accent} 72%, white)`,
    };
  }

  function buildGlobalOverrides() {
    const lines = [];
    const emit = (name, value) => { if (value) lines.push(`  ${name}: ${value} !important;`); };
    if (typeof settings.radiusScale === "number") emit("--codex-corner-radius-scale", String(settings.radiusScale));
    if (settings.cornerShape) emit("--codex-corner-shape", settings.cornerShape);
    const uiStack = settings.uiFont ? fontStack(settings.uiFont, SANS_FALLBACK) : SANS_FALLBACK;
    const codeStack = settings.codeFont ? fontStack(settings.codeFont, MONO_FALLBACK) : MONO_FALLBACK;
    emit("--font-sans", uiStack);
    emit("--font-sans-default", uiStack);
    emit("--font-openai-sans", uiStack);
    emit("--default-font-family", uiStack);
    emit("--font-serif", uiStack);
    emit("--font-mono", codeStack);
    emit("--font-mono-default", codeStack);
    emit("--default-mono-font-family", codeStack);
    if (settings.chatFontSize) emit("--codex-chat-font-size", settings.chatFontSize);
    if (settings.codeFontSize) emit("--codex-chat-code-font-size", settings.codeFontSize);
    return lines.length ? `:root {\n${lines.join("\n")}\n}` : "";
  }

  function buildDarkOverrides() {
    const preset = PRESETS[settings.preset];
    const accent = isHexColor(settings.accent) ? settings.accent : "";
    if (!preset || !preset.tokens) {
      if (!accent) return "";
      const lines = Object.entries(accentTokens(accent, "dark"))
        .map(([name, value]) => `  ${name}: ${value} !important;`);
      return `html.electron-dark {\n${lines.join("\n")}\n}`;
    }
    const lines = Object.entries(preset.tokens).map(([name, value]) => `  ${name}: ${value} !important;`);
    const effectiveAccent = accent || preset.accent;
    if (effectiveAccent && isHexColor(effectiveAccent)) {
      for (const [name, value] of Object.entries(accentTokens(effectiveAccent, "dark"))) lines.push(`  ${name}: ${value} !important;`);
    }
    return `html.electron-dark {\n${lines.join("\n")}\n}`;
  }

  function buildLightOverrides() {
    const preset = PRESETS[settings.preset];
    const accent = isHexColor(settings.accent) ? settings.accent : (preset?.accent || "");
    if (!accent || !isHexColor(accent)) return "";
    const lines = Object.entries(accentTokens(accent, "light"))
      .map(([name, value]) => `  ${name}: ${value} !important;`);
    return `html:not(.electron-dark) {\n${lines.join("\n")}\n}`;
  }

  // --------------------------------------------------------------- app skin
  function buildClaudeOverrides() {
    if (settings.preset !== "claude") return "";
    return `
      html[data-theme-studio="claude"].electron-dark body {
        background: #121212 !important;
        color: #f5f2e8 !important;
      }

      html[data-theme-studio="claude"].electron-dark #root,
      html[data-theme-studio="claude"].electron-dark main,
      html[data-theme-studio="claude"].electron-dark [class*="_ApplicationMenuTopBar_"] {
        background: #121212 !important;
        background-color: #121212 !important;
      }

      html[data-theme-studio="claude"].electron-dark main {
        border-left: 1px solid rgba(245, 242, 232, 0.07) !important;
      }

      html[data-theme-studio="claude"].electron-dark aside.app-shell-left-panel {
        background: #191917 !important;
        background-color: #191917 !important;
        box-shadow: 1px 0 0 rgba(245, 242, 232, 0.07) !important;
      }

      html[data-theme-studio="claude"].electron-dark #app-shell-sidebar,
      html[data-theme-studio="claude"].electron-dark aside .vertical-scroll-fade-mask {
        background: transparent !important;
        background-color: transparent !important;
      }

      html[data-theme-studio="claude"].electron-dark aside .sidebar-item {
        border-radius: 8px !important;
        color: rgba(245, 242, 232, 0.74) !important;
      }

      html[data-theme-studio="claude"].electron-dark aside .sidebar-item:hover,
      html[data-theme-studio="claude"].electron-dark aside .sidebar-item[data-active="true"] {
        background: rgba(245, 242, 232, 0.065) !important;
        background-color: rgba(245, 242, 232, 0.065) !important;
        color: #f5f2e8 !important;
      }

      html[data-theme-studio="claude"].electron-dark main :is(h1, h2, h3) {
        color: #f5f2e8 !important;
        font-family: var(--font-serif, Georgia, "Times New Roman", serif) !important;
        font-weight: 600 !important;
      }

      html[data-theme-studio="claude"].electron-dark [class*="_ComposerLayoutRoot_"] {
        background: rgba(38, 36, 32, 0.94) !important;
        background-color: rgba(38, 36, 32, 0.94) !important;
        border-radius: 22px !important;
        box-shadow: inset 0 0 0 1px rgba(245, 242, 232, 0.09), 0 18px 50px rgba(0, 0, 0, 0.32) !important;
      }

      html[data-theme-studio="claude"].electron-dark button.bg-composer-primary {
        background: #d97757 !important;
        background-color: #d97757 !important;
        color: #121212 !important;
      }

      html[data-theme-studio="claude"].electron-dark button.bg-composer-primary:hover:not(:disabled) {
        background: #e0a18b !important;
        background-color: #e0a18b !important;
      }

      html[data-theme-studio="claude"].electron-dark ::selection {
        background: rgba(217, 119, 87, 0.32) !important;
        background-color: rgba(217, 119, 87, 0.32) !important;
      }

      html[data-theme-studio="claude"].electron-dark ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }

      html[data-theme-studio="claude"].electron-dark ::-webkit-scrollbar-thumb {
        border: 3px solid transparent;
        border-radius: 999px;
        background: rgba(245, 242, 232, 0.16) content-box;
        background-color: rgba(245, 242, 232, 0.16) content-box;
      }
    `;
  }



  function buildPanelCss() {
    return `
#${BUTTON_ID} {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px; border: none; cursor: pointer;
  color: var(--color-icon-secondary); background: transparent; padding: 0;
}
#${BUTTON_ID}:hover { background: var(--color-background-button-secondary-hover); color: var(--color-icon-primary); }
#${PANEL_ID} {
  position: fixed; top: 56px; right: 16px; width: 320px; max-height: min(72vh, 640px);
  overflow-y: auto; z-index: 2147483000; display: none;
  background: var(--color-background-elevated-primary, rgba(30, 30, 30, 0.97));
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: calc(12px * var(--codex-corner-radius-scale, 1.25));
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  color: var(--color-text, #dfdfdf); font-size: 13px; line-height: 1.5;
  font-family: var(--font-sans, system-ui, sans-serif); padding: 14px;
}
#${PANEL_ID}[data-open="true"] { display: block; }
#${PANEL_ID} .cts-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
#${PANEL_ID} .cts-section { margin-bottom: 12px; }
#${PANEL_ID} .cts-label { display: block; font-size: 12px; color: var(--color-text-secondary, #999); margin-bottom: 4px; }
#${PANEL_ID} .cts-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
#${PANEL_ID} .cts-preset {
  padding: 7px 8px; border-radius: 8px; cursor: pointer; font-size: 12px; text-align: center;
  border: 1px solid var(--color-border, rgba(255,255,255,0.1)); background: var(--color-background-button-secondary-inactive, transparent);
  color: var(--color-text, inherit);
}
#${PANEL_ID} .cts-preset:hover { background: var(--color-background-button-secondary-hover, rgba(255,255,255,0.06)); }
#${PANEL_ID} .cts-preset[data-active="true"] { border-color: var(--color-accent-blue, #339cff); color: var(--color-text-accent, #99ceff); }
#${PANEL_ID} input[type="text"], #${PANEL_ID} input[type="number"] {
  width: 100%; box-sizing: border-box; padding: 5px 8px; border-radius: 7px; font-size: 12px;
  border: 1px solid var(--color-border, rgba(255,255,255,0.1));
  background: var(--color-background-primary-soft, rgba(255,255,255,0.04)); color: var(--color-text, inherit);
}
#${PANEL_ID} input[type="color"] { width: 42px; height: 26px; padding: 0; border: 1px solid var(--color-border, rgba(255,255,255,0.1)); border-radius: 6px; background: none; cursor: pointer; vertical-align: middle; }
#${PANEL_ID} input[type="range"] { width: 100%; accent-color: var(--color-accent-blue, #339cff); }
#${PANEL_ID} select {
  width: 100%; padding: 5px 8px; border-radius: 7px; font-size: 12px;
  border: 1px solid var(--color-border, rgba(255,255,255,0.1));
  background: var(--color-background-primary-soft, rgba(255,255,255,0.04)); color: var(--color-text, inherit);
}
#${PANEL_ID} label.cts-check { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 3px 0; cursor: pointer; }
#${PANEL_ID} .cts-row { display: flex; gap: 8px; align-items: center; }
#${PANEL_ID} .cts-row > * { flex: 1; }
#${PANEL_ID} .cts-accent-row { display: flex; gap: 8px; align-items: center; }
#${PANEL_ID} .cts-accent-row button { flex: none; }
#${PANEL_ID} .cts-hint { font-size: 11px; color: var(--color-text-tertiary, #888); margin-top: 3px; }
#${PANEL_ID} .cts-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--color-border-light, rgba(255,255,255,0.05)); }
#${PANEL_ID} .cts-footer .cts-version { font-size: 11px; color: var(--color-text-tertiary, #888); }
#${PANEL_ID} button.cts-action {
  padding: 5px 10px; border-radius: 7px; font-size: 12px; cursor: pointer;
  border: 1px solid var(--color-border, rgba(255,255,255,0.1));
  background: var(--color-background-button-secondary-inactive, transparent); color: var(--color-text, inherit);
}
#${PANEL_ID} button.cts-action:hover { background: var(--color-background-button-secondary-hover, rgba(255,255,255,0.06)); }
`;
  }

  let styleEl = null;

  function applyCss() {
    if (!styleEl || !styleEl.isConnected) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    const parts = [buildFontFaceCss(), buildGlobalOverrides(), buildDarkOverrides(), buildLightOverrides(), buildClaudeOverrides(), buildPanelCss()];
    if (settings.preset === "claude") document.documentElement.dataset.themeStudio = "claude";
    else delete document.documentElement.dataset.themeStudio;
    styleEl.textContent = parts.filter(Boolean).join("\n");
  }

  // ---------------------------------------------------------------- panel ui

  let gearButton = null;
  let panelEl = null;
  let pollTimer = 0;

  const GEAR_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

  function ensureGearButton() {
    if (gearButton && gearButton.isConnected) return;
    const cluster = document.querySelector(HEADER_CLUSTER_SELECTOR);
    if (!cluster) return;
    gearButton = document.createElement("button");
    gearButton.id = BUTTON_ID;
    gearButton.type = "button";
    gearButton.title = "主题工坊";
    gearButton.setAttribute("aria-label", "主题工坊");
    gearButton.innerHTML = GEAR_SVG;
    gearButton.addEventListener("click", (event) => {
      event.stopPropagation();
      togglePanel();
    });
    cluster.appendChild(gearButton);
  }

  function togglePanel(force) {
    if (!panelEl) buildPanel();
    const open = typeof force === "boolean" ? force : panelEl.dataset.open !== "true";
    panelEl.dataset.open = open ? "true" : "false";
    if (open) renderPanel();
  }

  function buildPanel() {
    panelEl = document.createElement("div");
    panelEl.id = PANEL_ID;
    panelEl.dataset.open = "false";
    document.body ? document.body.appendChild(panelEl) : document.documentElement.appendChild(panelEl);
    panelEl.addEventListener("pointerdown", (event) => event.stopPropagation());
    document.addEventListener("pointerdown", (event) => {
      if (panelEl.dataset.open === "true" && !panelEl.contains(event.target) && event.target !== gearButton) {
        togglePanel(false);
      }
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") togglePanel(false);
    });
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderPanel() {
    if (!panelEl) return;
    panelEl.textContent = "";

    panelEl.appendChild(el("div", "cts-title", "主题工坊"));

    const presetSection = el("div", "cts-section");
    presetSection.appendChild(el("span", "cts-label", "预设"));
    const presetGrid = el("div", "cts-presets");
    for (const [id, preset] of Object.entries(PRESETS)) {
      const item = el("button", "cts-preset", preset.name);
      item.type = "button";
      item.dataset.active = settings.preset === id ? "true" : "false";
      item.addEventListener("click", () => {
        settings = {
          ...structuredClone(DEFAULTS),
          preset: id,
          accent: preset.accent || "",
          radiusScale: preset.radiusScale,
          cornerShape: preset.cornerShape,
        };
        saveSettings();
        applyCss();
        renderPanel();
      });
      presetGrid.appendChild(item);
    }
    presetSection.appendChild(presetGrid);
    panelEl.appendChild(presetSection);

    const accentSection = el("div", "cts-section");
    accentSection.appendChild(el("span", "cts-label", "强调色"));
    const accentRow = el("div", "cts-accent-row");
    const accentInput = document.createElement("input");
    accentInput.type = "color";
    accentInput.value = isHexColor(settings.accent) ? settings.accent : "#339cff";
    accentInput.addEventListener("input", () => {
      settings.accent = accentInput.value;
      saveSettings();
      applyCss();
    });
    const accentReset = el("button", "cts-action", "跟随预设");
    accentReset.type = "button";
    accentReset.addEventListener("click", () => {
      settings.accent = PRESETS[settings.preset].accent || "";
      saveSettings();
      applyCss();
      renderPanel();
    });
    accentRow.appendChild(accentInput);
    accentRow.appendChild(accentReset);
    accentSection.appendChild(accentRow);
    accentSection.appendChild(el("div", "cts-hint", "自动适配深浅色，修改立即生效"));
    panelEl.appendChild(accentSection);

    const radiusSection = el("div", "cts-section");
    const radiusLabel = el("span", "cts-label", "");
    const radiusInput = document.createElement("input");
    radiusInput.type = "range";
    radiusInput.min = "0";
    radiusInput.max = "2";
    radiusInput.step = "0.05";
    radiusInput.value = String(typeof settings.radiusScale === "number" ? settings.radiusScale : 1.25);
    const syncRadiusLabel = () => { radiusLabel.textContent = `圆角比例 ${Number(radiusInput.value).toFixed(2)}×（官方 1.25）`; };
    syncRadiusLabel();
    radiusInput.addEventListener("input", () => {
      settings.radiusScale = Number(radiusInput.value);
      syncRadiusLabel();
      saveSettings();
      applyCss();
    });
    radiusSection.appendChild(radiusLabel);
    radiusSection.appendChild(radiusInput);

    const shapeSelect = document.createElement("select");
    for (const [value, label] of [["", "圆角形状：官方"], ["superellipse(1)", "柔和 superellipse(1)"], ["superellipse(1.5)", "官方 superellipse(1.5)"], ["superellipse(2.5)", "挺括 superellipse(2.5)"]]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      shapeSelect.appendChild(option);
    }
    shapeSelect.value = settings.cornerShape;
    shapeSelect.addEventListener("change", () => {
      settings.cornerShape = shapeSelect.value;
      saveSettings();
      applyCss();
    });
    radiusSection.appendChild(shapeSelect);
    panelEl.appendChild(radiusSection);

    const fontSection = el("div", "cts-section");
    fontSection.appendChild(el("span", "cts-label", "UI 字体（留空 = 内置默认）"));
    const uiFontInput = document.createElement("input");
    uiFontInput.type = "text";
    uiFontInput.placeholder = "例如：Maple Mono NF CN";
    uiFontInput.value = settings.uiFont;
    uiFontInput.addEventListener("change", () => {
      settings.uiFont = sanitizeFontName(uiFontInput.value);
      uiFontInput.value = settings.uiFont;
      saveSettings();
      applyCss();
    });
    fontSection.appendChild(uiFontInput);

    fontSection.appendChild(el("span", "cts-label", "代码字体（留空 = 内置默认）"));
    const codeFontInput = document.createElement("input");
    codeFontInput.type = "text";
    codeFontInput.placeholder = "例如：Cascadia Code";
    codeFontInput.value = settings.codeFont;
    codeFontInput.addEventListener("change", () => {
      settings.codeFont = sanitizeFontName(codeFontInput.value);
      codeFontInput.value = settings.codeFont;
      saveSettings();
      applyCss();
    });
    fontSection.appendChild(codeFontInput);

    const sizeRow = el("div", "cts-row");
    const chatSizeInput = document.createElement("input");
    chatSizeInput.type = "number";
    chatSizeInput.min = "10";
    chatSizeInput.max = "24";
    chatSizeInput.placeholder = "正文字号 px";
    chatSizeInput.value = settings.chatFontSize;
    chatSizeInput.addEventListener("change", () => {
      const n = Number(chatSizeInput.value);
      settings.chatFontSize = chatSizeInput.value && n >= 10 && n <= 24 ? `${n}px` : "";
      saveSettings();
      applyCss();
    });
    const codeSizeInput = document.createElement("input");
    codeSizeInput.type = "number";
    codeSizeInput.min = "9";
    codeSizeInput.max = "22";
    codeSizeInput.placeholder = "代码字号 px";
    codeSizeInput.value = settings.codeFontSize;
    codeSizeInput.addEventListener("change", () => {
      const n = Number(codeSizeInput.value);
      settings.codeFontSize = codeSizeInput.value && n >= 9 && n <= 22 ? `${n}px` : "";
      saveSettings();
      applyCss();
    });
    sizeRow.appendChild(chatSizeInput);
    sizeRow.appendChild(codeSizeInput);
    fontSection.appendChild(sizeRow);
    panelEl.appendChild(fontSection);

    const footer = el("div", "cts-footer");
    const resetButton = el("button", "cts-action", "全部重置");
    resetButton.type = "button";
    resetButton.addEventListener("click", () => {
      settings = structuredClone(DEFAULTS);
      saveSettings();
      applyCss();
      renderPanel();
    });
    footer.appendChild(resetButton);
    footer.appendChild(el("span", "cts-version", `v${SCRIPT_VERSION}`));
    panelEl.appendChild(footer);
  }

  // ------------------------------------------------------------------- start

  function start() {
    applyCss();
    ensureGearButton();
    if (!pollTimer) pollTimer = window.setInterval(ensureGearButton, POLL_INTERVAL_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window[API_KEY] = {
    version: SCRIPT_VERSION,
    getSettings: () => structuredClone(settings),
    apply: applyCss,
    openPanel: () => togglePanel(true),
    destroy() {
      if (pollTimer) { window.clearInterval(pollTimer); pollTimer = 0; }
      gearButton?.remove();
      panelEl?.remove();
      styleEl?.remove();
      gearButton = null;
      panelEl = null;
      styleEl = null;
    },
  };
})();

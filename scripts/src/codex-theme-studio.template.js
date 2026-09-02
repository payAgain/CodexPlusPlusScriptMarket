// ==UserScript==
// @name         Codex Theme Studio
// @namespace    codex-plus-plus
// @version      1.4.0
// @description  Codex 桌面端主题美化：内置默认字体、深浅色预设、DreamSkin ZIP 导入管理和 Gallery 格式导出，支持在线主题搜索下载通道探测。
// @match        app://-/*
// @run-at       document-start
// ==/UserScript==

(() => {
  "use strict";

  if (window.top !== window.self) return;

  const SCRIPT_ID = "codex-theme-studio";
  const SCRIPT_VERSION = "1.4.0";
  const API_KEY = "__codexThemeStudio";
  const STYLE_ID = "codex-theme-studio-style";
  const STORAGE_KEY = "__codexThemeStudioSettingsV1";
  const BUTTON_ID = "codex-theme-studio-gear";
  const PANEL_ID = "codex-theme-studio-panel";
  const HEADER_CLUSTER_SELECTOR = ".ms-auto.flex.shrink-0.items-center";
  const POLL_INTERVAL_MS = 1000;
  const DREAMSKIN_API = "https://api.dreamskin.cc";
  const DREAMSKIN_SITE = "https://dreamskin.cc/gallery";
  const DREAMSKIN_DB = "codex-theme-studio-dreamskin";
  const DREAMSKIN_STORE = "themes";
  const DREAMSKIN_PARTS = ["root", "sidebar", "main", "header", "home", "home-hero", "project-list", "thread", "message", "composer", "composer-toolbar", "dialog"];
  const DREAMSKIN_COLORS = ["background", "panel", "panelAlt", "accent", "accentAlt", "secondary", "highlight", "text", "muted", "line"];
  const DREAMSKIN_VARIABLES = [
    "--ds-theme-color-background", "--ds-theme-color-panel", "--ds-theme-color-panel-alt", "--ds-theme-color-accent",
    "--ds-theme-color-accent-alt", "--ds-theme-color-secondary", "--ds-theme-color-highlight", "--ds-theme-color-text",
    "--ds-theme-color-muted", "--ds-theme-color-line", "--ds-theme-font-family", "--ds-theme-font-scale",
    "--ds-theme-surface-opacity", "--ds-theme-surface-blur", "--ds-theme-surface-radius", "--ds-theme-surface-border-alpha",
    "--ds-theme-surface-shadow", "--ds-theme-image-focus-x", "--ds-theme-image-focus-y", "--ds-theme-image-zoom",
    "--ds-theme-image-dim", "--ds-theme-image-task-intensity", "--ds-theme-density-scale", "--ds-theme-motion-level",
  ];
  const DREAMSKIN_PROPERTIES = new Set(["backdrop-filter", "background-color", "border-bottom-color", "border-bottom-left-radius", "border-bottom-right-radius", "border-bottom-style", "border-bottom-width", "border-color", "border-left-color", "border-left-style", "border-left-width", "border-radius", "border-right-color", "border-right-style", "border-right-width", "border-style", "border-top-color", "border-top-left-radius", "border-top-right-radius", "border-top-style", "border-top-width", "border-width", "box-shadow", "color", "column-gap", "font-family", "font-size", "font-weight", "gap", "letter-spacing", "line-height", "opacity", "row-gap", "transition-duration", "transition-property"]);
  const DREAMSKIN_BACKGROUND = new Map([["background.webp", "image/webp"], ["background.jpg", "image/jpeg"], ["background.png", "image/png"]]);

  const previous = window[API_KEY];
  if (previous && typeof previous.destroy === "function") previous.destroy();

  // ---------------------------------------------------------------- settings

  const DEFAULTS = {
    version: 1,
    preset: "official",
    accent: "",
    radiusScale: null,
    cornerShape: "",
    dreamskinId: "",
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
    }, lightTokens: {
      "--color-background-surface": "#f8f8f6",
      "--color-background-surface-under": "#f4f2ec",
      "--color-background-primary-soft": "rgba(255, 255, 255, 0.96)",
      "--color-background-elevated-primary": "rgba(255, 255, 255, 0.97)",
      "--color-background-elevated-primary-opaque": "#ffffff",
      "--color-background-elevated-secondary": "rgba(255, 255, 255, 0.96)",
      "--color-background-elevated-secondary-opaque": "#ffffff",
      "--color-background-application-menu": "#f4f2ec",
      "--color-codex-application-menu": "#f4f2ec",
      "--color-background-control-opaque": "#ffffff",
      "--color-background-editor-opaque": "#f8f8f6",
      "--color-background-mode-toggle-selected": "#e9e5da",
      "--color-background-user-message": "color-mix(in oklab, #bf5d3a 9%, transparent)",
      "--color-surface": "#f8f8f6",
      "--color-surface-secondary": "#f4f2ec",
      "--color-surface-tertiary": "#e6e4de",
      "--color-surface-elevated-secondary": "#ffffff",
      "--color-token-bg-primary": "#f8f8f6",
      "--color-token-main-surface-primary": "#f8f8f6",
      "--codex-base-surface": "#f8f8f6",
      "--wb-surface-primary": "#f8f8f6",
      "--wb-surface-secondary": "#f4f2ec",
      "--color-background-composer-primary": "#bf5d3a",
      "--color-text-composer-primary": "#ffffff",
      "--color-text-on-accent": "#ffffff",
      "--codex-base-accent": "#bf5d3a",
      "--color-background-primary-ghost-hover": "rgba(61, 57, 41, 0.06)",
      "--color-background-primary-solid": "#bf5d3a",
      "--color-text-primary-solid": "#ffffff",
      "--color-foreground-application-menu": "#1f1d18",
      "--color-codex-application-menu-selection": "rgba(61, 57, 41, 0.06)",
      "--color-border-application-menu-separator": "rgba(61, 57, 41, 0.14)",
      "--color-border": "rgba(61, 57, 41, 0.12)",
      "--color-border-light": "rgba(61, 57, 41, 0.07)",
      "--color-border-subtle": "rgba(61, 57, 41, 0.07)",
      "--color-border-heavy": "rgba(61, 57, 41, 0.18)",
      "--color-border-strong": "rgba(61, 57, 41, 0.18)",
      "--color-border-primary-outline": "rgba(61, 57, 41, 0.18)",
      "--elevation-sidebar": "1px 0 0 rgba(61, 57, 41, 0.08)",
      "--elevation-composer": "inset 0 0 0 1px rgba(61, 57, 41, 0.10), 0 18px 50px rgba(61, 57, 41, 0.10)",
      "--color-text": "#1f1d18",
      "--color-text-emphasis": "#1f1d18",
      "--color-text-foreground": "#1f1d18",
      "--color-text-secondary": "color-mix(in srgb, #1f1d18 68%, transparent)",
      "--color-text-foreground-secondary": "rgba(31, 29, 24, 0.68)",
      "--color-text-tertiary": "rgba(31, 29, 24, 0.52)",
      "--color-text-foreground-tertiary": "rgba(31, 29, 24, 0.52)",
      "--color-text-disabled": "rgba(31, 29, 24, 0.42)",
      "--color-text-inverse": "#f8f8f6",
      "--color-icon-primary": "rgba(31, 29, 24, 0.90)",
      "--color-icon-secondary": "rgba(31, 29, 24, 0.68)",
      "--color-icon-tertiary": "rgba(31, 29, 24, 0.52)",
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
  const DREAMSKIN_EXPORT_PALETTES = {
    official: {
      dark: { background: "#181818", panel: "#282828", panelAlt: "#2d2d2d", accent: "#ffffff", accentAlt: "#d9d9d9", secondary: "#808080", highlight: "#f2f2f2", text: "#ffffff", muted: "rgba(255,255,255,.498)", line: "rgba(255,255,255,.157)" },
      light: { background: "#ffffff", panel: "#fbfbfb", panelAlt: "rgba(255,255,255,.865)", accent: "#1a1c1f", accentAlt: "rgba(26,28,31,.7)", secondary: "rgba(26,28,31,.65)", highlight: "#339cff", text: "#1a1c1f", muted: "rgba(26,28,31,.495)", line: "rgba(26,28,31,.118)" }
    },
    claude: {
      dark: { background: "#121212", panel: "#191917", panelAlt: "#242421", accent: "#d97757", accentAlt: "#e0a18b", secondary: "#bc8c75", highlight: "#e0a18b", text: "#f5f2e8", muted: "rgba(245,242,232,.70)", line: "rgba(245,242,232,.10)" },
      light: { background: "#f8f8f6", panel: "#f4f2ec", panelAlt: "#e6e4de", accent: "#bf5d3a", accentAlt: "#d98a68", secondary: "#8a7d5a", highlight: "#e0a18b", text: "#1f1d18", muted: "rgba(31,29,24,.68)", line: "rgba(61,57,41,.12)" }
    },
    ink: {
      dark: { background: "#0f141c", panel: "#141c28", panelAlt: "#1b2534", accent: "#4da3ff", accentAlt: "#7fb2ff", secondary: "#3c5a7d", highlight: "#94c6ff", text: "#dbe6f5", muted: "rgba(219,230,245,.70)", line: "rgba(148,184,255,.10)" }
    },
    obsidian: {
      dark: { background: "#000000", panel: "#0d0d0d", panelAlt: "#141414", accent: "#8b9dff", accentAlt: "#b3baff", secondary: "#555a80", highlight: "#c2caff", text: "#e8e8e8", muted: "rgba(232,232,232,.70)", line: "rgba(255,255,255,.09)" }
    },
    tea: {
      dark: { background: "#0e1512", panel: "#121a16", panelAlt: "#17231e", accent: "#3ecf8e", accentAlt: "#7ee0ae", secondary: "#2b6a4e", highlight: "#8ef0c0", text: "#d9e8df", muted: "rgba(217,232,223,.70)", line: "rgba(160,220,190,.10)" }
    }
  };

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
    if (typeof next.cornerShape !== "string") next.cornerShape = "";
    if (typeof next.dreamskinId !== "string") next.dreamskinId = "";
    delete next.uiFont;
    delete next.codeFont;
    delete next.chatFontSize;
    delete next.codeFontSize;
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


  function isHexColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value);
  }

  function accentTokens(accent, mode = "dark") {
    const solid = mode === "light"
      ? `color-mix(in srgb, ${accent} 88%, #411608)`
      : accent;
    const text = mode === "light"
      ? `color-mix(in srgb, ${accent} 88%, #411608)`
      : `color-mix(in srgb, ${accent} 72%, white)`;
    return {
      "--color-accent-blue": solid,
      "--color-background-info-solid": solid,
      "--color-background-info-soft": `color-mix(in srgb, ${solid} 18%, transparent)`,
      "--color-background-info-surface": `color-mix(in oklab, ${solid} ${mode === "light" ? "10%" : "22%"}, ${mode === "light" ? "#fff" : "#000"})`,
      "--color-background-accent": `color-mix(in oklab, ${solid} ${mode === "light" ? "12%" : "26%"}, ${mode === "light" ? "#fff" : "#000"})`,
      "--color-background-accent-hover": `color-mix(in oklab, ${solid} ${mode === "light" ? "16%" : "30%"}, ${mode === "light" ? "#fff" : "#000"})`,
      "--color-background-accent-active": `color-mix(in oklab, ${solid} ${mode === "light" ? "20%" : "34%"}, ${mode === "light" ? "#fff" : "#000"})`,
      "--color-background-tip-badge": `color-mix(in srgb, ${solid} ${mode === "light" ? "10%" : "16%"}, transparent)`,
      "--color-background-tip-soft": `color-mix(in srgb, ${solid} ${mode === "light" ? "10%" : "16%"}, transparent)`,
      "--color-background-text-selection": `color-mix(in srgb, ${solid} 30%, transparent)`,
      "--color-background-attribution-highlight": `color-mix(in srgb, ${solid} 30%, transparent)`,
      "--color-border-focus": `color-mix(in srgb, ${solid} ${mode === "light" ? "58%" : "76%"}, transparent)`,
      "--color-text-accent": text,
      "--color-text-info": text,
      "--color-text-info-soft": text,
      "--color-text-tip": text,
      "--color-text-tip-badge": text,
      "--color-icon-accent": text,
    };
  }

  function buildGlobalOverrides() {
    const lines = [];
    const emit = (name, value) => { if (value) lines.push(`  ${name}: ${value} !important;`); };
    if (typeof settings.radiusScale === "number") emit("--codex-corner-radius-scale", String(settings.radiusScale));
    if (settings.cornerShape) emit("--codex-corner-shape", settings.cornerShape);
    emit("--font-sans", SANS_FALLBACK);
    emit("--font-sans-default", SANS_FALLBACK);
    emit("--font-openai-sans", SANS_FALLBACK);
    emit("--default-font-family", SANS_FALLBACK);
    emit("--font-serif", SANS_FALLBACK);
    emit("--font-mono", MONO_FALLBACK);
    emit("--font-mono-default", MONO_FALLBACK);
    emit("--default-mono-font-family", MONO_FALLBACK);
    return lines.length ? `:root {\n${lines.join("\n")}\n}` : "";
  }

  function buildPresetOverrides(mode) {
    const preset = PRESETS[settings.preset];
    const tokens = mode === "dark" ? preset?.tokens : preset?.lightTokens;
    if (!tokens) return "";
    const accent = isHexColor(settings.accent) ? settings.accent : "";
    const lines = Object.entries(tokens).map(([name, value]) => `  ${name}: ${value} !important;`);
    const effectiveAccent = accent || preset.accent;
    if (effectiveAccent && isHexColor(effectiveAccent)) {
      for (const [name, value] of Object.entries(accentTokens(effectiveAccent, mode))) lines.push(`  ${name}: ${value} !important;`);
    }
    return `html.electron-${mode} {\n${lines.join("\n")}\n}`;
  }

  function buildDarkOverrides() { return buildPresetOverrides("dark"); }
  function buildLightOverrides() { return buildPresetOverrides("light"); }

  // --------------------------------------------------------------- app skin
  function buildClaudeOverrides() {
    if (settings.preset !== "claude") return "";
    return `
      html[data-theme-studio="claude"] body { color: var(--color-text) !important; }

      html[data-theme-studio="claude"].electron-dark body { background: #121212 !important; }
      html[data-theme-studio="claude"].electron-light body { background: #f8f8f6 !important; }

      html[data-theme-studio="claude"] #root,
      html[data-theme-studio="claude"] main,
      html[data-theme-studio="claude"] [class*="_ApplicationMenuTopBar_"] {
        background: var(--color-background-surface) !important;
        background-color: var(--color-background-surface) !important;
      }

      html[data-theme-studio="claude"] main {
        border-left-color: var(--color-border-light) !important;
      }

      html[data-theme-studio="claude"] aside.app-shell-left-panel {
        background: var(--color-background-application-menu) !important;
        background-color: var(--color-background-application-menu) !important;
        box-shadow: 1px 0 0 var(--color-border-light) !important;
      }

      html[data-theme-studio="claude"] aside nav[class*="_Navigation_"] {
        --color-text: var(--color-text-emphasis) !important;
      }

      html[data-theme-studio="claude"] #app-shell-sidebar,
      html[data-theme-studio="claude"] aside .vertical-scroll-fade-mask {
        background: transparent !important;
        background-color: transparent !important;
      }

      html[data-theme-studio="claude"] aside .sidebar-item {
        border-radius: 8px !important;
        color: var(--color-icon-secondary) !important;
      }

      html[data-theme-studio="claude"] aside .sidebar-item:hover,
      html[data-theme-studio="claude"] aside .sidebar-item[data-active="true"] {
        background: var(--color-background-primary-ghost-hover) !important;
        background-color: var(--color-background-primary-ghost-hover) !important;
        color: var(--color-text) !important;
      }

      html[data-theme-studio="claude"] main :is(h1, h2, h3) {
        color: var(--color-text-emphasis) !important;
        font-family: var(--font-serif, Georgia, "Times New Roman", serif) !important;
        font-weight: 600 !important;
      }

      html[data-theme-studio="claude"] [class*="_ComposerLayoutRoot_"] {
        background: var(--color-background-elevated-primary) !important;
        background-color: var(--color-background-elevated-primary) !important;
        border-radius: 22px !important;
        box-shadow: var(--elevation-composer) !important;
      }

      html[data-theme-studio="claude"] button.bg-composer-primary {
        background: var(--color-background-composer-primary) !important;
        background-color: var(--color-background-composer-primary) !important;
        color: var(--color-text-composer-primary) !important;
      }

      html[data-theme-studio="claude"].electron-dark button.bg-composer-primary:hover:not(:disabled) {
        background: #e0a18b !important;
        background-color: #e0a18b !important;
      }

      html[data-theme-studio="claude"].electron-light button.bg-composer-primary:hover:not(:disabled) {
        background: #a84f2f !important;
        background-color: #a84f2f !important;
      }

      html[data-theme-studio="claude"] ::selection {
        background: var(--color-background-text-selection) !important;
        background-color: var(--color-background-text-selection) !important;
      }

      html[data-theme-studio="claude"] ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }

      html[data-theme-studio="claude"] ::-webkit-scrollbar-thumb {
        border: 3px solid transparent;
        border-radius: 999px;
        background: var(--color-border-heavy) content-box;
        background-color: var(--color-border-heavy) content-box;
      }
    `;
  }



  // -------------------------------------------------------------- DreamSkin
  let dreamskinActive = null;
  let dreamskinParts = new Set();
  let dreamskinObserver = null;
  let dreamskinObjectUrl = "";
  let dreamskinOnline = { state: "idle", items: [], query: "", error: "" };

  function openDreamSkinDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("当前环境不支持 IndexedDB"));
      const request = window.indexedDB.open(DREAMSKIN_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DREAMSKIN_STORE)) db.createObjectStore(DREAMSKIN_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB 打开失败"));
    });
  }

  async function dreamSkinStore(action, value) {
    const db = await openDreamSkinDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DREAMSKIN_STORE, action === "list" || action === "get" ? "readonly" : "readwrite");
      const store = tx.objectStore(DREAMSKIN_STORE);
      let request;
      if (action === "list") request = store.getAll();
      else if (action === "get") request = store.get(value);
      else if (action === "put") request = store.put(value);
      else if (action === "delete") request = store.delete(value);
      else if (action === "clear") request = store.clear();
      else request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("主题库操作失败"));
      tx.oncomplete = () => db.close();
    });
  }

  async function sha256Hex(bytes) {
    if (!window.crypto?.subtle) throw new Error("当前环境无法计算 SHA-256");
    return [...new Uint8Array(await window.crypto.subtle.digest("SHA-256", bytes))].map(n => n.toString(16).padStart(2, "0")).join("");
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream !== "function") throw new Error("当前环境不支持 ZIP deflate");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function readZip(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i -= 1) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("无效 ZIP：找不到中央目录");
    const count = view.getUint16(eocd + 10, true);
    let offset = view.getUint32(eocd + 16, true);
    const entries = new Map();
    const decoder = new TextDecoder();
    for (let index = 0; index < count; index += 1) {
      if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) throw new Error("无效 ZIP：中央目录损坏");
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
      if (name.includes("\\") || name.includes("..") || name.startsWith("/")) throw new Error(`ZIP 包含不安全路径：${name}`);
      if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error(`ZIP 本地头损坏：${name}`);
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const raw = bytes.subarray(start, start + compressedSize);
      entries.set(name, { method, raw });
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }

  async function unzipTheme(file) {
    if (file.size > 32 * 1024 * 1024) throw new Error("主题 ZIP 超过 32 MiB");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const entries = readZip(bytes);
    if (entries.size > 32) throw new Error("主题 ZIP 文件数超过 32");
    const output = new Map();
    for (const [name, entry] of entries) {
      if (name.endsWith("/")) continue;
      if (entry.method === 0) output.set(name, entry.raw);
      else if (entry.method === 8) output.set(name, await inflateRaw(entry.raw));
      else throw new Error(`不支持的 ZIP 压缩方式：${name}`);
    }
    return output;
  }

  function isCssColor(value) {
    return /^(#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?|#[0-9a-fA-F]{3,4}|rgba?\(\s*[0-9]{1,3}\s*,\s*[0-9]{1,3}\s*,\s*[0-9]{1,3}\s*(?:,\s*(?:0|1|1\.0|0?\.[0-9]{1,6})\s*)?\))$/.test(String(value || "").trim());
  }

  function validateDreamSkinTheme(theme) {
    if (!theme || typeof theme !== "object" || Array.isArray(theme)) throw new Error("theme.json 必须是对象");
    if (theme.schemaVersion !== 1) throw new Error("theme.json.schemaVersion 必须是 1");
    if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(theme.id) || theme.id.length < 3 || theme.id.length > 64) throw new Error("theme.json.id 无效");
    if (typeof theme.name !== "string" || !theme.name || theme.name.length > 80) throw new Error("theme.json.name 无效");
    if (!DREAMSKIN_BACKGROUND.has(theme.image)) throw new Error("theme.json.image 不是受支持的背景文件");
    if (theme.appearance !== undefined && !["auto", "light", "dark"].includes(theme.appearance)) throw new Error("theme.json.appearance 无效");
    if (!theme.colors || typeof theme.colors !== "object") throw new Error("theme.json.colors 缺失");
    for (const key of DREAMSKIN_COLORS) {
      if (!isCssColor(theme.colors[key])) throw new Error(`theme.json.colors.${key} 不是有效颜色`);
    }
    return theme;
  }

  function validateDreamSkinCss(source) {
    const text = String(source || "");
    const bytes = new TextEncoder().encode(text);
    if (!text.trim()) throw new Error("theme.css 不能为空");
    if (bytes.length > 262144) throw new Error("theme.css 超过 256 KiB");
    if (/\\|[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/.test(text) || text.includes("/*") || text.includes("*/")) throw new Error("theme.css 包含禁止的转义/注释/控制字符");
    if (/[@!]|url\s*\(|image-set\s*\(/i.test(text)) throw new Error("theme.css 包含禁止的 at-rule、url 或 !important");
    if (/position\s*:|display\s*:|transform\s*:|animation/i.test(text)) throw new Error("theme.css 包含布局/动画类禁止属性");
    const variablePattern = new RegExp(`var\\s*\\((?:${DREAMSKIN_VARIABLES.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\)`, "i");
    let index = 0;
    let rules = 0, declarations = 0;
    while (index < text.length) {
      if (!text.slice(index).trim()) break;
      const open = text.indexOf("{", index);
      const close = text.indexOf("}", open + 1);
      if (open < 0 || close < 0) throw new Error("theme.css 规则结构不完整");
      const selector = text.slice(index, open).trim();
      const body = text.slice(open + 1, close);
      for (const part of selector.split(",")) {
        const value = part.trim();
        if (!/^\[data-ds-part="(?:root|sidebar|main|header|home|home-hero|project-list|thread|message|composer|composer-toolbar|dialog)"\](?::hover|:focus-visible)?$/.test(value)) throw new Error(`theme.css 选择器不在 Skin API 白名单：${value}`);
      }
      for (const declaration of body.split(";")) {
        if (!declaration.trim()) continue;
        const colon = declaration.indexOf(":");
        if (colon < 1) throw new Error("theme.css 声明缺少属性或值");
        const property = declaration.slice(0, colon).trim().toLowerCase();
        const value = declaration.slice(colon + 1).trim();
        if (!DREAMSKIN_PROPERTIES.has(property)) throw new Error(`theme.css 属性不在白名单：${property}`);
        if (value.length > 512) throw new Error("theme.css 属性值超过 512 字符");
        if (/var\s*\(/i.test(value) && !variablePattern.test(value)) throw new Error(`theme.css 使用未注册变量：${value}`);
        declarations += 1;
      }
      rules += 1; index = close + 1;
    }
    if (rules > 128 || declarations > 512) throw new Error("theme.css 规则或声明数量超限");
  }

  async function importDreamSkinPackage(file) {
    const packageBytes = new Uint8Array(await file.arrayBuffer());
    const files = await unzipTheme(new Blob([packageBytes]));
    const hasManifest = files.has("manifest.json");
    if (!files.has("theme.json") || !files.has("theme.css")) throw new Error("主题包缺少 theme.json 或 theme.css");
    const backgrounds = [...DREAMSKIN_BACKGROUND.keys()].filter(name => files.has(name));
    if (backgrounds.length !== 1) throw new Error("主题包必须恰好包含一个背景图");
    const themeBytes = files.get("theme.json");
    const cssBytes = files.get("theme.css");
    const backgroundPath = backgrounds[0];
    const backgroundBytes = files.get(backgroundPath);
    if (backgroundBytes.byteLength > 10 * 1024 * 1024) throw new Error("背景图超过 10 MiB");
    const theme = validateDreamSkinTheme(JSON.parse(new TextDecoder().decode(themeBytes)));
    if (theme.image !== backgroundPath) throw new Error("theme.json.image 与背景文件不一致");
    validateDreamSkinCss(new TextDecoder().decode(cssBytes));
    const packageHash = await sha256Hex(packageBytes);
    let manifest = null;
    if (hasManifest) {
      manifest = JSON.parse(new TextDecoder().decode(files.get("manifest.json")));
      if (manifest.packageVersion !== 1 || manifest.skinApiVersion !== 1) throw new Error("manifest 协议版本不受支持");
      if (manifest.themeId !== theme.id) throw new Error("manifest.themeId 与 theme.json.id 不一致");
      for (const entry of manifest.files || []) {
        if (!files.has(entry.path)) throw new Error(`manifest 文件缺失：${entry.path}`);
        const actual = await sha256Hex(files.get(entry.path));
        if (actual !== entry.sha256) throw new Error(`SHA-256 不匹配：${entry.path}`);
      }
    }
    const record = {
      id: manifest?.id || theme.id,
      themeId: theme.id,
      name: theme.name,
      version: manifest?.version || "local",
      author: manifest?.publisher?.displayName || "本地导入",
      license: manifest?.license || "未声明",
      appearance: theme.appearance || "auto",
      packageBytes: file.size,
      packageSha256: packageHash,
      installedAt: new Date().toISOString(),
      theme, safeCss: new TextDecoder().decode(cssBytes), background: new Blob([backgroundBytes], { type: DREAMSKIN_BACKGROUND.get(backgroundPath) }), backgroundPath
    };
    await dreamSkinStore("put", record);
    return record;
  }

  function colorRgb(value) {
    const text = String(value || "").trim();
    if (text.startsWith("#")) {
      const hex = text.slice(1);
      const full = hex.length === 3 ? hex.split("").map(n => n + n).join("") : hex.slice(0, 6);
      return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
    }
    const match = text.match(/rgba?\(([^)]+)\)/i);
      if (!match) return [0, 0, 0];
      return match[1].split(",").slice(0, 3).map(n => Number(n.trim()));
  }

  function readableInk(foreground, background) {
    const lum = rgb => rgb.slice(0, 3).map(n => { const v = n / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    const l1 = lum(colorRgb(foreground)), l2 = lum(colorRgb(background));
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) >= 3 ? "#ffffff" : "#121212";
  }

  function dreamSkinCodexTokens(colors) {
    const ink = readableInk(colors.accent, colors.panel);
    return {
      "--color-background-surface": colors.background,
      "--color-background-surface-under": colors.panel,
      "--color-background-application-menu": colors.panel,
      "--color-codex-application-menu": colors.panel,
      "--color-background-elevated-primary": colors.panelAlt,
      "--color-background-elevated-primary-opaque": colors.panelAlt,
      "--color-background-elevated-secondary": colors.panel,
      "--color-background-control-opaque": colors.panelAlt,
      "--color-background-editor-opaque": colors.background,
      "--color-surface": colors.background,
      "--color-surface-secondary": colors.panel,
      "--color-surface-tertiary": colors.panelAlt,
      "--codex-base-surface": colors.background,
      "--wb-surface-primary": colors.background,
      "--wb-surface-secondary": colors.panel,
      "--codex-base-accent": colors.accent,
      "--color-accent-blue": colors.accent,
      "--color-background-composer-primary": colors.accent,
      "--color-text-composer-primary": ink,
      "--color-text-on-accent": ink,
      "--color-background-primary-solid": colors.accent,
      "--color-text-primary-solid": ink,
      "--color-background-primary-ghost-hover": colors.line,
      "--color-text": colors.text,
      "--color-text-emphasis": colors.text,
      "--color-text-foreground": colors.text,
      "--color-text-secondary": colors.muted,
      "--color-text-foreground-secondary": colors.muted,
      "--color-text-tertiary": colors.muted,
      "--color-text-foreground-tertiary": colors.muted,
      "--color-text-disabled": colors.muted,
      "--color-text-inverse": colors.background,
      "--color-icon-primary": colors.text,
      "--color-icon-secondary": colors.muted,
      "--color-icon-tertiary": colors.muted,
      "--color-border": colors.line,
      "--color-border-light": colors.line,
      "--color-border-subtle": colors.line,
      "--color-border-heavy": colors.line,
      "--color-border-strong": colors.line,
      "--color-border-primary-outline": colors.line,
    };
  }

  function refreshDreamSkinParts() {
    if (!dreamskinActive) return;
    const desired = new Set();
    const add = (part, nodes) => { for (const node of nodes || []) if (node?.style) desired.add([node, part]); };
    add("root", [document.documentElement]);
    add("sidebar", [document.querySelector("aside.app-shell-left-panel")]);
    add("header", [document.querySelector('header:is(.app-header-tint, [data-app-shell-header-edge-scroll], [class*="_Header_"])')]);
    add("home", [document.querySelector("[role=main]")]);
    add("main", [document.querySelector('main:is(.main-surface, [data-app-shell-main-surface], [class*="_MainContentSurface_"])')]);
    add("project-list", [document.querySelector(".group\\/project-selector")]);
    add("thread", [document.querySelector(".thread-scroll-container")]);
    const homeIcon = document.querySelector('[data-testid="home-icon"]');
    add("home-hero", [homeIcon?.parentElement]);
    const composer = document.querySelector('[class*="_ComposerLayoutRoot_"]');
    add("composer", [composer]);
    add("composer-toolbar", [composer?.querySelector('[class*="_ComposerLayoutFooter_"]')]);
    add("dialog", [...document.querySelectorAll("[role=dialog]")]);
    const messages = document.querySelectorAll('[data-message-author-role], [data-local-conversation-user-anchor], [data-local-conversation-final-assistant]');
    add("message", messages);
    for (const node of dreamskinParts) if (![...desired].some(([next]) => next === node)) node.removeAttribute("data-ds-part");
    dreamskinParts = new Set([...desired].map(([node]) => node));
    for (const [node, part] of desired) node.setAttribute("data-ds-part", part);
  }

  function ensureDreamSkinObserver() {
    if (dreamskinObserver || !dreamskinActive) return;
    dreamskinObserver = new MutationObserver(() => refreshDreamSkinParts());
    dreamskinObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  async function clearDreamSkin() {
    dreamskinActive = null;
    dreamskinObserver?.disconnect(); dreamskinObserver = null;
    for (const node of dreamskinParts) node.removeAttribute("data-ds-part");
    dreamskinParts = new Set();
    for (const name of DREAMSKIN_VARIABLES) document.documentElement.style.removeProperty(name);
    for (const node of document.querySelectorAll("[data-ds-part]")) node.removeAttribute("data-ds-part");
    document.getElementById("codex-theme-studio-dreamskin")?.remove();
    document.getElementById("codex-theme-studio-dreamskin-css")?.remove();
    if (dreamskinObjectUrl) { URL.revokeObjectURL(dreamskinObjectUrl); dreamskinObjectUrl = ""; }
    settings.dreamskinId = ""; saveSettings(); applyCss(); renderPanel();
  }

  async function applyDreamSkin(record) {
    if (!record) return;
    dreamskinActive = record; settings.dreamskinId = record.id; saveSettings(); applyCss();
    const root = document.documentElement;
    for (const name of DREAMSKIN_VARIABLES) root.style.removeProperty(name);
    for (const [key, value] of Object.entries(record.theme.colors)) root.style.setProperty(`--ds-theme-color-${key.replace(/[A-Z]/g, n => "-" + n.toLowerCase())}`, value);
    root.style.setProperty("--ds-theme-font-family", BODY_FONT_FAMILY);
    root.style.setProperty("--ds-theme-font-scale", "1");
    root.style.setProperty("--ds-theme-surface-opacity", "1");
    root.style.setProperty("--ds-theme-surface-blur", "0px");
    root.style.setProperty("--ds-theme-surface-radius", "12px");
    root.style.setProperty("--ds-theme-surface-border-alpha", "0.16");
    root.style.setProperty("--ds-theme-surface-shadow", "soft");
    root.style.setProperty("--ds-theme-image-focus-x", String(record.theme.art?.focusX ?? 0.5));
    root.style.setProperty("--ds-theme-image-focus-y", String(record.theme.art?.focusY ?? 0.5));
    root.style.setProperty("--ds-theme-image-zoom", "1");
    root.style.setProperty("--ds-theme-image-dim", "0");
    root.style.setProperty("--ds-theme-image-task-intensity", String(record.theme.art?.taskMode === "off" ? 0 : 0.35));
    for (const [name, value] of Object.entries(dreamSkinCodexTokens(record.theme.colors))) root.style.setProperty(name, value);
    document.documentElement.dataset.themeStudio = "dreamskin";
    if (dreamskinObjectUrl) URL.revokeObjectURL(dreamskinObjectUrl);
    dreamskinObjectUrl = URL.createObjectURL(record.background);
    let style = document.getElementById("codex-theme-studio-dreamskin");
    if (!style) { style = document.createElement("style"); style.id = "codex-theme-studio-dreamskin"; document.head.appendChild(style); }
    style.textContent = `
      html[data-theme-studio="dreamskin"] body { background: ${record.theme.colors.background} !important; color: ${record.theme.colors.text} !important; }
      html[data-theme-studio="dreamskin"] [data-ds-part="sidebar"] { background: color-mix(in srgb, ${record.theme.colors.panel} 88%, transparent) !important; }
      html[data-theme-studio="dreamskin"] [data-ds-part="main"] { background-image: linear-gradient(color-mix(in srgb, ${record.theme.colors.background} 72%, transparent), color-mix(in srgb, ${record.theme.colors.background} 86%, transparent)), url('${dreamskinObjectUrl}') !important; background-position: center, ${((record.theme.art?.focusX ?? 0.5) * 100).toFixed(1)}% ${((record.theme.art?.focusY ?? 0.5) * 100).toFixed(1)}% !important; background-size: 100% 100%, cover !important; }
      html[data-theme-studio="dreamskin"] [data-ds-part="composer"] { background: color-mix(in srgb, ${record.theme.colors.panelAlt} 92%, transparent) !important; }
    `;
    let css = document.getElementById("codex-theme-studio-dreamskin-css");
    if (!css) { css = document.createElement("style"); css.id = "codex-theme-studio-dreamskin-css"; document.head.appendChild(css); }
    css.textContent = record.safeCss;
    refreshDreamSkinParts(); ensureDreamSkinObserver(); renderPanel();
  }

  async function restoreDreamSkin() {
    if (!settings.dreamskinId) return;
    try { const record = await dreamSkinStore("get", settings.dreamskinId); if (record) await applyDreamSkin(record); } catch { settings.dreamskinId = ""; saveSettings(); }
  }

  async function fetchRemoteJson(url) {
    try {
      const response = await window.fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (directError) {
      const bridge = window.electronBridge;
      if (!bridge || typeof bridge.sendMessageFromView !== "function") throw new Error(`Codex 渲染进程被 CSP 拦截，且无可用网络桥接：${directError.message}`);
      const requestId = `cts-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await new Promise((resolve, reject) => {
        const onMessage = event => { const data = event.data; if (data?.type === "fetch-response" && data.requestId === requestId) { window.removeEventListener("message", onMessage); resolve(data); } };
        window.addEventListener("message", onMessage);
        window.setTimeout(() => { window.removeEventListener("message", onMessage); reject(new Error("Codex++ 网络桥接超时")); }, 10000);
        bridge.sendMessageFromView({ type: "fetch", requestId, method: "GET", url });
      });
      if (Number(response.status || 0) < 200 || Number(response.status || 0) >= 300) throw new Error(`桥接请求失败：HTTP ${response.status}`);
      return JSON.parse(response.bodyJsonString || "{}");
    }
  }

  async function searchDreamSkinGallery(query = "") {
    dreamskinOnline = { ...dreamskinOnline, state: "loading", query };
    try {
      const params = new URLSearchParams({ limit: "12", offset: "0", sort: "popular" });
      if (query.trim()) params.set("q", query.trim());
      const data = await fetchRemoteJson(`${DREAMSKIN_API}/v1/themes?${params}`);
      dreamskinOnline = { state: "ready", items: data.items || [], query, error: "" };
    } catch (error) {
      dreamskinOnline = { state: "failed", items: [], query, error: error.message || "搜索失败" };
    }
    renderPanel();
  }

  async function downloadDreamSkin(item) {
    const url = `${DREAMSKIN_API}/v1/themes/${encodeURIComponent(item.id)}/download`;
    try {
      const response = await window.fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const record = await importDreamSkinPackage(blob);
      await applyDreamSkin(record); return record;
    } catch (error) {
      throw new Error(`在线下载失败：${error.message}`);
    }
  }

  function crc32(bytes) {
    let crc = -1;
    for (let index = 0; index < bytes.length; index += 1) {
      crc ^= bytes[index];
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (~crc) >>> 0;
  }

  function zipStore(files) {
    const chunks = [], central = [];
    let offset = 0; const encoder = new TextEncoder();
    for (const [name, content] of files) {
      const data = typeof content === "string" ? encoder.encode(content) : content;
      const nameBytes = encoder.encode(name), checksum = crc32(data);
      const local = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true); localView.setUint16(4, 20, true); localView.setUint16(8, 0, true);
      localView.setUint32(14, checksum, true); localView.setUint32(18, data.length, true); localView.setUint32(22, data.length, true);
      localView.setUint16(26, nameBytes.length, true); local.set(nameBytes, 30);
      chunks.push(local, data);
      const centralEntry = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralEntry.buffer);
      centralView.setUint32(0, 0x02014b50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true);
      centralView.setUint16(10, 0, true); centralView.setUint32(16, checksum, true); centralView.setUint32(20, data.length, true); centralView.setUint32(24, data.length, true);
      centralView.setUint16(28, nameBytes.length, true); centralView.setUint32(42, offset, true); centralEntry.set(nameBytes, 46);
      central.push(centralEntry); offset += local.length + data.length;
    }
    const centralSize = central.reduce((sum, item) => sum + item.length, 0);
    const eocd = new Uint8Array(22); const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); eocdView.setUint16(8, files.size, true); eocdView.setUint16(10, files.size, true);
    eocdView.setUint32(12, centralSize, true); eocdView.setUint32(16, offset, true);
    return new Blob([...chunks, ...central, eocd], { type: "application/zip" });
  }

  function canvasToPng(colors) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas"); canvas.width = 1920; canvas.height = 1080;
      const context = canvas.getContext("2d"); const background = colorRgb(colors.background), accent = colorRgb(colors.accent);
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, colors.background); gradient.addColorStop(1, colors.panelAlt);
      context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height);
      const glow = context.createRadialGradient(canvas.width * 0.72, canvas.height * 0.45, 0, canvas.width * 0.72, canvas.height * 0.45, 680);
      glow.addColorStop(0, `rgba(${accent.join(",")},0.32)`); glow.addColorStop(1, `rgba(${accent.join(",")},0)`);
      context.fillStyle = glow; context.fillRect(0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("无法生成背景图")), "image/jpeg", 0.82);
    });
  }

  async function exportPresetToDreamSkin(presetId, appearance = "dark") {
    const preset = PRESETS[presetId];
    if (!preset) throw new Error("预设不存在");
    const palettes = DREAMSKIN_EXPORT_PALETTES[presetId];
    let colors = palettes?.[appearance] || palettes?.[appearance === "light" ? "dark" : "light"];
    if (!colors) {
      const light = appearance === "light";
      colors = light ? {background:"#ffffff",panel:"#fbfbfb",panelAlt:"rgba(255,255,255,.865)",accent:"#1a1c1f",accentAlt:"rgba(26,28,31,.7)",secondary:"rgba(26,28,31,.65)",highlight:"#339cff",text:"#1a1c1f",muted:"rgba(26,28,31,.495)",line:"rgba(26,28,31,.118)"} : {background:"#181818",panel:"#282828",panelAlt:"#2d2d2d",accent:"#ffffff",accentAlt:"#d9d9d9",secondary:"#808080",highlight:"#f2f2f2",text:"#ffffff",muted:"rgba(255,255,255,.498)",line:"rgba(255,255,255,.157)"};
    }
    const safeId = presetId === "official" ? "codex-official" : presetId;
    const theme = {
      schemaVersion: 1, id: `codex-theme-studio.${safeId}.${appearance}`, name: `${preset.name} · ${appearance === "light" ? "Light" : "Dark"}`,
      image: "background.png", appearance, art: { focusX: 0.72, focusY: 0.45, safeArea: "left", taskMode: "ambient" }, colors
    };
    const safeCss = [
      `[data-ds-part="root"] { background-color: ${colors.background}; color: ${colors.text}; }`,
      `[data-ds-part="sidebar"] { background-color: color-mix(in srgb, ${colors.panel} 90%, transparent); color: ${colors.text}; border-color: ${colors.line}; border-width: 1px; border-style: solid; }`,
      `[data-ds-part="main"] { background-color: color-mix(in srgb, ${colors.background} 86%, transparent); color: ${colors.text}; }`,
      `[data-ds-part="composer"] { background-color: color-mix(in srgb, ${colors.panelAlt} 94%, transparent); border-color: ${colors.line}; border-width: 1px; border-style: solid; border-radius: 18px; }`,
    ].join("\n");
    const background = new Uint8Array(await (await canvasToPng(colors)).arrayBuffer());
    const file = async (name, bytes) => ({ path: name, mediaType: name.endsWith(".png") ? "image/png" : name.endsWith(".jpg") ? "image/jpeg" : name.endsWith(".css") ? "text/css" : "application/json", bytes, sha256: await sha256Hex(bytes) });
    const themeJson = new TextEncoder().encode(`${JSON.stringify(theme, null, 2)}\n`);
    const themeCss = new TextEncoder().encode(`${safeCss}\n`);
    const entries = await Promise.all([file("theme.json", themeJson), file(theme.image, background), file("theme.css", themeCss)]);
    const manifest = {
      packageVersion: 1, themeId: theme.id, version: "1.0.0", skinApiVersion: 1, minClientVersion: "1.5.12",
      platforms: ["macos", "windows"], capabilities: ["background", "tokens", "safe-css"], publisher: { id: "payAgain", displayName: "payAgain" },
      license: "MIT", provenance: { aiGenerated: false, summary: "Generated by Codex Theme Studio from a built-in Codex++ preset." }, files: entries, createdAt: new Date().toISOString()
    };
    const manifestJson = new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`);
    const blob = zipStore(new Map([["manifest.json", manifestJson], ["theme.json", themeJson], [theme.image, background], ["theme.css", themeCss]]));
    const filename = `${theme.id}.zip`;
    const anchor = document.createElement("a"); anchor.href = URL.createObjectURL(blob); anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 5000);
    return { blob, filename, manifest, theme };
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
#${PANEL_ID} .cts-dreamskin-status { margin-top: 6px; font-size: 11px; color: var(--color-text-secondary, #999); line-height: 1.4; overflow-wrap: anywhere; }
#${PANEL_ID} .cts-dreamskin-search { display: flex; gap: 6px; margin-top: 6px; }
#${PANEL_ID} .cts-dreamskin-search input { flex: 1; }
#${PANEL_ID} .cts-theme-list { display: grid; gap: 5px; margin-top: 6px; }
#${PANEL_ID} .cts-theme-item { display: grid; gap: 3px; padding: 6px; border: 1px solid var(--color-border, rgba(255,255,255,.1)); border-radius: 7px; background: var(--color-background-primary-soft, transparent); }
#${PANEL_ID} .cts-theme-name { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${PANEL_ID} .cts-theme-meta { font-size: 10px; color: var(--color-text-tertiary, #888); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${PANEL_ID} .cts-theme-actions { display: flex; gap: 5px; }
#${PANEL_ID} .cts-theme-actions button { flex: 1; padding: 4px 6px; font-size: 11px; }
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
    const parts = dreamskinActive
      ? [buildFontFaceCss(), buildPanelCss()]
      : [buildFontFaceCss(), buildGlobalOverrides(), buildDarkOverrides(), buildLightOverrides(), buildClaudeOverrides(), buildPanelCss()];
    document.documentElement.dataset.themeStudio = dreamskinActive ? "dreamskin" : (settings.preset === "claude" ? "claude" : "");
    if (!document.documentElement.dataset.themeStudio) delete document.documentElement.dataset.themeStudio;
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
  function formatBytes(size) {
    if (!Number.isFinite(size)) return "-";
    const units = ["B", "KB", "MB", "GB"]; let value = size, unit = 0;
    while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
    return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`;
  }

  async function renderDreamSkinSection(container) {
    const section = el("div", "cts-section");
    section.appendChild(el("span", "cts-label", "DreamSkin 主题包"));
    const status = el("div", "cts-dreamskin-status", dreamskinActive ? `已应用：${dreamskinActive.name}` : "未应用 DreamSkin 主题");
    section.appendChild(status);

    const exportRow = el("div", "cts-row");
    const exportDark = el("button", "cts-action", "导出 Dark");
    const exportLight = el("button", "cts-action", "导出 Light");
    for (const button of [exportDark, exportLight]) button.type = "button";
    exportDark.addEventListener("click", async () => {
      exportDark.disabled = exportLight.disabled = true; status.textContent = "正在生成 Dark ZIP...";
      try { await exportPresetToDreamSkin(settings.preset, "dark"); status.textContent = "Dark ZIP 已下载。"; }
      catch (error) { status.textContent = error.message || "导出失败"; }
      finally { exportDark.disabled = exportLight.disabled = false; }
    });
    exportLight.addEventListener("click", async () => {
      exportDark.disabled = exportLight.disabled = true; status.textContent = "正在生成 Light ZIP...";
      try { await exportPresetToDreamSkin(settings.preset, "light"); status.textContent = "Light ZIP 已下载。"; }
      catch (error) { status.textContent = error.message || "导出失败"; }
      finally { exportDark.disabled = exportLight.disabled = false; }
    });
    exportRow.append(exportDark, exportLight); section.appendChild(exportRow);

    const importRow = el("div", "cts-dreamskin-search");
    const importButton = el("button", "cts-action", "导入 ZIP"); importButton.type = "button";
    const fileInput = document.createElement("input"); fileInput.type = "file"; fileInput.accept = ".zip,application/zip"; fileInput.hidden = true;
    importButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0]; if (!file) return;
      importButton.disabled = true; status.textContent = `正在导入 ${file.name}...`;
      try { const record = await importDreamSkinPackage(file); await applyDreamSkin(record); }
      catch (error) { status.textContent = error.message || "导入失败"; }
      finally { fileInput.value = ""; importButton.disabled = false; }
    });
    importRow.append(importButton, fileInput); section.appendChild(importRow);

    if (dreamskinActive) {
      const clearButton = el("button", "cts-action", "清除 DreamSkin 并恢复预设"); clearButton.type = "button"; clearButton.style.width = "100%";
      clearButton.addEventListener("click", () => void clearDreamSkin()); section.appendChild(clearButton);
    }

    section.appendChild(el("div", "cts-label", "Gallery 在线搜索"));
    const searchRow = el("div", "cts-dreamskin-search");
    const searchInput = document.createElement("input"); searchInput.type = "text"; searchInput.placeholder = "搜索主题名称"; searchInput.value = dreamskinOnline.query || "";
    const searchButton = el("button", "cts-action", "搜索"); searchButton.type = "button";
    const search = () => { searchButton.disabled = true; status.textContent = "正在搜索 DreamSkin Gallery..."; void searchDreamSkinGallery(searchInput.value).finally(() => { searchButton.disabled = false; }); };
    searchButton.addEventListener("click", search);
    searchInput.addEventListener("keydown", event => { if (event.key === "Enter") search(); });
    searchRow.append(searchInput, searchButton); section.appendChild(searchRow);

    if (dreamskinOnline.state === "loading") status.textContent = "正在搜索 DreamSkin Gallery...";
    if (dreamskinOnline.state === "failed") status.textContent = dreamskinOnline.error;
    if (dreamskinOnline.state === "ready" && !dreamskinOnline.items.length) status.textContent = "Gallery 没有匹配主题。";

    if (dreamskinOnline.items.length) {
      const list = el("div", "cts-theme-list");
      for (const item of dreamskinOnline.items.slice(0, 8)) {
        const itemNode = el("div", "cts-theme-item");
        itemNode.appendChild(el("div", "cts-theme-name", item.name || item.themeId || item.id));
        itemNode.appendChild(el("div", "cts-theme-meta", `${item.authorDisplayName || "未知作者"} · v${item.version || "?"} · ${formatBytes(item.packageBytes)} · ${(item.platforms || item.displayMeta?.platforms || []).join(" / ") || "unspecified"}`));
        const actions = el("div", "cts-theme-actions");
        const download = el("button", "cts-action", "下载应用"); download.type = "button";
        download.addEventListener("click", async () => {
          download.disabled = true; status.textContent = `正在下载 ${item.name || item.id}...`;
          try { await downloadDreamSkin(item); }
          catch (error) { status.textContent = error.message; status.appendChild(document.createElement("br")); const open = document.createElement("a"); open.href = DREAMSKIN_SITE; open.target = "_blank"; open.rel = "noopener noreferrer"; open.textContent = "在浏览器打开 Gallery"; status.appendChild(open); }
          finally { download.disabled = false; }
        });
        const open = el("button", "cts-action", "详情"); open.type = "button";
        open.addEventListener("click", () => window.open(`${DREAMSKIN_SITE}/${item.slug || item.id}`, "_blank", "noopener"));
        actions.append(download, open); itemNode.appendChild(actions); list.appendChild(itemNode);
      }
      section.appendChild(list);
    }

    try {
      const installed = await dreamSkinStore("list");
      if (installed.length) {
        section.appendChild(el("div", "cts-label", "已安装主题"));
        const localList = el("div", "cts-theme-list");
        for (const record of installed.sort((a, b) => String(b.installedAt).localeCompare(String(a.installedAt)))) {
          const item = el("div", "cts-theme-item");
          item.appendChild(el("div", "cts-theme-name", record.name));
          item.appendChild(el("div", "cts-theme-meta", `v${record.version} · ${formatBytes(record.packageBytes)} · ${record.author}`));
          const actions = el("div", "cts-theme-actions");
          const apply = el("button", "cts-action", settings.dreamskinId === record.id ? "重新应用" : "应用"); apply.type = "button";
          apply.addEventListener("click", () => void applyDreamSkin(record));
          const remove = el("button", "cts-action", "删除"); remove.type = "button";
          remove.addEventListener("click", async () => {
            if (settings.dreamskinId === record.id) await clearDreamSkin();
            await dreamSkinStore("delete", record.id); renderPanel();
          });
          actions.append(apply, remove); item.appendChild(actions); localList.appendChild(item);
        }
        section.appendChild(localList);
      }
    } catch (error) { status.textContent = `主题库不可用：${error.message}`; }
    container.appendChild(section);
  }

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
      item.addEventListener("click", async () => {
        await clearDreamSkin();
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
    accentInput.value = isHexColor(settings.accent) ? settings.accent : (PRESETS[settings.preset].accent || "#339cff");
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
    accentSection.appendChild(el("div", "cts-hint", "Claude 预设自动适配深浅色，修改立即生效"));
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
    void renderDreamSkinSection(panelEl);


    const footer = el("div", "cts-footer");
    const resetButton = el("button", "cts-action", "全部重置");
    resetButton.type = "button";
    resetButton.addEventListener("click", () => {
      settings = structuredClone(DEFAULTS);
      saveSettings();
      applyCss();
      renderPanel();
    });
    resetButton.addEventListener("click", async () => {
      await clearDreamSkin();
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
    void restoreDreamSkin();
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
    exportDreamSkin: exportPresetToDreamSkin,
    importDreamSkin: importDreamSkinPackage,
    applyDreamSkin,
    clearDreamSkin,
    searchDreamSkin: searchDreamSkinGallery,
    listDreamSkin: () => dreamSkinStore("list"),
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

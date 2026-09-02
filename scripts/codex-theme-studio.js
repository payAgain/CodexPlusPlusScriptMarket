// ==UserScript==
// @name         Codex Theme Studio
// @namespace    codex-plus-plus
// @version      1.0.0
// @description  Codex 桌面端主题美化：官方 CSS 变量驱动的深色预设（墨蓝/曜石/青屿）、自定义强调色、圆角与超椭圆圆角、UI/代码字体、聊天字号与图标微调，随时一键回到官方默认。
// @match        app://-/*
// @run-at       document-start
// ==/UserScript==

(() => {
  "use strict";

  if (window.top !== window.self) return;

  const SCRIPT_ID = "codex-theme-studio";
  const SCRIPT_VERSION = "1.0.0";
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
    icons: { newChat: false, search: false, sidebarCollapse: false },
  };

  const PRESETS = {
    official: { name: "官方默认", accent: "", radiusScale: null, cornerShape: "", tokens: null },
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
        return normalize({ ...structuredClone(DEFAULTS), ...raw, icons: { ...DEFAULTS.icons, ...(raw.icons || {}) } });
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
    for (const key of Object.keys(DEFAULTS.icons)) next.icons[key] = next.icons[key] === true;
    return next;
  }

  function saveSettings() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* private mode */ }
  }

  // -------------------------------------------------------------------- css

  const SANS_FALLBACK = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const MONO_FALLBACK = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace';

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

  function accentTokens(accent) {
    return {
      "--color-accent-blue": accent,
      "--color-background-info-solid": accent,
      "--color-background-info-soft": `color-mix(in srgb, ${accent} 30%, transparent)`,
      "--color-background-info-surface": `color-mix(in oklab, ${accent} 22%, #000)`,
      "--color-background-accent": `color-mix(in oklab, ${accent} 26%, #000)`,
      "--color-background-accent-hover": `color-mix(in oklab, ${accent} 30%, #000)`,
      "--color-background-accent-active": `color-mix(in oklab, ${accent} 34%, #000)`,
      "--color-background-tip-badge": `color-mix(in oklab, ${accent} 16%, transparent)`,
      "--color-background-tip-soft": `color-mix(in oklab, ${accent} 16%, transparent)`,
      "--color-background-text-selection": `color-mix(in srgb, ${accent} 30%, transparent)`,
      "--color-background-attribution-highlight": `color-mix(in srgb, ${accent} 30%, transparent)`,
      "--color-border-focus": `color-mix(in srgb, ${accent} 76%, transparent)`,
      "--color-text-accent": `color-mix(in srgb, ${accent} 72%, white)`,
      "--color-text-info": `color-mix(in srgb, ${accent} 72%, white)`,
      "--color-text-info-soft": accent,
      "--color-text-tip": `color-mix(in srgb, ${accent} 72%, white)`,
      "--color-text-tip-badge": `color-mix(in srgb, ${accent} 72%, white)`,
      "--color-icon-accent": `color-mix(in srgb, ${accent} 72%, white)`,
    };
  }

  function buildGlobalOverrides() {
    const lines = [];
    const emit = (name, value) => { if (value) lines.push(`  ${name}: ${value} !important;`); };
    if (typeof settings.radiusScale === "number") emit("--codex-corner-radius-scale", String(settings.radiusScale));
    if (settings.cornerShape) emit("--codex-corner-shape", settings.cornerShape);
    if (settings.uiFont) {
      const stack = fontStack(settings.uiFont, SANS_FALLBACK);
      emit("--font-sans", stack);
      emit("--font-openai-sans", stack);
    }
    if (settings.codeFont) emit("--font-mono", fontStack(settings.codeFont, MONO_FALLBACK));
    if (settings.chatFontSize) emit("--codex-chat-font-size", settings.chatFontSize);
    if (settings.codeFontSize) emit("--codex-chat-code-font-size", settings.codeFontSize);
    return lines.length ? `:root {\n${lines.join("\n")}\n}` : "";
  }

  function buildDarkOverrides() {
    const preset = PRESETS[settings.preset];
    const accent = isHexColor(settings.accent) ? settings.accent : "";
    if (!preset || !preset.tokens) {
      if (!accent) return "";
      const lines = Object.entries(accentTokens(accent))
        .map(([name, value]) => `  ${name}: ${value} !important;`);
      return `html.electron-dark {\n${lines.join("\n")}\n}`;
    }
    const lines = Object.entries(preset.tokens).map(([name, value]) => `  ${name}: ${value} !important;`);
    const effectiveAccent = accent || preset.accent;
    if (effectiveAccent && isHexColor(effectiveAccent)) {
      for (const [name, value] of Object.entries(accentTokens(effectiveAccent))) lines.push(`  ${name}: ${value} !important;`);
    }
    return `html.electron-dark {\n${lines.join("\n")}\n}`;
  }

  // ------------------------------------------------------------------- icons

  const ICON_SVGS = {
    newChat: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    sidebarCollapse: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>',
  };

  function iconDataUri(name) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(ICON_SVGS[name])}`;
  }

  function buildIconOverrides() {
    const rules = [];
    const rule = (ariaLabel, iconKey) => {
      const uri = iconDataUri(iconKey);
      rules.push(
        `  button[aria-label="${ariaLabel}"] > svg, button[aria-label="${ariaLabel}"] svg:first-child {` +
        ` mask: url("${uri}") center / contain no-repeat !important;` +
        ` -webkit-mask: url("${uri}") center / contain no-repeat !important;` +
        ` background-color: var(--color-icon-primary) !important; }`,
      );
    };
    if (settings.icons.newChat) rule("新对话", "newChat");
    if (settings.icons.search) rule("搜索", "search");
    if (settings.icons.sidebarCollapse) rule("隐藏侧边栏", "sidebarCollapse");
    return rules.length ? rules.join("\n") : "";
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
    const parts = [buildGlobalOverrides(), buildDarkOverrides(), buildIconOverrides(), buildPanelCss()];
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
          icons: { ...DEFAULTS.icons },
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
    accentSection.appendChild(el("div", "cts-hint", "仅作用于深色模式，修改立即生效"));
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
    fontSection.appendChild(el("span", "cts-label", "UI 字体（留空 = 官方）"));
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

    fontSection.appendChild(el("span", "cts-label", "代码字体（留空 = 官方）"));
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

    const iconSection = el("div", "cts-section");
    iconSection.appendChild(el("span", "cts-label", "图标替换（实验性）"));
    for (const [key, label] of [["newChat", "新对话 → 简约加号"], ["search", "搜索 → 线性放大镜"], ["sidebarCollapse", "折叠侧边栏 → 线性面板"]]) {
      const check = el("label", "cts-check");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = settings.icons[key] === true;
      box.addEventListener("change", () => {
        settings.icons[key] = box.checked;
        saveSettings();
        applyCss();
      });
      check.appendChild(box);
      check.appendChild(el("span", null, label));
      iconSection.appendChild(check);
    }
    panelEl.appendChild(iconSection);

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

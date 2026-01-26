import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { RemendOptions } from "remend";
import type { BundledTheme } from "shiki";
import type { ControlsConfig, MermaidOptions, PluginConfig } from "streamdown";

export const STREAMDOWN_PLUGINS: PluginConfig = {
  code,
  math,
  // Plugins oficiais do Streamdown para garantir compatibilidade e suporte.
  mermaid,
  cjk,
};

export const STREAMDOWN_CONTROLS: ControlsConfig = {
  table: true,
  code: true,
  mermaid: {
    copy: true,
    download: true,
    fullscreen: true,
    panZoom: true,
  },
};

// Remend reduz flicker no streaming e evita links quebrados.
export const STREAMDOWN_REMEND: RemendOptions = {
  linkMode: "text-only" as const,
};

export const STREAMDOWN_SHIKI_THEMES: [BundledTheme, BundledTheme] = [
  "github-light",
  "github-dark",
];

// Configuração de Mermaid com segurança estrita (padrão enterprise).
export const STREAMDOWN_MERMAID: MermaidOptions = {
  config: {
    securityLevel: "strict",
  },
};

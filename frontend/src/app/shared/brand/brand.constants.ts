// src/app/shared/brand/brand.constants.ts
// Single source of truth for all MarketSaga brand assets
// Import this anywhere you need the logo or icon

export const BRAND = {
  name:    'Market Saga',
  tagline: 'Trade with Clarity',
  url:     'https://marketsaga.site',

  // ── Shield icon SVG (viewBox="0 0 100 120") ──────────────────────────
  // Use inside any <svg> tag
  shieldPaths: `
    <path d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z" fill="#0D9488"/>
    <path d="M35 68L48 50L58 60L75 35" stroke="#5EEAD4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="75" cy="35" r="7" fill="white"/>
  `,

  // ── Full inline SVG: shield icon only (for favicon, sidebar collapsed) ──
  iconSvg: `<svg width="40" height="48" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z" fill="#0D9488"/>
    <path d="M35 68L48 50L58 60L75 35" stroke="#5EEAD4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="75" cy="35" r="7" fill="white"/>
  </svg>`,

  // ── Full logo: icon + wordmark (dark bg — navbar/sidebar) ────────────
  logoDark: `<svg width="220" height="52" viewBox="0 0 220 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 2) scale(0.4)">
      <path d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z" fill="#0D9488"/>
      <path d="M35 68L48 50L58 60L75 35" stroke="#5EEAD4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="75" cy="35" r="7" fill="white"/>
    </g>
    <text x="48" y="30" fill="white" style="font-family:Arial,sans-serif;font-weight:700;font-size:22px;letter-spacing:-0.5px">Market<tspan fill="#94a3b8" font-weight="400">Saga</tspan></text>
    <text x="49" y="46" fill="#5EEAD4" style="font-family:Arial,sans-serif;font-weight:800;font-size:7px;letter-spacing:2.5px">TRADE WITH CLARITY</text>
  </svg>`,

  // ── Auth page logo (centered, larger) ────────────────────────────────
  logoAuth: `<svg width="280" height="80" viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(60, 4) scale(0.6)">
      <path d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z" fill="#0D9488"/>
      <path d="M35 68L48 50L58 60L75 35" stroke="#5EEAD4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="75" cy="35" r="7" fill="white"/>
    </g>
    <text x="109" y="45" fill="white" style="font-family:Arial,sans-serif;font-weight:700;font-size:34px;letter-spacing:-1px">Market<tspan fill="#94a3b8" font-weight="400">Saga</tspan></text>
    <text x="111" y="64" fill="#5EEAD4" style="font-family:Arial,sans-serif;font-weight:800;font-size:9px;letter-spacing:3.5px">TRADE WITH CLARITY</text>
  </svg>`,
};

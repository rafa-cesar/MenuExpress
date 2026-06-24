import { useMemo } from 'react';
import type { EstiloVisual } from '../types/domain';

export type BrandPalette = {
  // Cor principal da marca
  primary: string;
  // Versão escura (para hover, sombras)
  primaryDark: string;
  // Versão clara (para backgrounds sutis, badges)
  primaryLight: string;
  // Cor do texto sobre a cor principal (preto ou branco, por contraste)
  onPrimary: string;
  // Gradiente do hero
  heroGradient: string;
  // Estilo visual escolhido
  estilo: EstiloVisual;
  // Border radius dos botões
  buttonRadius: string;
  // Classes de fonte do título (Tailwind)
  titleClass: string;
};

/** Converte hex para componentes RGB */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** Luminância relativa para cálculo de contraste WCAG */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Escurece uma cor hex pelo fator dado (0–1) */
function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - amount;
  const toHex = (v: number) => Math.round(Math.max(0, v * factor)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Clareia uma cor hex misturando com branco */
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const toHex = (v: number) => Math.round(Math.min(255, v + (255 - v) * amount)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const estiloConfig: Record<EstiloVisual, Pick<BrandPalette, 'buttonRadius' | 'titleClass'>> = {
  moderno: { buttonRadius: '9999px', titleClass: 'font-black tracking-tight' },
  clean:   { buttonRadius: '12px',   titleClass: 'font-bold tracking-normal' },
  vibrante:{ buttonRadius: '9999px', titleClass: 'font-black tracking-wide' },
  classico:{ buttonRadius: '8px',    titleClass: 'font-bold tracking-wide' },
};

export function useBrand(corPrincipal: string, estiloVisual: EstiloVisual = 'moderno'): BrandPalette {
  return useMemo(() => {
    const primary = corPrincipal || '#f97316';
    const primaryDark = darken(primary, 0.18);
    const primaryLight = lighten(primary, 0.82);

    const [r, g, b] = hexToRgb(primary);
    const lum = luminance(r, g, b);
    // Contraste com branco vs preto: escolhe o que tiver maior contraste
    const onPrimary = lum > 0.35 ? '#0f172a' : '#ffffff';

    const heroGradient = (() => {
      switch (estiloVisual) {
        case 'clean':
          return `linear-gradient(135deg, ${primaryDark} 0%, #1e293b 100%)`;
        case 'vibrante':
          return `linear-gradient(135deg, ${primary} 0%, ${darken(primary, 0.35)} 50%, #0f172a 100%)`;
        case 'classico':
          return `linear-gradient(180deg, #1c1917 0%, ${primaryDark} 100%)`;
        default: // moderno
          return `linear-gradient(135deg, ${primary} 0%, #0f172a 75%)`;
      }
    })();

    const { buttonRadius, titleClass } = estiloConfig[estiloVisual];

    return { primary, primaryDark, primaryLight, onPrimary, heroGradient, estilo: estiloVisual, buttonRadius, titleClass };
  }, [corPrincipal, estiloVisual]);
}

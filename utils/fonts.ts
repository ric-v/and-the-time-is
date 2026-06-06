/**
 * Font configuration for Horizon.
 *
 * Inter — display (weight 100, tabular-nums) and UI (weights 400/500).
 * JetBrains Mono — monospace for ISO timestamps, Unix values, metadata.
 *
 * Both are loaded via next/font/google which self-hosts the font files,
 * eliminating external requests and enabling automatic subsetting.
 *
 * Usage:
 *   import { inter, jetbrainsMono } from '@/utils/fonts';
 *   <div className={inter.variable}>  // sets --font-inter
 *   <code className={jetbrainsMono.variable}>  // sets --font-mono
 */

import { Inter, JetBrains_Mono, Fraunces, IBM_Plex_Mono, Cormorant_Garamond } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['100', '400', '500'],
  display: 'swap',
  variable: '--font-inter',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-mono',
});

/** Orrery display serif — Cormorant Garamond */
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
});

/** Legacy Fraunces (kept for non-observatory surfaces) */
export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-fraunces',
});

/** Observatory UI / meta monospace */
export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-ibm-mono',
});

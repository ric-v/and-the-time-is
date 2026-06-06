/**
 * Font configuration for The Pass theme.
 *
 * Nunito — UI and display.
 * JetBrains Mono — timestamps, metadata, scrub readouts.
 */

import { JetBrains_Mono, Nunito } from 'next/font/google';

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-mono',
});

export const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-nunito',
});

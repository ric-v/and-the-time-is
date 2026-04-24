/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Three.js ships ES modules and supports tree-shaking out of the box.
  // Named imports (e.g. `import { Scene } from 'three'`) allow the bundler
  // to eliminate unused exports, keeping the bundle within the 180KB gzip
  // budget. The tree-shaken import barrel at utils/three-imports.ts enforces
  // this convention across all Horizon components.

  // Empty turbopack config to acknowledge Turbopack is the default bundler
  // in Next.js 16+. Three.js tree-shaking works natively with Turbopack's
  // ES module handling.
  turbopack: {},
};

module.exports = nextConfig;

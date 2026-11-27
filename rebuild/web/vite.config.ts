import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// The app renders client-side, so the browser only discovers a web font when React first paints text
// that uses it, and the late swap reflows the hero (homepage CLS). Preload the faces the hero paints:
// Anton (headline) and Inter 400/600/700 (sub line, eyebrow, buttons). Names are hashed at build.
const PRELOAD_FONTS = [/anton-latin-400-normal/, /inter-latin-400-normal/, /inter-latin-600-normal/, /inter-latin-700-normal/]

function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml(_html, ctx) {
      const files = Object.keys(ctx.bundle ?? {}).filter((f) => f.endsWith('.woff2') && PRELOAD_FONTS.some((re) => re.test(f)))
      return files.map((f) => ({
        tag: 'link',
        attrs: { rel: 'preload', href: `/${f}`, as: 'font', type: 'font/woff2', crossorigin: '' },
        injectTo: 'head',
      }))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadFonts()],
})

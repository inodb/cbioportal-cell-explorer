import { readFileSync } from 'fs'
import { execSync } from 'child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const commitHash = execSync('git rev-parse --short=7 HEAD').toString().trim()

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
    'global': 'globalThis',
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    // Disable features that don't apply in embed mode
    'import.meta.env.VITE_ENABLE_STATS_WIDGET': JSON.stringify('false'),
    'import.meta.env.VITE_ENABLE_PROFILER': JSON.stringify('false'),
    'import.meta.env.VITE_ENABLE_POSTMESSAGE': JSON.stringify('false'),
  },
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
  build: {
    outDir: 'dist-embed',
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/embed.tsx'),
      name: 'CellExplorerEmbed',
      formats: ['iife'],
      fileName: () => 'embed.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  plugins: [
    // Rewrite ?worker imports to ?worker&inline so the worker is inlined
    // into the IIFE bundle (no separate file needed)
    {
      name: 'inline-workers',
      enforce: 'pre',
      transform(code, id) {
        if (code.includes('?worker')) {
          return code.replace(/\?worker(['"])/g, '?worker&inline$1')
        }
      },
    },
    react(),
  ],
})

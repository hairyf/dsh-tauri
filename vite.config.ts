import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Client-plugin bundle for dsh-tauri.
 *
 * The dsh web shell loads the browser half of a plugin as ONE self-contained
 * script that registers its factory on the shared module loader:
 *
 *   window.__ModuleLoader__.load({ id, factory: (require) => { ... } })
 *
 * - `react` / `react/jsx-runtime` stay external: they resolve through the
 *   loader's module table (the dsh web app provides React 18).
 * - Every other dependency (@heroui/react, @gravity-ui/icons, ...) is
 *   inlined into the bundle; the loader `require` never sees them.
 * - Output lands at lib/client.js (with its source map), which the node half
 *   serves under /plugins/dsh-tauri/client.js.
 */
const LOADER_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
]

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/client/index.ts',
      formats: ['cjs'],
      fileName: () => 'client.js',
    },
    outDir: 'lib',
    sourcemap: true,
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      external: LOADER_EXTERNALS,
      output: {
        // 插件 bundle 必须是单文件：loader 无法解析 chunk 间的相对 require
        inlineDynamicImports: true,
        intro: 'var module = { exports: {} }; var exports = module.exports;',
        banner: 'window.__ModuleLoader__.load({ id: "dsh-tauri", factory: (require) => {',
        footer: 'return module.exports; } });',
      },
    },
  },
})

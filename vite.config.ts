import { defineConfig } from 'vite'

/**
 * Client-plugin bundle for dsh-tauri（纯消息桥，无 UI）。
 *
 * The dsh web shell loads the browser half of a plugin as ONE self-contained
 * script that registers its factory on the shared module loader:
 *
 *   window.__ModuleLoader__.load({ id, factory: (require) => { ... } })
 *
 * 桥代码零运行时依赖（不 import 任何外部模块，类型导入在编译期擦除），
 * 因此无需 external/define 配置；产物落盘 lib/client.js（含 source map），
 * node half 在 /plugins/dsh-tauri/client.js 提供。
 */
export default defineConfig({
  build: {
    lib: {
      entry: 'src/client/index.ts',
      formats: ['cjs'],
      fileName: () => 'client.js',
    },
    outDir: 'lib',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
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

// 加载器冒烟测试：模拟 window.__ModuleLoader__，物化 factory 并检查顶层执行不抛错。
// 复现过的问题：bundle 内联库读取 process.env.NODE_ENV → ReferenceError。
const fs = require('node:fs')
const path = require('node:path')

const bundlePath = path.join(__dirname, '..', 'lib', 'client.js')
const code = fs.readFileSync(bundlePath, 'utf8')

let loaded = null
global.window = {
  __ModuleLoader__: {
    load: ({ id, factory }) => { loaded = { id, factory } },
  },
}

// bundle 是 CJS 闭包：new Function 里执行，window 由全局提供
new Function(code)() // eslint-disable-line no-new-func
if (!loaded) throw new Error('loader.load was never called')

const { id, factory } = loaded
if (id !== 'dsh-tauri') throw new Error(`unexpected bundle id: ${id}`)

// 用真实 node_modules 的 react 18 充当 loader 模块表
const mod = factory(require)
if (!mod || typeof mod.apply !== 'function' || !Array.isArray(mod.inject)) {
  throw new Error(`factory exports malformed: ${JSON.stringify(Object.keys(mod ?? {}))}`)
}

console.log(`OK: bundle "${id}" materialized without throwing`)
console.log(`exports: apply=${typeof mod.apply} inject=${JSON.stringify(mod.inject)} name=${mod.name}`)

/**
 * dsh-tauri 客户端插件体（browser half）。
 *
 * 挂载进 ui-layout 声明的 `shell.overlay`（root 作用域 list 席位，全帧浮动层，
 * 点击穿透由层本身处理，本组件根节点自动获得 pointer-events）。注册时声明
 * locale 命名空间并注入 `toggleSidebar`（背后是 ctx.layout.toggleSidebar）。
 *
 * 服务依赖（inject）：slots（注册）、layout（shell.overlay 席位 + 侧边栏切换）、
 * locale（字典与 t 席位）。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { NavBar } from './nav-bar'
import { en, zh } from './locales'
import type { NavKey } from './locales'
import { injectNavStyles } from './styles'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** 导航栏控件文案（zh/en）。 */
    'dsh-tauri': NavKey
  }
}

/** 插件显示名（诊断元数据）。 */
export const name = 'dsh-tauri'

/** 需要的客户端服务：slots / layout / locale。 */
export const inject = ['slots', 'layout', 'locale']

/** 字典命名空间（与 LocaleNamespaceMap 合并键一致）。 */
const NS = 'dsh-tauri'

/**
 * 插件体：注入样式 → 注册字典 → 注册导航栏席位。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    const removeStyles = injectNavStyles()
    return () => { removeStyles() }
  }, 'dsh-tauri: nav styles')

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-tauri: dictionaries')

  ctx.effect(() => {
    // inject 是业务面工厂：toggleSidebar 背后是 layout 面板动作（ctx 闭包）
    const dispose = ctx.slots.register(
      {
        name: 'shell.overlay',
        id: 'dsh-tauri',
        locale: NS,
        inject: () => ({
          toggleSidebar: () => { ctx.layout.toggleSidebar() },
        }),
      },
      NavBar,
    )
    return () => { dispose() }
  }, 'dsh-tauri: nav bar registration')
}

/**
 * dsh-tauri 客户端插件体（browser half）：纯消息桥，无 UI、无运行时依赖。
 *
 * 桌面端顶部导航栏（shell-nav-bar.tsx）常驻在 Tauri 宿主，其左侧三个控件
 * （侧边栏 / 后退 / 前进）通过 postMessage 操控 iframe 内的 dsh 应用；
 * 本插件是 iframe 内的接收端：把命令转发给 dsh（侧边栏切换走
 * `ctx.layout.toggleSidebar`，后退/前进走 `window.history`），并把 dsh 状态
 * （侧边栏折叠、页面历史边界）回报给宿主。协议详见 `./bridge.ts`。
 *
 * 服务依赖（inject）：layout（侧边栏切换）。locale/slots 均不再需要。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { setupNavBridge } from './bridge'

/** 插件显示名（诊断元数据）。 */
export const name = 'dsh-tauri'

/** 需要的客户端服务：layout（侧边栏切换）。 */
export const inject = ['layout']

/**
 * 插件体：接管导航桥（置位接管标记 → 挂命令监听/状态观察/历史跟踪）。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => setupNavBridge({
    toggleSidebar: () => { ctx.layout.toggleSidebar() },
  }), 'dsh-tauri: nav bridge')
}

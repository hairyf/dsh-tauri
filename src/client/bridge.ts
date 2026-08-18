/**
 * 导航桥核心（iframe 内）：宿主（桌面壳层 ShellNavBar）↔ dsh 应用的消息协议。
 *
 * 消息（postMessage，双向）：
 * - 宿主 → iframe（命令）：`{ source: 'dsh-desktop', type }`
 *   - `dsh://sidebar:toggle`  切换侧边栏（转发 ctx.layout.toggleSidebar）
 *   - `dsh://page:prev`       后退（window.history.back）
 *   - `dsh://page:next`       前进（window.history.forward）
 * - iframe → 宿主（事件）：`{ source: 'dsh-nav-bridge', type, ... }`
 *   - `dsh://sidebar:collapsed` `{ collapsed }` 侧边栏折叠状态
 *   - `dsh://page:firsted`      `{ firsted }` 已到历史最前（宿主应禁用后退）
 *   - `dsh://page:lasted`       `{ lasted }` 已到历史最后（宿主应禁用前进）
 *
 * 本桥与桌面端注入脚本（NAV_SHIM_JS）语义完全一致；插件加载后设置
 * `window.__dsh_tauri_bridge__`，注入脚本据此让位（避免命令/事件双重执行）。
 * 宿主仅接受 iframe 直接发来的消息（event.source === window.parent）。
 */

/** 宿主 → iframe 命令的 source。 */
const SRC_HOST = 'dsh-desktop'

/** iframe → 宿主事件的 source。 */
const SRC_BRIDGE = 'dsh-nav-bridge'

/** 宿主命令类型。 */
const CMD_TOGGLE = 'dsh://sidebar:toggle'
const CMD_PREV = 'dsh://page:prev'
const CMD_NEXT = 'dsh://page:next'

/** 宿主命令所需的业务面（由插件体注入 ctx.layout）。 */
export interface NavBridgeHandlers {
  toggleSidebar: () => void
}

declare global {
  interface Window {
    /** 插件接管标记：桌面端 NAV_SHIM_JS 检测到后停止收发，避免双重执行。 */
    __dsh_tauri_bridge__?: boolean
  }
}

/**
 * 安装导航桥：设置接管标记、挂载命令监听、侧边栏状态观察与页面历史跟踪。
 * @returns 卸载函数（插件重载/停用时清理，桌面端注入脚本随即恢复接管）。
 */
export function setupNavBridge(handlers: NavBridgeHandlers): () => void {
  // 接管标记：置位后桌面端 NAV_SHIM_JS 的命令与事件都让位
  window.__dsh_tauri_bridge__ = true

  function post(message: Record<string, unknown>): void {
    try {
      window.parent.postMessage(Object.assign({ source: SRC_BRIDGE }, message), '*')
    }
    catch {
      // 宿主已销毁等场景静默
    }
  }

  // ── 侧边栏折叠状态（观察 AppFrame 的 data-sidebar-collapsed）────
  function findFrame(): HTMLElement | null {
    const overlay = document.querySelector<HTMLElement>('[data-shell-overlay]')
    return overlay ? (overlay.parentElement as HTMLElement | null) : null
  }

  function collapsedOf(): boolean {
    const frame = findFrame()
    return !!(frame && frame.hasAttribute('data-sidebar-collapsed'))
  }

  const sidebarObserver = new MutationObserver(() => {
    post({ type: 'dsh://sidebar:collapsed', collapsed: collapsedOf() })
  })

  function startSidebarObserve(): boolean {
    const frame = findFrame()
    if (!frame) return false
    sidebarObserver.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed'] })
    post({ type: 'dsh://sidebar:collapsed', collapsed: collapsedOf() })
    return true
  }

  // ── 页面历史跟踪（虚拟栈）──────────────────────────────────────
  // 浏览器不暴露历史位置（history.length 只含总量），只能自己维护：
  // 记录同文档内的 pushState 序列，popstate 时按 URL 定位回退/前进后的
  // 位置，据此推导 firsted/lasted。跨文档导航（未知 URL）时重置为单条会话。
  const stack: string[] = [location.href]
  // 新文档加载会截断前进记录，当前位置即会话末尾；历史可能包含旧文档条目
  //（iframe 之前加载过其他 URL），故以 history.length 推断初始可后退性。
  let position = Math.max(0, window.history.length - 1)

  function reportPage(): void {
    post({ type: 'dsh://page:firsted', firsted: position <= 0 })
    post({ type: 'dsh://page:lasted', lasted: position >= stack.length - 1 })
  }

  type PushStateFn = (data: unknown, _unused: string, url?: string | URL | null) => void
  const origPushState = history.pushState.bind(history)
  const wrappedPushState: PushStateFn = (data, _unused, url) => {
    const result = origPushState(data, _unused, url)
    position += 1
    stack.splice(position) // 截断前进记录
    stack.push(location.href)
    reportPage()
    return result
  }
  history.pushState = wrappedPushState

  type ReplaceStateFn = (data: unknown, _unused: string, url?: string | URL | null) => void
  const origReplaceState = history.replaceState.bind(history)
  const wrappedReplaceState: ReplaceStateFn = (data, _unused, url) => {
    const result = origReplaceState(data, _unused, url)
    if (position < stack.length) stack[position] = location.href
    return result
  }
  history.replaceState = wrappedReplaceState

  function onPopState(): void {
    const idx = stack.indexOf(location.href)
    if (idx >= 0) {
      position = idx
    }
    else {
      // 未知条目（跨文档导航等）：重置为单条会话
      stack.length = 0
      stack.push(location.href)
      position = 0
    }
    reportPage()
  }
  window.addEventListener('popstate', onPopState)

  // ── 宿主命令接收 ──────────────────────────────────────────────
  function onMessage(event: MessageEvent<unknown>): void {
    // 只接受宿主窗口直发的命令；不兼容多层嵌套 iframe
    if (event.source !== window.parent) return
    const data = event.data as { source?: string, type?: string } | null
    if (!data || typeof data !== 'object' || data.source !== SRC_HOST) return
    switch (data.type) {
      case CMD_TOGGLE:
        handlers.toggleSidebar()
        break
      case CMD_PREV:
        window.history.back()
        break
      case CMD_NEXT:
        window.history.forward()
        break
    }
  }
  window.addEventListener('message', onMessage)

  // ── 初始回报 + 应用晚挂载的轮询补报 ──────────────────────────
  reportPage()
  let sidebarTimer: ReturnType<typeof setInterval> | undefined
  if (!startSidebarObserve()) {
    let tries = 0
    sidebarTimer = setInterval(() => {
      if (startSidebarObserve() || ++tries > 30) {
        clearInterval(sidebarTimer)
      }
    }, 500)
  }

  // ── 卸载 ──────────────────────────────────────────────────────
  return () => {
    delete window.__dsh_tauri_bridge__
    window.removeEventListener('message', onMessage)
    window.removeEventListener('popstate', onPopState)
    sidebarObserver.disconnect()
    if (sidebarTimer !== undefined) clearInterval(sidebarTimer)
    if (history.pushState === wrappedPushState) history.pushState = origPushState
    if (history.replaceState === wrappedReplaceState) history.replaceState = origReplaceState
  }
}

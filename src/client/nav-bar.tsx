/**
 * 顶部原生导航栏（54px）：
 *
 *   [侧边栏图标(展开/收起)] [后退] [前进] [     空白拖拽区     ] [最小化][最大化][后台化(X)]
 *
 * - 侧边栏：`toggleSidebar`（注册时注入，背后是 ctx.layout.toggleSidebar），
 *   图标随折叠状态切换（观察 AppFrame 的 data-sidebar-collapsed 属性）。
 * - 后退/前进：iframe 内 window.history（dsh 页面路由控制）。
 * - 空白区：mousedown 发 drag-start 事件（宿主 startDragging），双击最大化。
 * - 窗口按钮：全部经 iframe event 发给宿主（use-iframe-tauri.ts 处理）。
 */
import {
  ArrowLeft,
  ArrowRight,
  ChevronsCollapseHorizontal,
  ChevronsExpandHorizontal,
  Minus,
  Square,
  Xmark,
} from '@gravity-ui/icons'
import { Button } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'

/** 导航栏高度：宿主据此保留顶部空间（与样式表一致）。 */
export const NAV_BAR_HEIGHT = 54

/** 窗口控制动作（iframe event → 宿主 Tauri 窗口 API）。 */
export type WindowAction = 'minimize' | 'maximize' | 'background' | 'drag-start'

/** 注册时注入的业务面：侧边栏切换需要 ctx.layout，故由插件体提供。 */
export interface NavBarInjected {
  toggleSidebar: () => void
}

/** 组合 props：locale 席位 t + 注入面 toggleSidebar（+ 未使用的框架席位）。 */
export interface NavBarProps extends NavBarInjected {
  t: TranslateNS<'dsh-tauri'>
  /** 框架标准席位（renderSlot 等），本组件不使用，仅满足组合类型约束。 */
  renderSlot?: unknown
}

function postWindow(action: WindowAction): void {
  window.parent?.postMessage(
    { source: 'dsh-tauri', type: 'dsh://window-control', action },
    '*',
  )
}

export function NavBar(props: NavBarProps) {
  const { t, toggleSidebar } = props
  const barRef = useRef<HTMLDivElement | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 挂载：通知宿主插件已就绪（隐藏系统标题栏），并为内容保留顶部 54px。
  useEffect(() => {
    window.parent?.postMessage({ source: 'dsh-tauri', type: 'dsh://tauri-ready' }, '*')

    // AppFrame 的 shell.overlay 层是 frame 的直接子节点；给 frame 加 padding-top，
    // 让三列内容整体下移 54px（border-box 保证总高度不变，overflow:hidden 不裁切）。
    const overlay = document.querySelector('[data-shell-overlay]')
    const frame = overlay?.parentElement
    if (frame !== null && frame !== undefined) {
      const prevPadding = frame.style.paddingTop
      const prevBox = frame.style.boxSizing
      frame.style.boxSizing = 'border-box'
      frame.style.paddingTop = `${NAV_BAR_HEIGHT}px`
      return () => {
        frame.style.paddingTop = prevPadding
        frame.style.boxSizing = prevBox
      }
    }
  }, [])

  // 侧边栏折叠状态：AppFrame 在 frame 上维护 data-sidebar-collapsed 属性，
  // 观察它即可得到展开/收起两态，用于切换图标与提示文案。
  useEffect(() => {
    const bar = barRef.current
    const frame = bar?.closest('[data-shell-overlay]')?.parentElement
    if (frame === null || frame === undefined) return
    const update = () => setSidebarCollapsed(frame.hasAttribute('data-sidebar-collapsed'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed'] })
    return () => observer.disconnect()
  }, [])

  // 空白拖拽区：mousedown → drag-start（宿主 startDragging），双击 → 最大化。
  function onDragMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    postWindow('drag-start')
  }

  return (
    <div ref={barRef} className="dsh-tauri-nav" data-dsh-tauri-nav>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        disableRipple
        className="dsh-tauri-nav__btn"
        aria-label={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        onPress={toggleSidebar}
      >
        {sidebarCollapsed
          ? <ChevronsExpandHorizontal  />
          : <ChevronsCollapseHorizontal  />}
      </Button>

      <Button
        isIconOnly
        size="sm"
        variant="light"
        disableRipple
        className="dsh-tauri-nav__btn"
        aria-label={t('nav.back')}
        title={t('nav.back')}
        onPress={() => { window.history.back() }}
      >
        <ArrowLeft  />
      </Button>

      <Button
        isIconOnly
        size="sm"
        variant="light"
        disableRipple
        className="dsh-tauri-nav__btn"
        aria-label={t('nav.forward')}
        title={t('nav.forward')}
        onPress={() => { window.history.forward() }}
      >
        <ArrowRight  />
      </Button>

      {/* 空白区：窗口拖拽 + 双击最大化 */}
      <div
        className="dsh-tauri-nav__drag"
        onMouseDown={onDragMouseDown}
        onDoubleClick={() => { postWindow('maximize') }}
      />

      <Button
        isIconOnly
        size="sm"
        variant="light"
        disableRipple
        className="dsh-tauri-nav__btn"
        aria-label={t('window.minimize')}
        title={t('window.minimize')}
        onPress={() => { postWindow('minimize') }}
      >
        <Minus  />
      </Button>

      <Button
        isIconOnly
        size="sm"
        variant="light"
        disableRipple
        className="dsh-tauri-nav__btn"
        aria-label={t('window.maximize')}
        title={t('window.maximize')}
        onPress={() => { postWindow('maximize') }}
      >
        <Square style={{ width: 14, height: 14 }} />
      </Button>

      <Button
        isIconOnly
        size="sm"
        variant="light"
        disableRipple
        className="dsh-tauri-nav__btn dsh-tauri-nav__btn--danger"
        aria-label={t('window.background')}
        title={t('window.background')}
        onPress={() => { postWindow('background') }}
      >
        <Xmark  />
      </Button>
    </div>
  )
}


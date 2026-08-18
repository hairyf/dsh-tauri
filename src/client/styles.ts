/**
 * 导航栏样式（插件注入 <style data-plugin="dsh-tauri"> 到 iframe 文档）。
 *
 * 高度 54px；背景色跟随宿主主题：深色 rgb(21, 21, 23)，亮色 rgb(255, 255, 255)
 * （dsh web 的主题呈现器在 body 上维护 `data-ds-dark-theme` 属性）。
 * 其余颜色用局部 CSS 变量表达，一并随主题切换。
 */
export const NAV_CSS = `
/* body 级 portal 容器：零尺寸、点击穿透，只承载 fixed 导航栏（应用之上的兄弟元素） */
[data-dsh-tauri-nav-root] {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 0;
  z-index: 2147483000;
  pointer-events: none;
}
.dsh-tauri-nav {
  pointer-events: auto;

  --dsh-tauri-bg: rgb(255, 255, 255);
  --dsh-tauri-ink: #0f1115;
  --dsh-tauri-muted: #61666b;
  --dsh-tauri-hover: rgba(0, 0, 0, 0.06);
  --dsh-tauri-active: rgba(0, 0, 0, 0.1);
  --dsh-tauri-line: rgba(0, 0, 0, 0.12);
  --dsh-tauri-danger: #f25a5a;

  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 54px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px;
  box-sizing: border-box;
  background: var(--dsh-tauri-bg);
  border-bottom: 1px solid var(--dsh-tauri-line);
  z-index: 2147483000;
  user-select: none;
  -webkit-user-select: none;
}
body[data-ds-dark-theme] .dsh-tauri-nav {
  --dsh-tauri-bg: rgb(21, 21, 23);
  --dsh-tauri-ink: #f9fafb;
  --dsh-tauri-muted: #adb2b8;
  --dsh-tauri-hover: rgba(255, 255, 255, 0.08);
  --dsh-tauri-active: rgba(255, 255, 255, 0.12);
  --dsh-tauri-line: rgba(255, 255, 255, 0.12);
}
.dsh-tauri-nav__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--dsh-tauri-ink);
  cursor: default;
  outline: none;
  transition: background-color 0.12s ease, color 0.12s ease;
}
.dsh-tauri-nav__btn:hover {
  background: var(--dsh-tauri-hover);
}
.dsh-tauri-nav__btn:active {
  background: var(--dsh-tauri-active);
}
.dsh-tauri-nav__btn[aria-disabled='true'],
.dsh-tauri-nav__btn:disabled {
  color: var(--dsh-tauri-muted);
  background: transparent;
}
.dsh-tauri-nav__btn--danger:hover {
  background: rgba(242, 90, 90, 0.16);
  color: var(--dsh-tauri-danger);
}
.dsh-tauri-nav__drag {
  flex: 1;
  align-self: stretch;
  min-width: 0;
}
`

/**
 * 把导航栏样式注入文档（幂等：存在同 data-plugin 标签时跳过）。
 * @returns 移除样式的清理函数。
 */
export function injectNavStyles(): () => void {
  const tagId = 'dsh-tauri/nav.css'
  const existing = document.querySelector<HTMLStyleElement>(`style[data-plugin-css="${tagId}"]`)
  if (existing !== null) {
    // 已被 loader 或本插件注入过；直接返回空清理，避免重复节点
    return () => {}
  }
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-tauri'
  style.dataset.pluginCss = tagId
  style.textContent = NAV_CSS
  document.head.appendChild(style)
  return () => {
    style.remove()
  }
}

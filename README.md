# dsh-tauri — 桌面端顶部原生导航栏

Mounts a native-style top nav bar (54px) inside the DeepSeek Harness web UI:

- 侧边栏展开/收起（`ctx.layout.toggleSidebar`，图标随折叠状态切换）
- 后退 / 前进（iframe 内 `history.back()` / `history.forward()`，dsh 页面路由控制）
- 中部空白区：窗口拖拽区（iframe event → 宿主 `startDragging`），双击最大化
- 最小化 / 最大化 / 后台化（X，隐藏到托盘）——全部通过 iframe event 发给宿主
  Tauri 窗口处理（宿主侧 `use-iframe-tauri.ts` 监听）

DOM 位置：导航栏通过 portal 渲染为 `<body>` 的**第一个子节点**（应用之上的
兄弟元素），不嵌套在 AppFrame / `shell.overlay` 等应用内部结构里；slot 注册
只承担生命周期与 locale/inject 装配。

外观：深色主题背景 `rgb(21, 21, 23)`，亮色主题 `rgb(255, 255, 255)`（跟随
`body[data-ds-dark-theme]`）。组件栈：`@heroui/react`（v2，兼容 iframe 内的
React 18）+ `@gravity-ui/icons`。

## Install

```sh
dsh plugin --profile web add github:hairyf/dsh-tauri
```

安装后重启服务。插件自带 `cordis.patch.yml`（bundle patch），`dsh plugin add`
会自动把它挂入 profile 的 bundle 层并注册到浏览器插件名册。

## Develop

```sh
pnpm install
pnpm build     # 产物 lib/client.js（随仓库提交，安装无需构建）
```

## Protocol（iframe → 宿主）

| type                  | action      | 宿主处理 |
| --------------------- | ----------- | -------- |
| `dsh://tauri-ready`   | —           | `setDecorations(false)`，隐藏系统标题栏 |
| `dsh://window-control`| `minimize`  | `window.minimize()` |
| `dsh://window-control`| `maximize`  | `window.toggleMaximize()` |
| `dsh://window-control`| `background`| `window.hide()`（保留托盘） |
| `dsh://window-control`| `drag-start`| `window.startDragging()` |

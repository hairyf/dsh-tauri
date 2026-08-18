# dsh-tauri — DeepSeek Harness 桌面端消息桥

Message bridge for the DeepSeek Harness desktop shell: forwards host nav-bar
commands into dsh and reports dsh state back. **No UI, no runtime
dependencies** — the top nav bar lives in the Tauri host
(`shell-nav-bar.tsx`), this plugin is only the iframe-side receiver.

桌面端顶部导航栏（`shell-nav-bar.tsx`）常驻在 Tauri 宿主，其左侧三个控件
（侧边栏 / 后退 / 前进）通过 postMessage 操控 iframe 内的 dsh 应用；
本插件是 iframe 内的接收端：把命令转发给 dsh，并把 dsh 状态回报给宿主。

## Protocol（宿主 ↔ iframe，postMessage）

sends（宿主 → iframe，`source: 'dsh-desktop'`）：

| type                   | dsh 处理 |
| ---------------------- | -------- |
| `dsh://sidebar:toggle` | `ctx.layout.toggleSidebar()` |
| `dsh://page:prev`      | `window.history.back()` |
| `dsh://page:next`      | `window.history.forward()` |

events（iframe → 宿主，`source: 'dsh-nav-bridge'`）：

| type                   | payload | 宿主用途 |
| ---------------------- | ------- | -------- |
| `dsh://sidebar:collapsed` | `{ collapsed }` | 侧边栏切换图标 |
| `dsh://page:firsted`   | `{ firsted }` | 已到历史最前 → 禁用后退 |
| `dsh://page:lasted`    | `{ lasted }` | 已到历史最后 → 禁用前进 |

- 宿主与桌面端注入脚本（NAV_SHIM_JS）共用同一协议：插件加载后设置
  `window.__dsh_tauri_bridge__`，注入脚本据此让位（避免命令/事件双重执行）；
  插件卸载时清除标记，注入脚本随即恢复接管。
- `page:firsted/lasted` 由虚拟历史栈推导（浏览器不暴露历史位置）：
  包装 `pushState/replaceState` 记录同文档内的 URL 序列，`popstate` 时按 URL
  定位当前位置；跨文档导航（未知 URL）时重置为单条会话。

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

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
- 页面模型：dsh 应用不产生浏览器历史（无 pushState/hash 路由），「页面」=
  侧边栏当前选中的会话（`[role="treeitem"][aria-selected="true"]`）。桥内维护
  会话访问栈（纯内存）：用户点击会话 → 截断前进记录后追加新页并上报；
  后退/前进 → 点击栈内对应会话行（行元素失效时按标题匹配兜底，标题取自
  行菜单按钮 aria-label，zh/en 两套文案）。

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

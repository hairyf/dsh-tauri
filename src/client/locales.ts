/**
 * 导航栏字典（zh/en），通过 dsh client locale 服务按当前语言切换。
 * i18n keys 为扁平点号风格，与 dsh 插件 locale 契约一致。
 */
export type NavKey =
  | 'sidebar.expand'
  | 'sidebar.collapse'
  | 'nav.back'
  | 'nav.forward'
  | 'window.minimize'
  | 'window.maximize'
  | 'window.background'

export type NavDict = Record<NavKey, string>

export const zh: NavDict = {
  'sidebar.expand': '展开侧边栏',
  'sidebar.collapse': '收起侧边栏',
  'nav.back': '后退',
  'nav.forward': '前进',
  'window.minimize': '最小化',
  'window.maximize': '最大化',
  'window.background': '后台化',
}

export const en: NavDict = {
  'sidebar.expand': 'Expand sidebar',
  'sidebar.collapse': 'Collapse sidebar',
  'nav.back': 'Back',
  'nav.forward': 'Forward',
  'window.minimize': 'Minimize',
  'window.maximize': 'Maximize',
  'window.background': 'Background',
}

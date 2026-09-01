// Simple i18n setup
export type TranslationKey = 'common.appName' | 'common.dashboard' | 'common.projects' | 'common.map' | 'common.reports' | 'common.chat' | 'common.login' | 'common.logout' | 'common.settings'

const translations: Record<TranslationKey, string> = {
  'common.appName': 'Project Pulse',
  'common.dashboard': 'Dashboard',
  'common.projects': 'Projects',
  'common.map': 'Map',
  'common.reports': 'Reports',
  'common.chat': 'AI Chat',
  'common.login': 'Login',
  'common.logout': 'Logout',
  'common.settings': 'Settings'
}

export function t(key: TranslationKey): string {
  return translations[key] || key
}

export const i18n = { t }
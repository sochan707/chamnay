export type ThemeChoice = 'light' | 'dark' | 'system'

export const THEME_KEY = 'chamnay.theme'
export const THEME_CHOICES: ThemeChoice[] = ['light', 'dark', 'system']

export function readTheme(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return THEME_CHOICES.includes(saved as ThemeChoice) ? saved as ThemeChoice : 'system'
  } catch {
    return 'system'
  }
}

export function saveTheme(choice: ThemeChoice) {
  try { localStorage.setItem(THEME_KEY, choice) } catch { /* storage blocked: choice lasts for this visit only */ }
}

export function systemPrefersDark() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(choice: ThemeChoice, prefersDark = systemPrefersDark()) {
  const dark = choice === 'dark' || (choice === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

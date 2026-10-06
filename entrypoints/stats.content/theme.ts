/**
 * 判断当前是否处于暗色模式：
 * 优先依据 ChatGPT 页面根节点（<html>）上的 data-theme 与 class 属性，
 * 其次降级为系统偏好设置。
 */
export function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  const dataTheme = root.getAttribute('data-theme');
  if (dataTheme === 'dark') return true;
  if (dataTheme === 'light') return false;
  if (root.classList.contains('dark')) return true;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function getThemeTokens() {
  const dark = isDarkMode();
  return {
    dark,
    bg: dark ? '#212121' : '#ffffff',
    bgCard: dark ? '#212121' : '#ffffff',
    bgSecondary: dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    border: dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    borderSubtle: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    text: dark ? '#ececec' : '#0d0d0d',
    subtext: dark ? '#b4b4b4' : '#737373',
    hover: dark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)',
    accent: '#339cff',
  };
}

export const theme = getThemeTokens();

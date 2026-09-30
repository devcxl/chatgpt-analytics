/** 面板配色：注入为 CSS 变量，同时供 ECharts 使用。 */
const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;

export const theme = {
  bg: dark ? '#1f1f1f' : '#ffffff',
  bgCard: dark ? '#2f2f2f' : '#f7f7f8',
  border: dark ? '#3f3f46' : '#e5e5e5',
  text: dark ? '#d1d2d3' : '#1f1f21',
  subtext: dark ? '#999999' : '#666666',
  accent: '#8e8ea0',
};

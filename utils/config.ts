import type { GroupBy } from './types';

/** 图表配色，按用途取色。 */
export const CHART_COLORS = {
  gray: '#8e8ea0', // ChatGPT 灰
  blue: '#1a73e8',
  orange: '#f9ab00',
  teal: '#00897b',
  red: '#db4437',
  purple: '#9334e6',
  yellow: '#f2b134',
  green: '#00e679',
};

/** 按定义顺序展开的调色板，供饼图等多色图使用。 */
export const CHART_PALETTE = Object.values(CHART_COLORS);

export interface AppConfig {
  /** 默认聚合维度 */
  groupBy: GroupBy;
  /** 每日图表高度（px） */
  chartHeight: number;
  /** 是否默认展开面板 */
  defaultOpen: boolean;
}

export const CONFIG: AppConfig = {
  groupBy: 'day',
  chartHeight: 320,
  defaultOpen: true,
};

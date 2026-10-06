import type { GroupBy } from './types';

/** 图表配色，按用途取色，采用 OpenAI 原版设计色值体系。 */
export const CHART_COLORS = {
  blue: '#339cff', // OpenAI Accent Blue
  green: '#00a240', // OpenAI Green
  purple: '#924ff7', // OpenAI Purple
  orange: '#e25507', // OpenAI Orange
  yellow: '#f0b800', // OpenAI Yellow
  red: '#e02e2a', // OpenAI Red
  gray: '#8e8ea0', // OpenAI Muted Gray
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
  chartHeight: 260,
  defaultOpen: true,
};

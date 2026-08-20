import type { GroupBy } from './types';

export const CHART_COLORS = [
  '#8e8ea0', // ChatGPT 灰
  '#1a73e8', // 蓝
  '#f9ab00', // 橙
  '#00897b', // 青
  '#db4437', // 红
  '#9334e6', // 紫
  '#f2b134', // 黄
  '#00e679', // 绿
];

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

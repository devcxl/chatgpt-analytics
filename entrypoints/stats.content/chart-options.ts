import type { EChartsCoreOption as EChartsOption } from 'echarts/core';
import { i18n } from '#i18n';
import { CHART_COLORS, CHART_PALETTE } from '~/utils/config';
import type {
  ActivitySeries,
  CreditsSeries,
  Distribution,
  TokenUsageSeries,
} from '~/utils/charts';
import { formatNumber, formatTokens, labelForGroup } from '~/utils/charts';
import type { GroupBy } from '~/utils/types';
import { getThemeTokens } from './theme';

const t = i18n.t;

function getAxisTheme() {
  const currentTheme = getThemeTokens();
  return {
    axisText: { color: currentTheme.subtext },
    axisLine: { lineStyle: { color: currentTheme.borderSubtle } },
    splitLine: { lineStyle: { color: currentTheme.borderSubtle } },
    textColor: currentTheme.text,
    subtextColor: currentTheme.subtext,
  };
}

function tooltipBase() {
  const isDark = getThemeTokens().dark;
  return {
    backgroundColor: isDark ? 'rgba(33, 33, 33, 0.96)' : 'rgba(255, 255, 255, 0.96)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    padding: [8, 12],
    textStyle: {
      color: isDark ? '#ececec' : '#0d0d0d',
      fontSize: 12,
    },
  };
}

type AxisTooltipPoint = { axisValue?: string; seriesName?: string; value?: unknown };

/** ECharts 传给 axis tooltip 的参数是单个对象或对象数组。 */
function tooltipPoints(params: unknown): AxisTooltipPoint[] {
  return (Array.isArray(params) ? params : [params]) as AxisTooltipPoint[];
}

/** 时间序列图共用的横轴，标签随聚合维度变化。 */
function timeAxis(dates: string[], groupBy: GroupBy, boundaryGap: boolean) {
  const { axisText, axisLine } = getAxisTheme();
  return {
    type: 'category',
    boundaryGap,
    data: dates.map((date) => labelForGroup(groupBy, date)),
    axisLine,
    axisLabel: axisText,
    axisTick: { show: false },
  };
}

/** 时间序列图共用的纵轴；token 轴需要按 K / M / B 缩写。 */
function valueAxis(format?: (value: number) => string) {
  const { axisText, splitLine } = getAxisTheme();
  return {
    type: 'value',
    axisLine: { show: false },
    axisLabel: format ? { ...axisText, formatter: format } : axisText,
    splitLine,
  };
}

function emptyChartOption(): EChartsOption {
  const { subtextColor } = getAxisTheme();
  return {
    graphic: [{
      type: 'text',
      left: 'center',
      top: 'middle',
      style: { text: t('noData'), fill: subtextColor, fontSize: 13 },
    }],
  };
}

/** Token 消耗趋势：缓存输入、未缓存输入、输出与合计。 */
export function buildTokenChart(series: TokenUsageSeries, groupBy: GroupBy): EChartsOption {
  const { axisText } = getAxisTheme();
  return {
    color: [CHART_COLORS.blue, CHART_COLORS.gray, CHART_COLORS.red, CHART_COLORS.green],
    legend: { top: 0, textStyle: axisText, itemWidth: 12, itemHeight: 12, itemGap: 16 },
    grid: { left: 56, right: 20, top: 40, bottom: 24 },
    tooltip: {
      ...tooltipBase(),
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      confine: true,
      formatter: (params: unknown) =>
        tooltipPoints(params)
          .map((point) => `${point.seriesName}: ${formatTokens(Number(point.value))}`)
          .join('<br>'),
    },
    xAxis: timeAxis(series.date, groupBy, false),
    yAxis: valueAxis(formatTokens),
    series: [
      { name: t('uncachedInput'), type: 'line', smooth: true, showSymbol: false, areaStyle: { opacity: 0.2 }, data: series.uncachedInput },
      { name: t('cachedInput'), type: 'line', smooth: true, showSymbol: false, areaStyle: { opacity: 0.12 }, data: series.cachedInput },
      { name: t('output'), type: 'line', smooth: true, showSymbol: false, areaStyle: { opacity: 0.28 }, data: series.output },
      { name: t('total'), type: 'line', smooth: true, showSymbol: false, lineStyle: { width: 2 }, data: series.total },
    ],
  };
}

/** 活跃度趋势：用户、线程与轮次。 */
export function buildActivityChart(series: ActivitySeries, groupBy: GroupBy): EChartsOption {
  const { axisText } = getAxisTheme();
  return {
    color: [CHART_COLORS.orange, CHART_COLORS.blue, CHART_COLORS.green],
    legend: { top: 0, textStyle: axisText, itemWidth: 12, itemHeight: 12, itemGap: 16 },
    grid: { left: 56, right: 20, top: 40, bottom: 24 },
    tooltip: {
      ...tooltipBase(),
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      confine: true,
      formatter: (params: unknown) =>
        tooltipPoints(params)
          .map((point) => `${point.seriesName}: ${formatNumber(Number(point.value))}`)
          .join('<br>'),
    },
    xAxis: timeAxis(series.date, groupBy, true),
    yAxis: valueAxis(),
    series: [
      { name: t('users'), type: 'bar', barMaxWidth: 16, data: series.users },
      { name: t('threads'), type: 'bar', barMaxWidth: 16, data: series.threads },
      { name: t('turns'), type: 'bar', barMaxWidth: 16, data: series.turns },
    ],
  };
}

/** 积分消耗趋势。 */
export function buildCreditsChart(series: CreditsSeries, groupBy: GroupBy): EChartsOption {
  return {
    color: [CHART_COLORS.orange],
    grid: { left: 56, right: 20, top: 16, bottom: 24 },
    tooltip: {
      ...tooltipBase(),
      trigger: 'axis',
      confine: true,
      formatter: (params: unknown) => {
        const point = tooltipPoints(params)[0];
        return point ? `${point.axisValue}: ${Number(point.value).toFixed(2)} ${t('credits')}` : '';
      },
    },
    xAxis: timeAxis(series.date, groupBy, false),
    yAxis: valueAxis(),
    series: [{ name: t('credits'), type: 'line', smooth: true, showSymbol: false, areaStyle: { opacity: 0.22 }, data: series.credits }],
  };
}

/** 模型 / 客户端分布饼图；无数据时显示占位文案。 */
export function buildDistributionChart(distribution: Distribution): EChartsOption {
  if (distribution.names.length === 0) return emptyChartOption();
  const { textColor } = getAxisTheme();

  return {
    color: CHART_PALETTE,
    tooltip: {
      ...tooltipBase(),
      trigger: 'item',
      formatter: (params: unknown) => {
        const point = params as { name: string; value: number; percent: number };
        return `${point.name}<br>${formatNumber(Number(point.value))} ${t('turns')} (${point.percent}%)`;
      },
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'middle',
      width: 105,
      textStyle: { color: textColor },
      itemWidth: 10,
      itemHeight: 10,
      type: 'scroll',
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['34%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: { label: { show: true, color: textColor, formatter: '{b}' } },
      data: distribution.names.map((name, index) => ({ name, value: distribution.values[index] })),
    }],
  };
}

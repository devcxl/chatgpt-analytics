<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ChartNoAxesColumn, X } from '@lucide/vue';
import * as echarts from 'echarts/core';
import type { ECharts, EChartsCoreOption as EChartsOption } from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { i18n } from '#i18n';
import { isGroupBy, subscribeToPageAnalytics } from '~/utils/api';
import {
  formatNumber,
  formatTokens,
  labelForGroup,
  toAnalyticsView,
  type AnalyticsView,
} from '~/utils/charts';
import { CONFIG } from '~/utils/config';
import type { AnalyticsResponse } from '~/utils/types';
import {
  buildActivityChart,
  buildCreditsChart,
  buildDistributionChart,
  buildTokenChart,
} from './chart-options';
import { theme } from './theme';

const t = i18n.t;

// ECharts 按需注册，避免把整套图表打入 content script。
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  CanvasRenderer,
  GridComponent,
  LegendComponent,
  TooltipComponent,
]);

const state = reactive({
  loading: true,
  error: '',
  groupBy: CONFIG.groupBy,
  open: CONFIG.defaultOpen,
  data: null as AnalyticsView | null,
});

const tableRows = computed(() => {
  const data = state.data;
  if (!data) return [];
  return data.tokens.date.map((date, index) => ({
    date,
    users: data.activity.users[index] ?? 0,
    threads: data.activity.threads[index] ?? 0,
    turns: data.activity.turns[index] ?? 0,
    credits: data.credits.credits[index] ?? 0,
    totalTokens: data.tokens.total[index] ?? 0,
    cachedInput: data.tokens.cachedInput[index] ?? 0,
    uncachedInput: data.tokens.uncachedInput[index] ?? 0,
    output: data.tokens.output[index] ?? 0,
  }));
});

const hostEl = ref<HTMLElement | null>(null);
const tokenChartEl = ref<HTMLElement | null>(null);
const creditsChartEl = ref<HTMLElement | null>(null);
const activityChartEl = ref<HTMLElement | null>(null);
const modelChartEl = ref<HTMLElement | null>(null);
const clientChartEl = ref<HTMLElement | null>(null);
const chartInstances: ECharts[] = [];
let unsubscribePageAnalytics: (() => void) | undefined;

function disposeCharts() {
  while (chartInstances.length) chartInstances.pop()?.dispose();
}

function renderCharts() {
  const data = state.data;
  if (!data) return;

  const targets: Array<[HTMLElement | null, EChartsOption]> = [
    [tokenChartEl.value, buildTokenChart(data.tokens, state.groupBy)],
    [creditsChartEl.value, buildCreditsChart(data.credits, state.groupBy)],
    [activityChartEl.value, buildActivityChart(data.activity, state.groupBy)],
    [modelChartEl.value, buildDistributionChart(data.models)],
    [clientChartEl.value, buildDistributionChart(data.clients)],
  ];
  if (targets.some(([element]) => !element)) return;

  disposeCharts();
  for (const [element, option] of targets) {
    const chart = echarts.init(element as HTMLElement, undefined, { renderer: 'canvas' });
    chart.setOption(option);
    chartInstances.push(chart);
  }
}

function applyAnalytics(response: AnalyticsResponse) {
  if (!isGroupBy(response.group_by)) {
    state.loading = false;
    state.error = t('unsupportedGroup', { value: response.group_by });
    return;
  }

  state.groupBy = response.group_by;
  state.error = '';
  state.loading = false;
  state.data = toAnalyticsView(response.data);
}

function handleAnalyticsError(error: Error) {
  state.loading = false;
  state.error = t('readDataError');
  console.warn('[chatgpt-analytics] 无法解析页面统计响应', error);
}

function togglePanel() {
  state.open = !state.open;
  if (state.open) {
    window.location.hash = 'chatgpt-analytics';
  } else if (window.location.hash === '#chatgpt-analytics') {
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  }
}

watch(
  [() => state.data, () => state.open],
  async ([, open]) => {
    await nextTick();
    if (open) renderCharts();
    else disposeCharts();
  },
  { flush: 'post' },
);

function handleResize() {
  chartInstances.forEach((chart) => chart.resize());
}

onMounted(() => {
  Object.entries({
    '--bg': theme.bg,
    '--bg-card': theme.bgCard,
    '--border': theme.border,
    '--text': theme.text,
    '--subtext': theme.subtext,
    '--accent': theme.accent,
    '--chart-height': `${CONFIG.chartHeight}px`,
  }).forEach(([name, value]) => hostEl.value?.style.setProperty(name, value));

  if (window.location.hash === '#chatgpt-analytics') state.open = true;
  window.addEventListener('resize', handleResize);
  unsubscribePageAnalytics = subscribeToPageAnalytics(applyAnalytics, handleAnalyticsError);
});

onBeforeUnmount(() => {
  unsubscribePageAnalytics?.();
  unsubscribePageAnalytics = undefined;
  window.removeEventListener('resize', handleResize);
  disposeCharts();
});
</script>

<style>
#chatgpt-analytics-host {
  position: relative;
  z-index: 2147483000 !important;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  display: block;
  width: 100%;
  user-select: none;
  pointer-events: none;
}
#chatgpt-analytics-host * { box-sizing: border-box; }
#chatgpt-analytics-host button,
#chatgpt-analytics-host select,
#chatgpt-analytics-host a { pointer-events: auto; }
.gap-btn {
  display: inline-flex;
  position: relative;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  box-shadow: 0 2px 10px rgba(0, 0, 0, .28);
  transition: transform .15s ease;
}
.gap-btn:hover { transform: scale(1.08); }
.gap-panel {
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 24px 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-card);
  color: var(--text);
  box-shadow: 0 10px 36px rgba(0, 0, 0, .38);
  pointer-events: auto;
}
.gap-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  font-size: 13px;
}
.gap-head .title { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; white-space: nowrap; }
.icon { display: block; flex: none; }
.gap-actions { display: flex; align-items: center; gap: 6px; }
.gap-head button,
.gap-close {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.gap-head button { padding: 5px 8px; }
.gap-head button { display: inline-flex; align-items: center; gap: 4px; }
.gap-close { display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px; padding: 0; }
.gap-body { padding: 12px 14px 16px; }
.gap-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}
.gap-stat {
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
}
.gap-stat .k { color: var(--subtext); font-size: 11px; }
.gap-stat .v { margin-top: 3px; color: var(--text); font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gap-stat.range { grid-column: 1 / -1; }
.gap-chart {
  min-width: 0;
  padding: 9px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
}
.gap-chart.wide { grid-column: 1 / -1; }
.gap-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.gap-chart .k { margin-bottom: 4px; color: var(--subtext); font-size: 12px; }
.gap-chart .el { width: 100%; height: var(--chart-height, 320px); }
.gap-table { margin-top: 12px; }
.gap-table-title { margin: 0 0 8px; color: var(--text); font-size: 13px; font-weight: 600; }
.gap-table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 10px; }
.gap-table table { width: 100%; min-width: 760px; border-collapse: collapse; background: var(--bg); color: var(--text); font-size: 12px; }
.gap-table th, .gap-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); text-align: right; white-space: nowrap; }
.gap-table th:first-child, .gap-table td:first-child { text-align: left; }
.gap-table thead th { color: var(--subtext); font-weight: 500; }
.gap-table tbody th { font-weight: 500; }
.gap-table tbody tr:last-child th, .gap-table tbody tr:last-child td { border-bottom: 0; }
.gap-status { padding: 20px 4px; color: var(--subtext); font-size: 13px; text-align: center; }
.gap-error {
  padding: 12px;
  border: 1px solid rgba(248, 86, 77, .35);
  border-radius: 9px;
  background: var(--bg);
  color: #f8564d;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
@media (max-width: 520px) {
  .gap-panel { width: 100%; margin: 16px 0; }
  .gap-btn { margin: 10px 0; }
  .gap-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gap-charts { grid-template-columns: 1fr; }
  .gap-chart.wide { grid-column: auto; }
  .gap-chart .el { height: min(var(--chart-height, 320px), 260px); }
}
</style>

<template>
  <div id="chatgpt-analytics-host" ref="hostEl">
    <button
      v-if="!state.open"
      class="gap-btn"
      type="button"
      :title="t('viewStats')"
      :aria-label="t('viewStats')"
      @click="togglePanel"
    >
      <ChartNoAxesColumn class="icon" :size="20" :stroke-width="2" aria-hidden="true" />
    </button>

    <section v-else class="gap-panel" :aria-label="t('panelTitle')">
      <header class="gap-head">
        <span class="title">
          <ChartNoAxesColumn class="icon" :size="16" :stroke-width="2" aria-hidden="true" />
          <span>{{ t('panelTitle') }}</span>
        </span>
        <div class="gap-actions">
          <button class="gap-close" type="button" :title="t('close')" :aria-label="t('close')" @click="togglePanel">
            <X class="icon" :size="16" :stroke-width="2" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div class="gap-body">
        <div v-if="state.loading" class="gap-status">{{ t('waitingData') }}</div>
        <div v-else-if="state.error" class="gap-error">{{ state.error }}</div>
        <template v-else-if="state.data">
          <div class="gap-summary">
            <div class="gap-stat"><div class="k">{{ t('activeUserDays') }}</div><div class="v">{{ state.data.summary.users }}</div></div>
            <div class="gap-stat"><div class="k">{{ t('turnCount') }}</div><div class="v">{{ state.data.summary.turns }}</div></div>
            <div class="gap-stat"><div class="k">{{ t('activeThreadCount') }}</div><div class="v">{{ state.data.summary.threads }}</div></div>
            <div class="gap-stat"><div class="k">{{ t('credits') }}</div><div class="v">{{ state.data.summary.credits }}</div></div>
            <div class="gap-stat"><div class="k">{{ t('totalTokens') }}</div><div class="v">{{ state.data.summary.totalTokens }}</div></div>
            <div class="gap-stat range"><div class="k">{{ t('dateRange') }}</div><div class="v">{{ state.data.summary.range }}</div></div>
          </div>

          <div class="gap-charts">
            <div class="gap-chart wide"><div class="k">{{ t('tokenTrend') }}</div><div ref="tokenChartEl" class="el"></div></div>
            <div class="gap-chart wide"><div class="k">{{ t('creditsTrend') }}</div><div ref="creditsChartEl" class="el"></div></div>
            <div class="gap-chart wide"><div class="k">{{ t('activity') }}</div><div ref="activityChartEl" class="el"></div></div>
            <div class="gap-chart"><div class="k">{{ t('modelDistribution') }}</div><div ref="modelChartEl" class="el"></div></div>
            <div class="gap-chart"><div class="k">{{ t('clientDistribution') }}</div><div ref="clientChartEl" class="el"></div></div>
          </div>

          <section class="gap-table" :aria-label="t('details')">
            <h3 class="gap-table-title">{{ t('details') }}</h3>
            <div class="gap-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{{ t('group') }}</th>
                    <th scope="col">{{ t('users') }}</th>
                    <th scope="col">{{ t('threads') }}</th>
                    <th scope="col">{{ t('turns') }}</th>
                    <th scope="col">{{ t('credits') }}</th>
                    <th scope="col">{{ t('totalTokens') }}</th>
                    <th scope="col">{{ t('cachedInput') }}</th>
                    <th scope="col">{{ t('uncachedInput') }}</th>
                    <th scope="col">{{ t('output') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in tableRows" :key="row.date">
                    <th scope="row">{{ labelForGroup(state.groupBy, row.date) }}</th>
                    <td>{{ formatNumber(row.users) }}</td>
                    <td>{{ formatNumber(row.threads) }}</td>
                    <td>{{ formatNumber(row.turns) }}</td>
                    <td>{{ row.credits.toFixed(2) }}</td>
                    <td>{{ formatTokens(row.totalTokens) }}</td>
                    <td>{{ formatTokens(row.cachedInput) }}</td>
                    <td>{{ formatTokens(row.uncachedInput) }}</td>
                    <td>{{ formatTokens(row.output) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
        <div v-else class="gap-status">{{ t('noData') }}</div>
      </div>
    </section>
  </div>
</template>

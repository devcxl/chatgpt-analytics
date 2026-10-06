<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ChartNoAxesColumn, ChevronDown, ChevronUp, Loader2 } from '@lucide/vue';
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
import { getThemeTokens } from './theme';

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
let themeObserver: MutationObserver | undefined;
let mediaQuery: MediaQueryList | undefined;
let resizeObserver: ResizeObserver | undefined;
let intersectionObserver: IntersectionObserver | undefined;
let resizeTimer: number | undefined;

function disposeCharts() {
  while (chartInstances.length) chartInstances.pop()?.dispose();
}

function renderCharts() {
  const data = state.data;
  if (!data || !state.open) return;

  const firstEl = tokenChartEl.value;
  if (!firstEl || firstEl.clientWidth === 0) {
    // 容器尚未获得有效宽度（例如处于隐藏 Tab 或布局未完成），等待尺寸就绪
    return;
  }

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
    if (!element) continue;
    const chart = echarts.init(element, undefined, { renderer: 'canvas' });
    chart.setOption(option);
    chartInstances.push(chart);
  }
}

function scheduleResize() {
  if (resizeTimer) cancelAnimationFrame(resizeTimer);
  resizeTimer = requestAnimationFrame(() => {
    resizeTimer = undefined;
    if (!state.open || !state.data) return;

    const firstEl = tokenChartEl.value;
    if (!firstEl || firstEl.clientWidth === 0) {
      setTimeout(() => {
        if (state.open && state.data && (tokenChartEl.value?.clientWidth ?? 0) > 0) {
          scheduleResize();
        }
      }, 60);
      return;
    }

    if (chartInstances.length === 0) {
      renderCharts();
    } else {
      chartInstances.forEach((chart) => {
        try {
          chart.resize();
        } catch {
          // ignore
        }
      });
    }
  });
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
    if (open) {
      scheduleResize();
    } else {
      disposeCharts();
    }
  },
  { flush: 'post' },
);

function applyThemeVariables() {
  const tokens = getThemeTokens();
  Object.entries({
    '--bg': tokens.bg,
    '--bg-card': tokens.bgCard,
    '--bg-secondary': tokens.bgSecondary,
    '--border': tokens.border,
    '--border-subtle': tokens.borderSubtle,
    '--text': tokens.text,
    '--subtext': tokens.subtext,
    '--hover': tokens.hover,
    '--accent': tokens.accent,
    '--chart-height': `${CONFIG.chartHeight}px`,
  }).forEach(([name, value]) => hostEl.value?.style.setProperty(name, value));

  if (state.open && state.data) {
    scheduleResize();
  }
}

onMounted(() => {
  applyThemeVariables();

  if (window.location.hash === '#chatgpt-analytics') state.open = true;
  window.addEventListener('resize', scheduleResize);
  document.addEventListener('visibilitychange', scheduleResize);
  unsubscribePageAnalytics = subscribeToPageAnalytics(applyAnalytics, handleAnalyticsError);

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          scheduleResize();
          break;
        }
      }
    });
    if (hostEl.value) resizeObserver.observe(hostEl.value);
    if (tokenChartEl.value) resizeObserver.observe(tokenChartEl.value);
  }

  if (typeof IntersectionObserver !== 'undefined' && hostEl.value) {
    intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          scheduleResize();
          break;
        }
      }
    }, { threshold: 0.05 });
    intersectionObserver.observe(hostEl.value);
  }

  themeObserver = new MutationObserver(() => applyThemeVariables());
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class'],
  });

  mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
  mediaQuery?.addEventListener('change', applyThemeVariables);
});

onBeforeUnmount(() => {
  if (resizeTimer) cancelAnimationFrame(resizeTimer);
  resizeTimer = undefined;
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  intersectionObserver?.disconnect();
  intersectionObserver = undefined;
  themeObserver?.disconnect();
  themeObserver = undefined;
  mediaQuery?.removeEventListener('change', applyThemeVariables);
  mediaQuery = undefined;
  window.removeEventListener('resize', scheduleResize);
  document.removeEventListener('visibilitychange', scheduleResize);
  unsubscribePageAnalytics?.();
  unsubscribePageAnalytics = undefined;
  disposeCharts();
});
</script>

<style>
#chatgpt-analytics-host {
  display: block;
  width: 100%;
  color: var(--color-text, var(--text));
  font-family: var(--font-ui-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  user-select: text;
  box-sizing: border-box;
}

#chatgpt-analytics-host * {
  box-sizing: border-box;
}

.openai-card {
  width: 100%;
  border: 1px solid var(--color-border-subtle, var(--border));
  border-radius: 16px;
  background-color: var(--color-surface, var(--bg-card));
  color: var(--color-text, var(--text));
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
  transition: border-color 0.15s ease;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background-color: var(--color-surface, var(--bg-card));
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.card-header:hover {
  background-color: var(--color-background-primary-ghost-hover, var(--hover));
}

.header-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.header-icon {
  display: flex;
  align-items: center;
  color: var(--color-text-secondary, var(--subtext));
  flex: none;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, var(--text));
  white-space: nowrap;
}

.header-badge {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary, var(--subtext));
  padding: 1px 6px;
  border-radius: 6px;
  background-color: var(--color-surface-secondary, var(--bg-secondary));
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.header-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--color-border-subtle, var(--border));
  border-radius: 8px;
  background-color: var(--color-surface, var(--bg));
  color: var(--color-text, var(--text));
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.header-toggle-btn:hover {
  background-color: var(--color-background-primary-ghost-hover, var(--hover));
}

.card-body {
  padding: 0 18px 18px;
  border-top: 1px solid var(--color-border-subtle, var(--border-subtle));
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
  margin-bottom: 16px;
}

.metric-card {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--color-border-subtle, var(--border-subtle));
  border-radius: 12px;
  background-color: var(--color-surface-secondary, var(--bg-secondary));
}

.metric-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary, var(--subtext));
}

.metric-value {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-text, var(--text));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-range {
  font-size: 13px;
  line-height: 24px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.chart-panel {
  min-width: 0;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--color-border-subtle, var(--border-subtle));
  border-radius: 12px;
  background-color: var(--color-surface, var(--bg));
  box-sizing: border-box;
  overflow: hidden;
}

.chart-panel.full-width {
  grid-column: 1 / -1;
}

.chart-title {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary, var(--subtext));
}

.chart-canvas {
  width: 100%;
  min-width: 0;
  height: var(--chart-height, 260px);
  display: block;
  position: relative;
}

.table-section {
  margin-top: 16px;
}

.table-heading {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, var(--text));
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border-subtle, var(--border-subtle));
  border-radius: 12px;
}

.data-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  background-color: var(--color-surface, var(--bg));
  color: var(--color-text, var(--text));
  font-size: 12px;
}

.data-table th,
.data-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border-subtle, var(--border-subtle));
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.data-table th:first-child,
.data-table td:first-child {
  text-align: left;
}

.data-table thead th {
  background-color: var(--color-surface-secondary, var(--bg-secondary));
  color: var(--color-text-secondary, var(--subtext));
  font-weight: 500;
}

.data-table tbody th {
  font-weight: 500;
}

.data-table tbody tr:last-child th,
.data-table tbody tr:last-child td {
  border-bottom: 0;
}

.data-table tbody tr:hover th,
.data-table tbody tr:hover td {
  background-color: var(--color-background-primary-ghost-hover, var(--hover));
}

.state-loading,
.state-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 36px 8px;
  color: var(--color-text-secondary, var(--subtext));
  font-size: 13px;
}

.loading-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.state-error {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  background-color: rgba(239, 68, 68, 0.05);
  color: #ef4444;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 580px) {
  .card-header {
    padding: 12px 14px;
  }
  .card-body {
    padding: 0 14px 14px;
  }
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .chart-panel.full-width {
    grid-column: auto;
  }
  .chart-canvas {
    height: min(var(--chart-height, 260px), 230px);
  }
}
</style>

<template>
  <div id="chatgpt-analytics-host" ref="hostEl">
    <section class="openai-card" :aria-label="t('panelTitle')">
      <!-- Card Header: 契合 OpenAI 原版卡片头部风格 -->
      <header class="card-header" @click="togglePanel">
        <div class="header-main">
          <span class="header-icon">
            <ChartNoAxesColumn :size="16" :stroke-width="2" aria-hidden="true" />
          </span>
          <span class="header-title">{{ t('panelTitle') }}</span>
          <span v-if="state.data && !state.loading" class="header-badge">
            {{ state.groupBy }}
          </span>
        </div>
        <div class="header-actions" @click.stop>
          <button
            class="header-toggle-btn"
            type="button"
            :title="state.open ? t('collapse') : t('expand')"
            :aria-label="state.open ? t('collapse') : t('expand')"
            @click="togglePanel"
          >
            <span>{{ state.open ? t('collapse') : t('expand') }}</span>
            <component
              :is="state.open ? ChevronUp : ChevronDown"
              :size="14"
              :stroke-width="2"
              aria-hidden="true"
            />
          </button>
        </div>
      </header>

      <!-- Card Body -->
      <div v-show="state.open" class="card-body">
        <div v-if="state.loading" class="state-loading">
          <Loader2 class="loading-spin" :size="18" :stroke-width="2" aria-hidden="true" />
          <span>{{ t('waitingData') }}</span>
        </div>
        <div v-else-if="state.error" class="state-error">{{ state.error }}</div>
        <template v-else-if="state.data">
          <!-- Summary Metrics Cards -->
          <div class="summary-grid">
            <div class="metric-card">
              <div class="metric-label">{{ t('activeUserDays') }}</div>
              <div class="metric-value">{{ state.data.summary.users }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">{{ t('turnCount') }}</div>
              <div class="metric-value">{{ state.data.summary.turns }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">{{ t('activeThreadCount') }}</div>
              <div class="metric-value">{{ state.data.summary.threads }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">{{ t('credits') }}</div>
              <div class="metric-value">{{ state.data.summary.credits }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">{{ t('totalTokens') }}</div>
              <div class="metric-value">{{ state.data.summary.totalTokens }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">{{ t('dateRange') }}</div>
              <div class="metric-value metric-range">{{ state.data.summary.range }}</div>
            </div>
          </div>

          <!-- Charts Area -->
          <div class="charts-grid">
            <div class="chart-panel full-width">
              <div class="chart-title">{{ t('tokenTrend') }}</div>
              <div ref="tokenChartEl" class="chart-canvas"></div>
            </div>
            <div class="chart-panel full-width">
              <div class="chart-title">{{ t('creditsTrend') }}</div>
              <div ref="creditsChartEl" class="chart-canvas"></div>
            </div>
            <div class="chart-panel full-width">
              <div class="chart-title">{{ t('activity') }}</div>
              <div ref="activityChartEl" class="chart-canvas"></div>
            </div>
            <div class="chart-panel">
              <div class="chart-title">{{ t('modelDistribution') }}</div>
              <div ref="modelChartEl" class="chart-canvas"></div>
            </div>
            <div class="chart-panel">
              <div class="chart-title">{{ t('clientDistribution') }}</div>
              <div ref="clientChartEl" class="chart-canvas"></div>
            </div>
          </div>

          <!-- Details Table -->
          <section class="table-section" :aria-label="t('details')">
            <h3 class="table-heading">{{ t('details') }}</h3>
            <div class="table-wrapper">
              <table class="data-table">
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
        <div v-else class="state-empty">{{ t('noData') }}</div>
      </div>
    </section>
  </div>
</template>

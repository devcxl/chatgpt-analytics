import { i18n } from '#i18n';
import type { GroupBy, UsageBucket } from './types';

export interface TimeSeriesPoint {
  date: string;
  label: string;
  threads: number;
  turns: number;
  users: number;
}

export interface TokenUsageSeries {
  date: string[];
  uncachedInput: number[];
  cachedInput: number[];
  output: number[];
  total: number[];
}

export interface ActivitySeries {
  date: string[];
  users: number[];
  threads: number[];
  turns: number[];
}

export interface CreditsSeries {
  date: string[];
  credits: number[];
}

export const MODEL_NAMES: Record<string, string> = {
  'gpt-5': 'GPT-5',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o mini',
  'gpt-4-1': 'GPT-4.1',
  'gpt-4.1': 'GPT-4.1',
  o3: 'o3',
  'o3-mini': 'o3-mini',
  'o4-mini': 'o4-mini',
  codex: 'Codex',
};

function clientLabel(clientId: string): string {
  switch (clientId) {
    case 'web': return i18n.t('clientWeb');
    case 'ios': return i18n.t('clientIos');
    case 'android': return i18n.t('clientAndroid');
    case 'desktop': return i18n.t('clientDesktop');
    case 'api': return i18n.t('clientApi');
    case 'codex': return i18n.t('clientCodex');
    default: return clientId || i18n.t('unknownClient');
  }
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function sortedBuckets(buckets: UsageBucket[]): UsageBucket[] {
  return [...buckets].sort((a, b) => a.date.localeCompare(b.date));
}

/** 把接口数据转换为按日期排序的时间序列。 */
export function toTimeSeries(buckets: UsageBucket[]): TimeSeriesPoint[] {
  return sortedBuckets(buckets).map((bucket) => ({
    date: bucket.date,
    label: bucket.date.slice(5),
    users: numberOrZero(bucket.totals.users),
    threads: numberOrZero(bucket.totals.threads),
    turns: numberOrZero(bucket.totals.turns),
  }));
}

/** Token 消耗：缓存输入、未缓存输入、输出与合计。 */
export function toTokenSeries(buckets: UsageBucket[]): TokenUsageSeries {
  return sortedBuckets(buckets).reduce<TokenUsageSeries>(
    (series, bucket) => {
      series.date.push(bucket.date);
      series.uncachedInput.push(numberOrZero(bucket.totals.uncached_text_input_tokens));
      series.cachedInput.push(numberOrZero(bucket.totals.cached_text_input_tokens));
      series.output.push(numberOrZero(bucket.totals.text_output_tokens));
      series.total.push(numberOrZero(bucket.totals.text_total_tokens));
      return series;
    },
    { date: [], uncachedInput: [], cachedInput: [], output: [], total: [] },
  );
}

/** 活跃度：用户、线程与轮次。 */
export function toActivitySeries(buckets: UsageBucket[]): ActivitySeries {
  return sortedBuckets(buckets).reduce<ActivitySeries>(
    (series, bucket) => {
      series.date.push(bucket.date);
      series.users.push(numberOrZero(bucket.totals.users));
      series.threads.push(numberOrZero(bucket.totals.threads));
      series.turns.push(numberOrZero(bucket.totals.turns));
      return series;
    },
    { date: [], users: [], threads: [], turns: [] },
  );
}

/** 积分消耗。 */
export function toCreditsSeries(buckets: UsageBucket[]): CreditsSeries {
  return sortedBuckets(buckets).reduce<CreditsSeries>(
    (series, bucket) => {
      series.date.push(bucket.date);
      series.credits.push(numberOrZero(bucket.totals.credits));
      return series;
    },
    { date: [], credits: [] },
  );
}

function modelLabel(slug: string): string {
  const value = slug.trim();
  const exact = MODEL_NAMES[value.toLowerCase()];
  if (exact) return exact;
  const lower = value.toLowerCase();
  const prefixes = Object.entries(MODEL_NAMES).sort(([a], [b]) => b.length - a.length);
  for (const [prefix, name] of prefixes) {
    if (lower.startsWith(`${prefix}-`)) return name;
  }
  return value || i18n.t('unknownModel');
}

/** 聚合各模型的轮次数。 */
export function toModelDistribution(
  buckets: UsageBucket[],
): { names: string[]; values: number[] } {
  const values = new Map<string, number>();
  for (const bucket of buckets) {
    for (const model of bucket.models ?? []) {
      const name = modelLabel(model.model);
      values.set(name, (values.get(name) ?? 0) + numberOrZero(model.turns));
    }
  }
  return sortDistribution(values);
}

/** 聚合各客户端的轮次数。 */
export function toClientDistribution(
  buckets: UsageBucket[],
): { names: string[]; values: number[] } {
  const values = new Map<string, number>();
  for (const bucket of buckets) {
    for (const client of bucket.clients ?? []) {
      const key = client.client_id.trim();
      const name = clientLabel(key.toLowerCase());
      values.set(name, (values.get(name) ?? 0) + numberOrZero(client.turns));
    }
  }
  return sortDistribution(values);
}

function sortDistribution(values: Map<string, number>): { names: string[]; values: number[] } {
  return [...values.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .reduce(
      (result, [name, value]) => {
        result.names.push(name);
        result.values.push(value);
        return result;
      },
      { names: [], values: [] } as { names: string[]; values: number[] },
    );
}

/** 汇总统计卡片数据。用户数和线程数为各分组活动值之和，不代表唯一用户或唯一线程。 */
export function toSummary(buckets: UsageBucket[]) {
  const ordered = sortedBuckets(buckets);
  const totals = ordered.reduce(
    (acc, bucket) => {
      acc.users += numberOrZero(bucket.totals.users);
      acc.turns += numberOrZero(bucket.totals.turns);
      acc.threads += numberOrZero(bucket.totals.threads);
      acc.credits += numberOrZero(bucket.totals.credits);
      acc.totalTokens += numberOrZero(bucket.totals.text_total_tokens);
      acc.uncached += numberOrZero(bucket.totals.uncached_text_input_tokens);
      acc.cached += numberOrZero(bucket.totals.cached_text_input_tokens);
      acc.output += numberOrZero(bucket.totals.text_output_tokens);
      return acc;
    },
    { users: 0, turns: 0, threads: 0, credits: 0, totalTokens: 0, uncached: 0, cached: 0, output: 0 },
  );

  const first = ordered[0];
  const last = ordered.at(-1);
  return {
    range: first && last ? `${first.date} ~ ${last.date}` : '',
    users: Math.round(totals.users),
    turns: Math.round(totals.turns),
    threads: Math.round(totals.threads),
    credits: Number(totals.credits.toFixed(2)),
    totalTokens: formatTokens(totals.totalTokens),
    cachedInput: formatTokens(totals.cached),
    uncachedInput: formatTokens(totals.uncached),
    outputTokens: formatTokens(totals.output),
  };
}

/** 格式化 token 数：K / M / B。 */
export function formatTokens(tokens: number): string {
  if (!Number.isFinite(tokens)) return '0';
  const abs = Math.abs(tokens);
  if (abs >= 1e9) return `${(tokens / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(tokens / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(tokens / 1e3).toFixed(1)}K`;
  return String(Math.round(tokens));
}

/** 格式化较大的普通数值。 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(Math.round(value));
}

/** 根据聚合维度返回图表横轴标签。 */
export function labelForGroup(groupBy: GroupBy, date: string): string {
  if (groupBy === 'month') return date.slice(0, 7);
  return date.slice(5);
}

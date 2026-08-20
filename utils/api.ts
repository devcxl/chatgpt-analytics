import {
  ANALYTICS_RESPONSE_BUFFER_ID,
  ANALYTICS_RESPONSE_EVENT,
  type PageAnalyticsResponseMessage,
} from './page-bridge';
import type {
  AnalyticsResponse,
  GroupBy,
  UsageBucket,
  UsageClient,
  UsageModel,
  UsageTotals,
} from './types';

export const CHATGPT_STATS_URL = 'https://chatgpt.com/codex/cloud/settings/analytics#chatgpt-analytics';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readObject(value: unknown, path: string): JsonObject {
  if (!isObject(value)) throw new Error(`统计接口字段 ${path} 格式无效`);
  return value;
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`统计接口字段 ${path} 格式无效`);
  }
  return value;
}

function readNumber(value: unknown, path: string): number {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(number)) throw new Error(`统计接口字段 ${path} 格式无效`);
  return number;
}

function readArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`统计接口字段 ${path} 格式无效`);
  return value;
}

function readOptionalArray(value: unknown, path: string): unknown[] {
  return value == null ? [] : readArray(value, path);
}

function parseTotals(value: unknown, path: string): UsageTotals {
  const totals = readObject(value, path);
  return {
    users: readNumber(totals.users, `${path}.users`),
    threads: readNumber(totals.threads, `${path}.threads`),
    turns: readNumber(totals.turns, `${path}.turns`),
    credits: readNumber(totals.credits, `${path}.credits`),
    uncached_text_input_tokens: readNumber(
      totals.uncached_text_input_tokens,
      `${path}.uncached_text_input_tokens`,
    ),
    cached_text_input_tokens: readNumber(
      totals.cached_text_input_tokens,
      `${path}.cached_text_input_tokens`,
    ),
    text_output_tokens: readNumber(totals.text_output_tokens, `${path}.text_output_tokens`),
    text_total_tokens: readNumber(totals.text_total_tokens, `${path}.text_total_tokens`),
  };
}

function parseClient(value: unknown, path: string): UsageClient {
  const client = readObject(value, path);
  return {
    client_id: readString(client.client_id, `${path}.client_id`),
    users: readNumber(client.users, `${path}.users`),
    threads: readNumber(client.threads, `${path}.threads`),
    turns: readNumber(client.turns, `${path}.turns`),
    credits: readNumber(client.credits, `${path}.credits`),
  };
}

function parseModel(value: unknown, path: string): UsageModel {
  const model = readObject(value, path);
  return {
    model: readString(model.model, `${path}.model`),
    credits: readNumber(model.credits, `${path}.credits`),
    users: readNumber(model.users, `${path}.users`),
    threads: readNumber(model.threads, `${path}.threads`),
    turns: readNumber(model.turns, `${path}.turns`),
  };
}

/** 将未知 JSON 响应归一化为应用内部使用的结构。 */
export function parseAnalyticsResponse(payload: unknown, fallbackGroupBy: string): AnalyticsResponse {
  const response = readObject(payload, 'response');
  const data = readArray(response.data, 'data').map((value, index): UsageBucket => {
    const bucketPath = `data[${index}]`;
    const bucket = readObject(value, bucketPath);
    const clients = readOptionalArray(bucket.clients, `${bucketPath}.clients`)
      .map((client, clientIndex) => parseClient(client, `${bucketPath}.clients[${clientIndex}]`));
    const models = readOptionalArray(bucket.models, `${bucketPath}.models`)
      .map((model, modelIndex) => parseModel(model, `${bucketPath}.models[${modelIndex}]`));

    return {
      date: readString(bucket.date, `${bucketPath}.date`),
      totals: parseTotals(bucket.totals, `${bucketPath}.totals`),
      clients,
      models,
    };
  });

  return {
    data,
    group_by: typeof response.group_by === 'string' ? response.group_by : fallbackGroupBy,
  };
}

function parsePageResponseMessage(raw: string): PageAnalyticsResponseMessage | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value)) return null;
    const url = value.url;
    const status = value.status;
    const groupBy = value.groupBy;
    const body = value.body;
    if (typeof url !== 'string' || typeof status !== 'number') return null;
    if (groupBy !== null && typeof groupBy !== 'string') return null;
    if (typeof body !== 'string') return null;
    return {
      url,
      status,
      groupBy,
      body,
    };
  } catch {
    return null;
  }
}

function isGroupBy(value: unknown): value is GroupBy {
  return value === 'day' || value === 'week' || value === 'month';
}

function parsePageResponse(raw: string): AnalyticsResponse | null {
  const message = parsePageResponseMessage(raw);
  if (!message) return null;
  if (message.status < 200 || message.status >= 300) {
    throw new Error(`页面统计请求返回 ${message.status}`);
  }

  const fallbackGroupBy = isGroupBy(message.groupBy) ? message.groupBy : 'day';
  const analytics = parseAnalyticsResponse(JSON.parse(message.body), fallbackGroupBy);
  return isGroupBy(analytics.group_by) ? analytics : null;
}

/** 订阅当前 Analytics 页面已经发出的统计响应，不由插件主动访问接口。 */
export function subscribeToPageAnalytics(
  onResponse: (response: AnalyticsResponse) => void,
  onError: (error: Error) => void = () => undefined,
): () => void {
  const handleEvent = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (typeof detail !== 'string') return;

    try {
      const response = parsePageResponse(detail);
      if (response) onResponse(response);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('页面统计响应格式无效'));
    }
  };

  document.addEventListener(ANALYTICS_RESPONSE_EVENT, handleEvent);
  const buffered = document.getElementById(ANALYTICS_RESPONSE_BUFFER_ID)?.textContent;
  if (buffered) handleEvent(new CustomEvent(ANALYTICS_RESPONSE_EVENT, { detail: buffered }));

  return () => document.removeEventListener(ANALYTICS_RESPONSE_EVENT, handleEvent);
}

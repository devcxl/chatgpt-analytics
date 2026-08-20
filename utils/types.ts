// ChatGPT 统计接口 `daily-workspace-usage-counts` 的数据类型

/** 单日 / 单分组维度的汇总统计 */
export interface UsageTotals {
  users: number;
  threads: number;
  turns: number;
  credits: number;
  uncached_text_input_tokens: number;
  cached_text_input_tokens: number;
  text_output_tokens: number;
  text_total_tokens: number;
}

export type UsageClient = {
  client_id: string;
  users: number;
  threads: number;
  turns: number;
  credits: number;
};

export type UsageModel = {
  model: string;
  credits: number;
  users: number;
  threads: number;
  turns: number;
};

/** 接口返回的一个分组（默认按天） */
export interface UsageBucket {
  date: string; // ISO 日期 `YYYY-MM-DD`
  totals: UsageTotals;
  clients: UsageClient[];
  models: UsageModel[];
}

/** 接口完整响应 */
export interface AnalyticsResponse {
  data: UsageBucket[];
  group_by: GroupBy | string;
}

export type GroupBy = 'day' | 'week' | 'month';


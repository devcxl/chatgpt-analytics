export const ANALYTICS_API_PATH = '/backend-api/wham/analytics/daily-workspace-usage-counts';
export const ANALYTICS_RESPONSE_EVENT = 'chatgpt-analytics:analytics-response';
export const ANALYTICS_RESPONSE_BUFFER_ID = 'chatgpt-analytics-page-response';

export interface PageAnalyticsResponseMessage {
  url: string;
  status: number;
  groupBy: string | null;
  body: string;
}

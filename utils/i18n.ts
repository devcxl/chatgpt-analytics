export type Locale = 'zh-CN' | 'en';

const messages = {
  'zh-CN': {
    panelTitle: 'ChatGPT 使用统计',
    viewStats: '查看 ChatGPT 统计',
    panelSubtitle: '增强内容会显示在官方统计图表下方',
    popupInstruction: '请打开 ChatGPT 的统计页面查看增强图表和明细表格。',
    openStats: '打开统计页面',
    close: '关闭',
    waitingData: '等待官方统计数据',
    noData: '暂无数据',
    unsupportedGroup: '官方页面返回了不支持的聚合维度：{value}',
    readDataError: '读取官方统计数据失败',
    tokenTrend: 'Token 消耗趋势',
    creditsTrend: '积分消耗趋势',
    activity: '活跃度（用户 / 线程 / 轮次）',
    modelDistribution: '模型分布',
    clientDistribution: '客户端分布',
    uncachedInput: '未缓存输入',
    cachedInput: '缓存输入',
    output: '输出',
    total: '合计',
    users: '用户',
    threads: '线程',
    turns: '轮次',
    credits: '积分',
    activeUserDays: '用户活动日数',
    turnCount: '轮次数',
    activeThreadCount: '线程活动数',
    totalTokens: 'Token 总量',
    dateRange: '统计区间',
    details: '统计明细',
    group: '分组',
  },
  en: {
    panelTitle: 'ChatGPT Usage Analytics',
    viewStats: 'View ChatGPT analytics',
    panelSubtitle: 'Enhanced content appears below the official analytics charts',
    popupInstruction: 'Open the ChatGPT analytics page to view enhanced charts and details.',
    openStats: 'Open analytics page',
    close: 'Close',
    waitingData: 'Waiting for official analytics data',
    noData: 'No data',
    unsupportedGroup: 'The official page returned an unsupported aggregation: {value}',
    readDataError: 'Unable to read official analytics data',
    tokenTrend: 'Token usage trend',
    creditsTrend: 'Credits usage trend',
    activity: 'Activity (users / threads / turns)',
    modelDistribution: 'Model distribution',
    clientDistribution: 'Client distribution',
    uncachedInput: 'Uncached input',
    cachedInput: 'Cached input',
    output: 'Output',
    total: 'Total',
    users: 'Users',
    threads: 'Threads',
    turns: 'Turns',
    credits: 'Credits',
    activeUserDays: 'User activity days',
    turnCount: 'Turns',
    activeThreadCount: 'Thread activity',
    totalTokens: 'Total tokens',
    dateRange: 'Date range',
    details: 'Usage details',
    group: 'Group',
  },
} as const;

export type MessageKey = keyof typeof messages['zh-CN'];

type MessageParams = Record<string, string | number>;

function normalizeLocale(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export function detectPageLocale(): Locale {
  const language = document.documentElement?.getAttribute('lang')
    ?? document.documentElement?.getAttribute('data-language')
    ?? navigator.language;
  return normalizeLocale(language);
}

export function detectBrowserLocale(): Locale {
  return normalizeLocale(navigator.language);
}

export function createTranslator(locale: Locale) {
  const translate = (key: MessageKey, params?: MessageParams): string => {
    const template = messages[locale][key] ?? messages.en[key];
    return template.replace(/\{(\w+)\}/g, (_match, name: string) => String(params?.[name] ?? `{${name}}`));
  };

  return { locale, t: translate };
}

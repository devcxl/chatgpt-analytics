import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  ANALYTICS_API_PATH,
  ANALYTICS_RESPONSE_BUFFER_ID,
  ANALYTICS_RESPONSE_EVENT,
  type PageAnalyticsResponseMessage,
} from '~/utils/page-bridge';

type RequestTarget = {
  url: string;
  groupBy: string | null;
};

const INSTALLATION_KEY = Symbol.for('chatgpt-analytics.analytics-interceptor');
const MAX_RESPONSE_LENGTH = 2_000_000;

function resolveRequestTarget(input: RequestInfo | URL): RequestTarget | null {
  const rawUrl = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
  const url = new URL(rawUrl, window.location.href);

  if (url.origin !== window.location.origin || url.pathname !== ANALYTICS_API_PATH) {
    return null;
  }

  return {
    url: url.href,
    groupBy: url.searchParams.get('group_by'),
  };
}

function writeResponse(message: PageAnalyticsResponseMessage): void {
  const serialized = JSON.stringify(message);
  if (serialized.length > MAX_RESPONSE_LENGTH) return;

  let buffer = document.getElementById(ANALYTICS_RESPONSE_BUFFER_ID);
  if (!buffer) {
    const root = document.documentElement;
    if (!root) return;

    const script = document.createElement('script');
    script.id = ANALYTICS_RESPONSE_BUFFER_ID;
    script.type = 'application/json';
    script.hidden = true;
    script.setAttribute('aria-hidden', 'true');
    root.append(script);
    buffer = script;
  }

  buffer.textContent = serialized;
  document.dispatchEvent(new CustomEvent(ANALYTICS_RESPONSE_EVENT, {
    detail: serialized,
  }));
}

function captureResponse(target: RequestTarget, status: number, body: string): void {
  if (!body || body.length > MAX_RESPONSE_LENGTH) return;
  writeResponse({
    url: target.url,
    status,
    groupBy: target.groupBy,
    body,
  });
}

function installFetchInterceptor(): void {
  const originalFetch = window.fetch.bind(window);
  const interceptedFetch: typeof window.fetch = async (input, init) => {
    const target = resolveRequestTarget(input);
    const response = await originalFetch(input, init);

    if (target) {
      void response.clone().text()
        .then((body) => captureResponse(target, response.status, body))
        .catch((error: unknown) => {
          console.warn('[chatgpt-analytics] 无法读取页面统计响应', error);
        });
    }

    return response;
  };

  window.fetch = interceptedFetch;
}

function installXhrInterceptor(): void {
  const xhrTargets = new WeakMap<XMLHttpRequest, RequestTarget | null>();
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: any[]) {
    xhrTargets.set(this, resolveRequestTarget(args[1]));
    return Reflect.apply(originalOpen, this, args);
  } as typeof XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...args: any[]) {
    const target = xhrTargets.get(this);
    if (target) {
      this.addEventListener('loadend', () => {
        let body = '';
        try {
          if (this.responseType === '' || this.responseType === 'text') {
            body = this.responseText;
          } else if (this.responseType === 'json') {
            body = JSON.stringify(this.response);
          }
        } catch (error) {
          console.warn('[chatgpt-analytics] 无法读取页面统计 XHR 响应', error);
        }
        captureResponse(target, this.status, body);
      }, { once: true });
    }

    return Reflect.apply(originalSend, this, args);
  } as typeof XMLHttpRequest.prototype.send;
}

export default defineContentScript({
  matches: ['https://chatgpt.com/codex/cloud/settings/analytics*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    const pageWindow = window as unknown as Record<PropertyKey, unknown>;
    if (pageWindow[INSTALLATION_KEY] === true) return;
    pageWindow[INSTALLATION_KEY] = true;

    installFetchInterceptor();
    installXhrInterceptor();
  },
});

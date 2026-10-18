import { createApp } from 'vue';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { defineContentScript } from 'wxt/utils/define-content-script';
import App from './App.vue';

// 优先匹配新版 OpenAI Analytics 标签页卡片容器，同时兼容回退选择器与旧版路径
const ANALYTICS_ANCHOR_SELECTOR = 'div[class*="gap-[22px]"], div:not([hidden]) > div.flex.flex-col > div.flex.w-full.flex-col, div.pb-8:nth-child(2)';

/**
 * 官方统计页面路径：新版设置页与旧版 Codex 路径。
 * ChatGPT 是 SPA，路由切换不会重新注入内容脚本，因此必须在运行时按路径判定，
 * 不能依赖 `matches` 完成页面过滤。
 */
const ANALYTICS_PAGE_PATHS = ['/settings/usage', '/codex/cloud/settings/analytics'];

function isAnalyticsPage(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '');
  return ANALYTICS_PAGE_PATHS.includes(path);
}

export default defineContentScript({
  // 必须匹配所有 ChatGPT 页面：SPA 站内跳转不会重新注入内容脚本。
  // 页面过滤由 main() 中的 isAnalyticsPage() 在运行时完成，不再重复声明精确路径。
  matches: ['https://chatgpt.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'chatgpt-analytics',
      position: 'inline',
      anchor: ANALYTICS_ANCHOR_SELECTOR,
      append: 'last',
      isolateEvents: true,
      onMount: (uiContainer, _shadow, shadowHost) => {
        shadowHost.style.display = 'block';
        shadowHost.style.width = '100%';

        const mount = document.createElement('div');
        mount.id = 'chatgpt-analytics-mount';
        uiContainer.append(mount);

        // 官方页面异步重新渲染时，保证增强卡片始终插入在容器末尾
        const container = shadowHost.parentElement ?? document.querySelector(ANALYTICS_ANCHOR_SELECTOR);
        const observer = new MutationObserver(() => {
          if (container?.isConnected && container.lastElementChild !== shadowHost) {
            container.append(shadowHost);
          }
        });
        if (container) observer.observe(container, { childList: true });

        const app = createApp(App);
        app.mount(mount);
        return { app, mount, observer, container };
      },
      onRemove: (mounted) => {
        mounted?.observer.disconnect();
        mounted?.app.unmount();
        mounted?.mount.remove();
      },
    });

    /**
     * 同步面板的挂载状态：
     * - 非统计页（例如普通聊天页）一律不挂载；聊天页也存在满足选择器的通用布局容器，
     *   只看锚点会把面板挂到聊天界面底部。
     * - 统计页等待官方卡片容器渲染完成后再挂载。
     * - 官方卡片容器被整体替换时重新挂载；仅子节点重排时交给 onMount 里的容器观察器处理。
     *
     * `wxt:locationchange` 在 URL 提交前触发，此时 location 仍是旧地址，因此由调用方传入目标路径。
     */
    function syncPanel(pathname = window.location.pathname) {
      const onAnalyticsPage = isAnalyticsPage(pathname);

      if (ui.mounted && (!onAnalyticsPage || !ui.mounted.container?.isConnected)) {
        ui.remove();
      }

      if (ui.mounted || !onAnalyticsPage) return;
      if (!document.querySelector(ANALYTICS_ANCHOR_SELECTOR)) return;

      ui.mount();
    }

    // SPA 路由切换不会重新注入脚本。离开统计页立即卸载；进入统计页时 URL 尚未提交，
    // 交给官方页面渲染后的 DOM 变更挂载，避免把面板挂到上一个页面的布局容器里。
    ctx.addEventListener(window, 'wxt:locationchange', (event) => {
      if (!isAnalyticsPage(event.newUrl.pathname)) syncPanel(event.newUrl.pathname);
    });

    // 统计页的卡片容器由官方页面异步渲染；容器被替换时也需要重新挂载。
    const renderObserver = new MutationObserver(() => syncPanel());
    renderObserver.observe(document.documentElement, { childList: true, subtree: true });
    ctx.onInvalidated(() => renderObserver.disconnect());

    syncPanel();
  },
});

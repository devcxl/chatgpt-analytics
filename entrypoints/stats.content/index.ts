import { createApp } from 'vue';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { defineContentScript } from 'wxt/utils/define-content-script';
import App from './App.vue';

// 优先匹配新版 OpenAI Analytics 标签页卡片容器，同时兼容回退选择器与旧版路径
const ANALYTICS_ANCHOR_SELECTOR = 'div[class*="gap-[22px]"], div:not([hidden]) > div.flex.flex-col > div.flex.w-full.flex-col, div.pb-8:nth-child(2)';

export default defineContentScript({
  matches: [
    'https://chatgpt.com/settings/usage*',
    'https://chatgpt.com/codex/cloud/settings/analytics*',
    'https://chatgpt.com/*',
  ],
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
        return { app, mount, observer };
      },
      onRemove: (mounted) => {
        mounted?.observer.disconnect();
        mounted?.app.unmount();
        mounted?.mount.remove();
      },
    });

    ui.autoMount();
  },
});

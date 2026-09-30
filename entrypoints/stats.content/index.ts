import { createApp } from 'vue';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { defineContentScript } from 'wxt/utils/define-content-script';
import App from './App.vue';

const ANALYTICS_ANCHOR_SELECTOR = 'div.pb-8:nth-child(2)';

export default defineContentScript({
  matches: ['https://chatgpt.com/codex/cloud/settings/analytics*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'chatgpt-analytics',
      position: 'inline',
      anchor: ANALYTICS_ANCHOR_SELECTOR,
      append: 'after',
      isolateEvents: true,
      onMount: (uiContainer, _shadow, shadowHost) => {
        shadowHost.style.display = 'block';
        shadowHost.style.width = '100%';

        const mount = document.createElement('div');
        mount.id = 'chatgpt-analytics-mount';
        uiContainer.append(mount);

        // 官方页面重新渲染会移除注入节点；只要 anchor 仍在，就把它插回原位。
        // WXT 只在 anchor 存在时挂载，因此这里不再重复判空报错。
        const anchor = document.querySelector(ANALYTICS_ANCHOR_SELECTOR);
        const observer = new MutationObserver(() => {
          if (anchor?.isConnected && anchor.nextElementSibling !== shadowHost) {
            anchor.parentElement?.insertBefore(shadowHost, anchor.nextElementSibling);
          }
        });
        if (anchor?.parentElement) observer.observe(anchor.parentElement, { childList: true });

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

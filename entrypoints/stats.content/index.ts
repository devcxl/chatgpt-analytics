import { createApp } from 'vue';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { defineContentScript } from 'wxt/utils/define-content-script';
import App from './App.vue';

const ANALYTICS_ANCHOR_SELECTOR = 'div.pb-8:nth-child(2)';

function findAnalyticsAnchor(): Element | null {
  return document.querySelector(ANALYTICS_ANCHOR_SELECTOR);
}

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
        const anchor = findAnalyticsAnchor();
        if (!anchor) {
          throw new Error(`Analytics anchor not found: ${ANALYTICS_ANCHOR_SELECTOR}`);
        }

        shadowHost.style.display = 'block';
        shadowHost.style.width = '100%';

        const mount = document.createElement('div');
        mount.id = 'chatgpt-analytics-mount';
        uiContainer.append(mount);

        const parent = anchor.parentElement;
        const observer = new MutationObserver(() => {
          if (anchor.isConnected && anchor.nextElementSibling !== shadowHost) {
            anchor.parentElement?.insertBefore(shadowHost, anchor.nextElementSibling);
          }
        });
        if (parent) observer.observe(parent, { childList: true });

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

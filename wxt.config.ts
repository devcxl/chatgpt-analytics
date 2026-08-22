import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-vue', '@wxt-dev/i18n/module'],
  browser: 'chrome',
  manifest: {
    default_locale: 'en',
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
  },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.browser !== 'firefox') return;
      manifest.browser_specific_settings = {
        gecko: {
          id: 'chatgpt-analytics@devcxl.cn',
          strict_min_version: '128.0',
          data_collection_permissions: {
            required: ['none'],
          },
        },
      };
    },
  },
});

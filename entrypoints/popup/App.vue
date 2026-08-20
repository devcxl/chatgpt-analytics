<script setup lang="ts">
import { ChartNoAxesColumn, ExternalLink } from '@lucide/vue';
import { CHATGPT_STATS_URL } from '~/utils/api';
import { createTranslator, detectBrowserLocale } from '~/utils/i18n';

const { locale, t } = createTranslator(detectBrowserLocale());
document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en';

function openStats() {
  window.open(CHATGPT_STATS_URL, '_blank');
}
</script>

<template>
  <main class="popup">
    <header class="popup-header">
      <div class="popup-title">
        <ChartNoAxesColumn class="inline-icon" :size="18" :stroke-width="2" aria-hidden="true" />
        <span>{{ t('panelTitle') }}</span>
      </div>
      <div class="popup-subtitle">{{ t('panelSubtitle') }}</div>
    </header>

    <div class="popup-content">
      <p>{{ t('popupInstruction') }}</p>
      <a href="#" class="link" @click.prevent="openStats">
        <span>{{ t('openStats') }}</span>
        <ExternalLink class="inline-icon" :size="14" :stroke-width="2" aria-hidden="true" />
      </a>
    </div>
  </main>
</template>

<template>
  <div class="paper-sample" :style="style">
    <div class="paper-sample__title">{{ title }}</div>
    <div class="paper-sample__text">{{ text }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { toStyle } from 'src/utils/stationery'

const props = defineProps({
  paper: { type: Object, default: () => ({}) },
  title: { type: String, default: '' },
  text: { type: String, default: 'Today I finally found the time to...' }
})
const style = computed(() => toStyle(props.paper))
</script>

<style scoped>
.paper-sample { border: 2px solid var(--ink); border-radius: 6px; padding: 8px 10px; min-height: 64px; overflow: hidden; }
.paper-sample__title { font-weight: 700; font-size: 13px; }
.paper-sample__text { font-size: 12px; opacity: 0.85; }
</style>

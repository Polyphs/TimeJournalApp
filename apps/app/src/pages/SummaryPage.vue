<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <q-btn flat round dense icon="chevron_left" @click="shift(-1)" />
      <div class="text-subtitle1 text-weight-bold">{{ rangeLabel }}</div>
      <q-btn flat round dense icon="chevron_right" @click="shift(1)" />
    </div>

    <q-banner v-if="isFriday" dense class="bg-white q-mb-md" style="border: 2px solid var(--pen)">
      It's Friday. Here's where your week went.
    </q-banner>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-4 stat"><b>{{ fmtH(sum.productive) }}</b><span>Productive</span></div>
      <div class="col-4 stat"><b>{{ fmtH(sum.passing) }}</b><span>Passing time</span></div>
      <div class="col-4 stat"><b>{{ fmtH(sum.unlogged) }}</b><span>Not logged</span></div>
    </div>

    <div class="text-subtitle2 text-weight-bold q-mb-sm">Time commitments</div>
    <div v-for="b in sum.blocks" :key="b.id" class="q-mb-sm">
      <div class="row justify-between text-body2">
        <span><b :style="{ color: b.color }">{{ b.order }}</b> {{ b.name }}</span><span>{{ fmtH(b.hours) }}</span>
      </div>
      <div class="bar"><div :style="{ width: pct(b.hours, maxBlock) + '%', background: b.color }"></div></div>
    </div>
    <div v-if="sum.goal" class="q-mb-sm">
      <div class="row justify-between text-body2"><span>Goal-driven</span><span>{{ fmtH(sum.goal) }}</span></div>
      <div class="bar"><div :style="{ width: pct(sum.goal, maxBlock) + '%', background: '#16618f' }"></div></div>
    </div>

    <div class="text-subtitle2 text-weight-bold q-mt-lg q-mb-sm">By day</div>
    <div v-for="d in sum.perDay" :key="d.date" class="q-mb-sm">
      <div class="row justify-between text-body2"><span>{{ d.label }}</span><span>{{ fmtH(d.productive) }} productive</span></div>
      <div class="bar">
        <div :style="{ width: pct(d.productive, 18) + '%', background: '#1F9D6E' }"></div>
        <div :style="{ width: pct(d.passing, 18) + '%', background: '#9fb0c9' }"></div>
      </div>
    </div>

    <q-btn class="q-mt-lg full-width" color="primary" unelevated no-caps icon="ios_share" label="Share summary" @click="share" />
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar, copyToClipboard } from 'quasar'
import { useTempoStore } from 'stores/tempo'
import { addDays, weekStart } from 'src/utils/time'
import { fmtH, summarize, summaryText } from 'src/utils/summary'

const $q = useQuasar()
const store = useTempoStore()
const ws = ref(weekStart(new Date()))
const isFriday = new Date().getDay() === 5
const sum = computed(() => summarize(store, ws.value))
const maxBlock = computed(() => Math.max(1, ...sum.value.blocks.map((b) => b.hours), sum.value.goal))
const pct = (v, max) => Math.min(100, (v / max) * 100)
const shift = (n) => { ws.value = addDays(ws.value, n * 7) }
const rangeLabel = computed(() => {
  const f = { day: 'numeric', month: 'short' }
  return `${ws.value.toLocaleDateString(undefined, f)} – ${addDays(ws.value, 6).toLocaleDateString(undefined, f)}`
})

async function share() {
  const text = summaryText(sum.value, rangeLabel.value)
  if (navigator.share) { try { await navigator.share({ text }); return } catch (e) { /* cancelled */ } }
  await copyToClipboard(text)
  $q.notify({ message: 'Summary copied', timeout: 2000 })
}
</script>

<template>
  <router-view />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useTempoStore } from 'stores/tempo'
import { initNative, reschedule, startTicker, webNotify } from 'src/services/notify'
import { isNative } from 'src/services/notify'
import { lastEndedSlot, resolveEndedSlot, slotLabel } from 'src/utils/time'

const $q = useQuasar()
const router = useRouter()
const store = useTempoStore()
let stopTicker = () => {}

function goLog(date, idx) { router.push({ name: 'log', query: { date, idx } }) }

// Handles taps / action buttons on native notifications
function perform(actionId, extra) {
  if (extra.type === 'prompt') {
    const date = resolveEndedSlot(extra.idx)
    if (actionId === 'productive' || actionId === 'passing') store.setSlot(date, extra.idx, { kind: actionId })
    else if (store.settings.promptMode === 'quick') router.push({ name: 'week' })
    else goLog(date, extra.idx)
  } else if (extra.type === 'summary') router.push({ name: 'summary' })
  else if (extra.type === 'plan') goLog(extra.date, extra.idx)
}

// In-app prompt for web (and anything running in the foreground)
function onTick(now) {
  const s = store.settings
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  if (now.getDay() === 5 && hhmm === s.summaryTime) {
    webNotify('Your week in time', 'See where your hours went this week.')
    $q.notify({ message: 'Your week in time is ready', timeout: 15000, actions: [{ label: 'View', color: 'white', handler: () => router.push({ name: 'summary' }) }] })
  }
  const t = lastEndedSlot(now)
  if (!t) return
  webNotify('How were the last 30 minutes?', slotLabel(t.idx))
  const quick = s.promptMode !== 'full'
  const actions = []
  if (quick) {
    actions.push({ label: 'Productive', color: 'white', handler: () => store.setSlot(t.date, t.idx, { kind: 'productive' }) })
    actions.push({ label: 'Passing', color: 'white', handler: () => store.setSlot(t.date, t.idx, { kind: 'passing' }) })
  }
  if (s.promptMode !== 'quick') actions.push({ label: s.promptMode === 'full' ? 'Log it' : 'Details', color: 'amber', handler: () => goLog(t.date, t.idx) })
  $q.notify({ message: `Last 30 min (${slotLabel(t.idx)})?`, position: 'top', timeout: 30000, color: 'primary', actions })
}

onMounted(async () => {
  await store.initAuth()
  initNative(perform)
  if (!isNative) stopTicker = startTicker(onTick)
  reschedule(store)
})
onBeforeUnmount(() => stopTicker())
</script>

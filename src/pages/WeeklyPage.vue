<template>
  <q-page>
    <div class="row items-center justify-between q-px-sm q-pt-sm">
      <q-btn flat round dense icon="chevron_left" @click="shift(-1)" />
      <div class="text-subtitle2 text-weight-bold">{{ rangeLabel }}</div>
      <div>
        <q-btn flat dense no-caps label="Today" @click="ws = weekStart(new Date())" />
        <q-btn flat round dense icon="chevron_right" @click="shift(1)" />
      </div>
    </div>

    <div class="chip-scroll">
      <q-chip v-for="b in store.blocks" :key="b.id" dense square outline :style="{ color: b.color }" class="text-weight-bold">
        {{ b.order }} · {{ b.name }}
      </q-chip>
    </div>

    <div class="week q-mx-sm">
      <div class="head" style="border-right: 2px solid var(--ink)"></div>
      <div v-for="(d, i) in days" :key="d.date" class="head" :class="{ today: d.date === todayKey }">
        {{ DAY_NAMES[i] }}<br />{{ d.num }}
      </div>

      <template v-for="idx in SLOT_COUNT" :key="idx">
        <div class="time" :class="{ hour: (idx - 1) % 2 === 0 }">{{ (idx - 1) % 2 === 0 ? fmtMin(slotStartMin(idx - 1)) : '' }}</div>
        <div
          v-for="d in days" :key="d.date + idx"
          class="cell" :class="cellClass(d.date, idx - 1)" :style="cellStyle(d.date, idx - 1)"
          @click="open(d.date, idx - 1)"
        >{{ cellText(d.date, idx - 1) }}</div>
      </template>
    </div>

    <div class="text-caption text-grey-7 q-pa-md">
      Tap a past slot to log it. Tap a future slot to pre-block a focus block and get reminded when it starts.
    </div>

    <q-dialog v-model="dialog">
      <q-card style="width: 420px; max-width: 94vw">
        <SlotEditor v-if="dialog" :date="target.date" :idx="target.idx" :mode="target.mode" @done="dialog = false" />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import SlotEditor from 'components/SlotEditor.vue'
import { useTempoStore } from 'stores/tempo'
import { reschedule } from 'src/services/notify'
import { watch } from 'vue'
import { DAY_NAMES, SLOT_COUNT, addDays, dateKey, fmtMin, slotAt, slotStartDate, slotStartMin, weekStart } from 'src/utils/time'

const store = useTempoStore()
const ws = ref(weekStart(new Date()))
const dialog = ref(false)
const target = reactive({ date: '', idx: 0, mode: 'log' })
const todayKey = dateKey(new Date())

const days = computed(() => Array.from({ length: 7 }, (_, i) => { const d = addDays(ws.value, i); return { date: dateKey(d), num: d.getDate() } }))
const rangeLabel = computed(() => {
  const a = ws.value, b = addDays(a, 6), f = { day: 'numeric', month: 'short' }
  return `${a.toLocaleDateString(undefined, f)} – ${b.toLocaleDateString(undefined, f)}`
})
const shift = (n) => { ws.value = addDays(ws.value, n * 7) }

const isFuture = (date, idx) => slotStartDate(date, idx) > new Date()
const nowSlot = () => { const n = new Date(); return { date: dateKey(n), idx: slotAt(n) } }

function cellClass(date, idx) {
  const s = store.slot(date, idx)
  const p = store.planned(date, idx)
  const n = nowSlot()
  return [
    idx % 2 === 0 ? 'hour' : '',
    isFuture(date, idx) ? 'future' : '',
    n.date === date && n.idx === idx ? 'now' : '',
    s ? s.kind : p && !s ? 'plan' : ''
  ]
}
function cellStyle(date, idx) {
  const s = store.slot(date, idx)
  const p = store.planned(date, idx)
  if (s?.kind === 'focus') return { background: store.blockById(s.blockId)?.color || '#6B7A8C' }
  if (!s && p) return { color: store.blockById(p.blockId)?.color || '#6B7A8C' }
  return {}
}
function cellText(date, idx) {
  const s = store.slot(date, idx)
  const p = store.planned(date, idx)
  if (s) return s.kind === 'focus' ? store.blockById(s.blockId)?.order : s.kind === 'goal' ? 'G' : s.kind === 'productive' ? '✓' : '·'
  return p ? store.blockById(p.blockId)?.order : ''
}
function open(date, idx) {
  Object.assign(target, { date, idx, mode: isFuture(date, idx) ? 'plan' : 'log' })
  dialog.value = true
}

// plans changed → refresh upcoming reminders
watch(() => store.plannedList.length, () => reschedule(store))
</script>

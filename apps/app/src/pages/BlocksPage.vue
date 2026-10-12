<template>
  <q-page class="q-pa-md">
    <q-banner v-if="readyToRearrange" dense class="bg-white q-mb-md" style="border: 2px solid var(--pen)">
      You've logged {{ store.loggedDates.length }} days. Use the hours below to reorder your focus blocks, then pre-block time on the Week tab.
    </q-banner>
    <div v-else class="text-body2 text-grey-8 q-mb-md">
      Log for a week, then come back here to reorder blocks by how you actually spend your time.
    </div>

    <div v-for="(b, i) in rows" :key="b.id" class="row items-center q-mb-sm no-wrap" style="border-bottom: 1px solid var(--rule); padding-bottom: 8px">
      <span class="blockbtn" style="width: auto; border: 0; padding: 0; box-shadow: none; cursor: default">
        <span class="num" :style="{ background: b.color }">{{ b.order }}</span>
      </span>
      <div class="col q-ml-sm">
        <q-input
          :model-value="drafts[b.id] ?? b.name" dense borderless input-class="text-weight-medium"
          @update:model-value="(v) => (drafts[b.id] = v)" @blur="commit(b)" @keyup.enter="$event.target.blur()"
        />
        <div v-if="store.pastTitles(b.id).length" class="text-caption text-grey-7">Earlier: {{ store.pastTitles(b.id).join(' · ') }}</div>
      </div>
      <span class="text-caption text-grey-7 q-mr-sm" style="min-width: 40px; text-align: right">{{ fmtH(b.hours) }}</span>
      <q-btn flat round dense icon="palette" :style="{ color: b.color }">
        <q-popup-proxy>
          <div class="row q-pa-sm q-gutter-xs" style="width: 180px">
            <div v-for="c in BLOCK_COLORS" :key="c" :style="{ background: c, width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }" @click="store.saveBlock(b.id, { color: c })" />
          </div>
        </q-popup-proxy>
      </q-btn>
      <q-btn flat round dense icon="arrow_upward" :disable="i === 0" @click="store.moveBlock(b.id, -1)" />
      <q-btn flat round dense icon="arrow_downward" :disable="i === rows.length - 1" @click="store.moveBlock(b.id, 1)" />
    </div>
    <div class="text-caption text-grey-7 q-mt-sm">Hours are the last 7 days. Reordering changes the block numbers shown everywhere, and past logs keep the title the block had when you logged them. Rename a block once its task is done to reuse it.</div>
  </q-page>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { BLOCK_COLORS, useTempoStore } from 'stores/tempo'
import { addDays, dateKey } from 'src/utils/time'
import { fmtH } from 'src/utils/summary'

const store = useTempoStore()
const drafts = reactive({})
// Titles are committed on blur/Enter (not per keystroke) so each rename is one history entry.
function commit(b) {
  const v = drafts[b.id]
  delete drafts[b.id]
  if (v !== undefined) store.saveBlock(b.id, { name: v })
}
const readyToRearrange = computed(() => store.loggedDates.length >= 7)

const rows = computed(() => {
  const since = dateKey(addDays(new Date(), -6))
  const hours = {}
  Object.values(store.records).forEach((r) => {
    if (r.kind === 'slot' && !r.deleted && r.data.kind === 'focus' && r.data.date >= since) {
      const k = `${r.data.blockId}|${store.slotTitle(r.data)}`
      hours[k] = (hours[k] || 0) + 0.5
    }
  })
  // hours shown are for the block's current title only
  return store.blocks.map((b) => ({ ...b, hours: hours[`${b.id}|${b.name}`] || 0 }))
})
</script>

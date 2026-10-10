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
      <q-input :model-value="b.name" dense borderless class="col q-ml-sm" input-class="text-weight-medium" @update:model-value="(v) => store.saveBlock(b.id, { name: v })" />
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
    <div class="text-caption text-grey-7 q-mt-sm">Hours are the last 7 days. Reordering changes the block numbers shown everywhere, and past logs follow the block.</div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { BLOCK_COLORS, useTempoStore } from 'stores/tempo'
import { addDays, dateKey } from 'src/utils/time'
import { fmtH } from 'src/utils/summary'

const store = useTempoStore()
const readyToRearrange = computed(() => store.loggedDates.length >= 7)

const rows = computed(() => {
  const since = dateKey(addDays(new Date(), -6))
  const hours = {}
  Object.values(store.records).forEach((r) => {
    if (r.kind === 'slot' && !r.deleted && r.data.kind === 'focus' && r.data.date >= since) hours[r.data.blockId] = (hours[r.data.blockId] || 0) + 0.5
  })
  return store.blocks.map((b) => ({ ...b, hours: hours[b.id] || 0 }))
})
</script>

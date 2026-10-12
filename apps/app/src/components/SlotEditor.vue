<template>
  <div class="q-pa-md">
    <div class="text-subtitle1 text-weight-bold">{{ dayLabel }}</div>
    <div class="text-body2 text-grey-7 q-mb-md">{{ slotLabel(idx) }}{{ mode === 'plan' ? ' · plan a focus block' : '' }}</div>

    <template v-if="mode === 'log'">
      <q-btn-toggle
        v-model="kind" spread no-caps unelevated toggle-color="primary" color="white" text-color="primary"
        class="q-mb-md" style="border: 2px solid var(--ink)"
        :options="[
          { label: 'Focus block', value: 'focus' },
          { label: 'Goal', value: 'goal' },
          { label: 'Productive', value: 'productive' },
          { label: 'Passing', value: 'passing' }
        ]"
      />
    </template>

    <div v-if="mode === 'plan' || kind === 'focus'" class="q-gutter-y-sm q-mb-md">
      <button v-for="b in store.blocks" :key="b.id" class="blockbtn" :class="{ on: blockId === b.id }" @click="blockId = b.id">
        <span class="num" :style="{ background: b.color }">{{ b.order }}</span>
        <span>{{ b.name }}</span>
      </button>
    </div>

    <q-input
      v-if="mode === 'log' && (kind === 'goal' || kind === 'productive' || kind === 'focus')"
      v-model="note" outlined dense autogrow
      :label="kind === 'goal' ? 'Which goal? (optional)' : 'What did you do? (optional)'"
      class="q-mb-md"
    />

    <div class="row q-gutter-sm">
      <q-btn v-if="mode === 'log'" color="primary" no-caps unelevated label="Save" :disable="kind === 'focus' && !blockId" @click="save" />
      <q-btn v-else color="primary" no-caps unelevated label="Pre-block this time" :disable="!blockId" @click="save" />
      <q-btn v-if="hasExisting" flat no-caps color="secondary" label="Clear" @click="clear" />
      <q-btn flat no-caps label="Cancel" @click="$emit('done')" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useTempoStore } from 'stores/tempo'
import { DAY_NAMES, parseKey, slotLabel } from 'src/utils/time'

const props = defineProps({ date: String, idx: Number, mode: { type: String, default: 'log' } })
const emit = defineEmits(['done'])
const store = useTempoStore()

const existing = props.mode === 'log' ? store.slot(props.date, props.idx) : store.planned(props.date, props.idx)
const plan = store.planned(props.date, props.idx)
const kind = ref(existing?.kind || (plan ? 'focus' : 'productive'))
const blockId = ref(existing?.blockId || plan?.blockId || null)
const note = ref(existing?.note || '')
const hasExisting = computed(() => !!existing)

const dayLabel = computed(() => {
  const d = parseKey(props.date)
  return `${DAY_NAMES[(d.getDay() + 6) % 7]}, ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
})

function save() {
  if (props.mode === 'plan') store.setPlanned(props.date, props.idx, blockId.value)
  else store.setSlot(props.date, props.idx, { kind: kind.value, blockId: kind.value === 'focus' ? blockId.value : null, note: kind.value === 'passing' ? '' : note.value })
  emit('done')
}
function clear() {
  if (props.mode === 'plan') store.clearPlanned(props.date, props.idx)
  else store.clearSlot(props.date, props.idx)
  emit('done')
}
</script>

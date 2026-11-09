<template>
  <div class="q-pa-md">
    <div class="row items-start no-wrap">
      <div class="col">
        <div class="text-subtitle1 text-weight-bold">{{ multi ? `${slotList.length} slots` : dayLabel }}</div>
        <div v-if="!multi" class="text-body2 text-grey-7 q-mb-md">{{ slotLabel(slotList[0].idx) }}{{ mode === 'plan' ? ' · plan a focus block' : '' }}</div>
        <div v-else class="text-body2 text-grey-7 q-mb-md">
          <div v-for="(l, i) in lines" :key="i">{{ l }}</div>
          <div v-if="mode === 'plan'">Plan a focus block for all of them</div>
        </div>
      </div>
      <q-btn
        v-if="mode === 'log' && showsNote" flat round dense icon="palette" aria-label="Choose stationery" title="Choose stationery"
      >
        <q-menu anchor="bottom right" self="top right">
          <StationeryPicker :model-value="paperId" @update:model-value="pickPaper" />
        </q-menu>
      </q-btn>
    </div>

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

    <div v-if="mode === 'log' && showsNote" class="q-mb-md">
      <div class="row items-center justify-between q-mb-xs">
        <div class="text-caption text-grey-8">{{ kind === 'goal' ? 'Which goal? (optional)' : 'What did you do? (optional)' }}</div>
        <q-btn-toggle
          :model-value="rich" dense no-caps unelevated toggle-color="primary" color="white" text-color="primary" size="sm"
          style="border: 1px solid var(--ink)"
          :options="[{ label: 'Journal', value: true }, { label: 'Single line', value: false }]"
          @update:model-value="setRich"
        />
      </div>
      <div class="journal-paper" :style="paperStyle">
        <q-editor
          v-if="rich" v-model="noteHtml" flat dense placeholder="Write freely. Add a line, a list, or a thought."
          min-height="150px" max-height="38vh" class="journal-editor" :toolbar="toolbar"
          :content-style="paperStyle" toolbar-bg="transparent" toolbar-text-color="primary" toolbar-toggle-color="secondary"
        />
        <q-input
          v-else v-model="noteText" borderless dense autofocus class="q-px-sm" placeholder="One line"
          :input-style="{ color: paperStyle.color, fontFamily: paperStyle.fontFamily }"
        />
      </div>
    </div>

    <div class="row q-gutter-sm">
      <q-btn v-if="mode === 'log'" color="primary" no-caps unelevated :label="multi ? `Save ${slotList.length} slots` : 'Save'" :disable="kind === 'focus' && !blockId" @click="save" />
      <q-btn v-else color="primary" no-caps unelevated :label="multi ? `Pre-block ${slotList.length} slots` : 'Pre-block this time'" :disable="!blockId" @click="save" />
      <q-btn v-if="hasExisting" flat no-caps color="secondary" :label="multi ? 'Clear all' : 'Clear'" @click="clear" />
      <q-btn flat no-caps label="Cancel" @click="$emit('done')" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import StationeryPicker from 'components/StationeryPicker.vue'
import { useTempoStore } from 'stores/tempo'
import { DAY_NAMES, parseKey, slotLabel } from 'src/utils/time'
import { describeSlots } from 'src/utils/selection'
import { toStyle } from 'src/utils/stationery'
import { htmlToText, sanitizeHtml, textToHtml } from 'src/utils/richtext'

const props = defineProps({
  date: String,
  idx: Number,
  slots: { type: Array, default: null }, // [{ date, idx }, ...] to journal several slots together
  mode: { type: String, default: 'log' }
})
const emit = defineEmits(['done'])
const store = useTempoStore()

const slotList = computed(() => (props.slots && props.slots.length ? props.slots : [{ date: props.date, idx: props.idx }]))
const multi = computed(() => slotList.value.length > 1)
const lines = computed(() => describeSlots(slotList.value))

const lookup = (s) => (props.mode === 'log' ? store.slot(s.date, s.idx) : store.planned(s.date, s.idx))
const existingAll = slotList.value.map(lookup).filter(Boolean)
const existing = existingAll[0] || null
const plan = store.planned(slotList.value[0].date, slotList.value[0].idx)
const hasExisting = computed(() => existingAll.length > 0)

const kind = ref(existing?.kind || (plan ? 'focus' : 'productive'))
const blockId = ref(existing?.blockId || plan?.blockId || null)
const showsNote = computed(() => kind.value === 'goal' || kind.value === 'productive' || kind.value === 'focus')

// notes: rich "journal" editor (HTML) or a single line of text
const rich = ref(existing?.html ? true : store.settings.richNotes)
const noteHtml = ref(existing?.html ? sanitizeHtml(existing.html) : textToHtml(existing?.note || ''))
const noteText = ref(existing?.note || '')
function setRich(v) {
  if (v === rich.value) return
  if (v) noteHtml.value = textToHtml(noteText.value)
  else noteText.value = htmlToText(noteHtml.value).replace(/\s*\n+\s*/g, ' ')
  rich.value = v
  store.saveSettings({ richNotes: v })
}
const toolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  ['unordered', 'ordered'],
  ['quote', 'link'],
  ['removeFormat'],
  ['undo', 'redo']
]

// stationery: remembered per entry, and as the default for the next one
const paperId = ref(existing?.paper || store.settings.stationeryId)
const paperStyle = computed(() => toStyle(store.stationeryById(paperId.value).paper))
function pickPaper(id) {
  paperId.value = id
  store.saveSettings({ stationeryId: id })
}

const dayLabel = computed(() => {
  const d = parseKey(slotList.value[0].date)
  return `${DAY_NAMES[(d.getDay() + 6) % 7]}, ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
})

function noteFields() {
  if (kind.value === 'passing' || !showsNote.value) return { note: '', html: '', paper: '' }
  if (rich.value) {
    const html = sanitizeHtml(noteHtml.value)
    const text = htmlToText(html)
    return text ? { note: text, html, paper: paperId.value } : { note: '', html: '', paper: '' }
  }
  const text = noteText.value.trim()
  return text ? { note: text, html: '', paper: paperId.value } : { note: '', html: '', paper: '' }
}

function save() {
  if (props.mode === 'plan') store.setPlannedMany(slotList.value, blockId.value)
  else store.setSlots(slotList.value, { kind: kind.value, blockId: kind.value === 'focus' ? blockId.value : null, ...noteFields() })
  emit('done')
}
function clear() {
  if (props.mode === 'plan') store.clearPlannedMany(slotList.value)
  else store.clearSlots(slotList.value)
  emit('done')
}
</script>

<style scoped>
.journal-paper { border: 2px solid var(--ink); border-radius: 6px; overflow: hidden; }
.journal-editor { background: transparent; border: 0; }
.journal-editor :deep(.q-editor__toolbar) { border-bottom: 1px solid rgba(27, 36, 51, 0.25); background: rgba(255, 255, 255, 0.55); }
.journal-editor :deep(.q-editor__content) { background: transparent; }
</style>

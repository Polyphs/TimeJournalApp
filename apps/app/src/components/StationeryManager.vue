<template>
  <div>
    <div class="text-subtitle2 text-weight-bold q-mb-xs">Journal stationery</div>
    <div class="text-caption text-grey-7 q-mb-sm">
      The paper behind your journal notes. Stationery is plain text (JSON or CSS), so you can share it as a snippet or a link.
    </div>

    <div class="paper-grid q-mb-sm">
      <div v-for="p in store.stationeryList" :key="p.id" class="paper-card">
        <PaperSample :paper="p.paper" :title="p.name" />
        <div class="row items-center q-mt-xs no-wrap">
          <q-radio :model-value="s.stationeryId" :val="p.id" dense label="Default" size="sm" @update:model-value="(v) => store.saveSettings({ stationeryId: v })" />
          <q-space />
          <q-btn flat dense round size="sm" icon="content_copy" title="Copy as JSON" aria-label="Copy as JSON" @click="copy(p)" />
          <q-btn v-if="p.custom" flat dense round size="sm" icon="delete" title="Remove" aria-label="Remove" @click="remove(p)" />
        </div>
      </div>
    </div>

    <div class="row q-gutter-sm q-mb-sm">
      <q-btn color="primary" unelevated no-caps icon="add" label="Add stationery" @click="openAdd" />
      <q-btn flat no-caps icon="travel_explore" :label="galleryOpen ? 'Hide gallery' : 'Browse gallery'" @click="galleryOpen = !galleryOpen" />
    </div>

    <div v-if="galleryOpen" class="q-mb-sm">
      <div v-if="!gallery.length" class="text-caption text-grey-7">You have added everything in the gallery.</div>
      <div class="paper-grid">
        <div v-for="p in gallery" :key="p.id" class="paper-card">
          <PaperSample :paper="p.paper" :title="p.name" />
          <q-btn flat dense no-caps size="sm" color="primary" icon="add" label="Add" class="q-mt-xs" @click="addFromGallery(p)" />
        </div>
      </div>
    </div>

    <q-dialog v-model="addOpen">
      <q-card style="width: 560px; max-width: 94vw">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Add stationery</div>
          <q-tabs v-model="tab" dense no-caps active-color="secondary" indicator-color="secondary" align="left" class="q-mb-sm">
            <q-tab name="paste" label="Paste JSON or CSS" />
            <q-tab name="link" label="From a link" />
          </q-tabs>

          <div v-if="tab === 'link'" class="q-mb-sm">
            <q-input v-model="url" dense outlined label="https:// link to a stationery JSON or CSS file" :loading="fetching" @keyup.enter="fetchUrl">
              <template #append><q-btn flat dense no-caps label="Fetch" @click="fetchUrl" /></template>
            </q-input>
            <div class="text-caption text-grey-7 q-mt-xs">The site must allow other sites to read the file (for example a raw GitHub file).</div>
          </div>

          <q-input
            v-model="text" type="textarea" outlined autogrow :input-style="{ minHeight: '140px', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '12px' }"
            :label="tab === 'paste' ? 'JSON or CSS' : 'What was fetched'" spellcheck="false"
          />
          <div class="row items-center q-mt-xs">
            <q-btn flat dense no-caps size="sm" label="Insert an example" @click="text = SAMPLE_JSON; tab = 'paste'" />
          </div>

          <div v-if="text.trim()" class="q-mt-sm">
            <div v-if="parsed.errors.length" class="text-negative text-caption">
              <div v-for="e in parsed.errors" :key="e">{{ e }}</div>
            </div>
            <div v-if="parsed.warnings.length" class="text-grey-7 text-caption">
              <div v-for="e in parsed.warnings" :key="e">{{ e }}</div>
            </div>
            <PaperSample v-if="parsed.ok" :paper="parsed.value.paper" :title="parsed.value.name" class="q-mt-xs" />
            <div v-if="parsed.ok && hasRemoteImage" class="text-caption text-grey-7 q-mt-xs">
              This paper loads a background image from the internet. The site that hosts it can see that you opened it.
            </div>
          </div>
          <div class="text-caption text-grey-7 q-mt-sm">
            Supported: backgroundColor, backgroundImage (gradients, or a url(https://...) link), backgroundSize, backgroundRepeat, backgroundPosition, color, fontFamily, fontSize, lineHeight, letterSpacing, paddingLeft.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn color="primary" unelevated no-caps label="Add" :disable="!parsed.ok" @click="addParsed" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { copyToClipboard, useQuasar } from 'quasar'
import PaperSample from 'components/PaperSample.vue'
import { useTempoStore } from 'stores/tempo'
import { GALLERY_STATIONERY, SAMPLE_JSON, parseStationery, stationeryToJson } from 'src/utils/stationery'

const $q = useQuasar()
const store = useTempoStore()
const s = computed(() => store.settings)

const galleryOpen = ref(false)
const gallery = computed(() => {
  const have = new Set(store.stationeryList.map((p) => p.id))
  return GALLERY_STATIONERY.filter((p) => !have.has(p.id))
})
function addFromGallery(p) {
  store.addStationery(p)
  $q.notify({ message: `Added ${p.name}`, timeout: 1800 })
}

const addOpen = ref(false)
const tab = ref('paste')
const text = ref('')
const url = ref('')
const fetching = ref(false)
const parsed = computed(() => parseStationery(text.value))
const hasRemoteImage = computed(() => parsed.value.ok && /url\(/i.test(JSON.stringify(parsed.value.value.paper)))

function openAdd() { text.value = ''; url.value = ''; tab.value = 'paste'; addOpen.value = true }
function addParsed() {
  if (!parsed.value.ok) return
  store.addStationery(parsed.value.value)
  addOpen.value = false
  $q.notify({ message: `Added ${parsed.value.value.name}`, timeout: 1800 })
}
async function fetchUrl() {
  const u = url.value.trim()
  if (!/^https:\/\//i.test(u)) { $q.notify({ type: 'warning', message: 'Use a link that starts with https://' }); return }
  fetching.value = true
  try {
    const res = await fetch(u, { credentials: 'omit' })
    if (!res.ok) throw new Error(`The link answered with ${res.status}`)
    const body = await res.text()
    if (body.length > 8000) throw new Error('That file is too large for stationery')
    text.value = body
  } catch (e) {
    $q.notify({ type: 'negative', message: `Could not fetch: ${e.message}` })
  } finally {
    fetching.value = false
  }
}
async function copy(p) {
  try { await copyToClipboard(stationeryToJson(p)); $q.notify({ message: 'Copied as JSON', timeout: 1500 }) } catch (e) { $q.notify({ type: 'warning', message: 'Could not copy' }) }
}
function remove(p) {
  $q.dialog({ title: 'Remove stationery', message: `Remove "${p.name}"? Entries that used it will show the default paper.`, cancel: true, persistent: false })
    .onOk(() => store.removeStationery(p.id))
}
</script>

<style scoped>
.paper-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
</style>

<template>
  <q-dialog v-model="open" persistent>
    <q-card style="width: 420px; max-width: 94vw">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold">Use these as your blocks?</div>
        <div class="text-caption text-grey-7">From the timejournal page. They become the first {{ items.length }} blocks in the Blocks tab. Earlier titles stay in each block's history.</div>
      </q-card-section>
      <q-list dense class="q-px-sm">
        <q-item v-for="(t, i) in items" :key="i">
          <q-item-section avatar><q-avatar size="24px" color="primary" text-color="white">{{ i + 1 }}</q-avatar></q-item-section>
          <q-item-section>{{ t }}</q-item-section>
        </q-item>
      </q-list>
      <q-card-actions align="right">
        <q-btn flat no-caps label="Not now" @click="close" />
        <q-btn unelevated no-caps color="secondary" label="Add as blocks" @click="apply" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTempoStore } from 'stores/tempo'

const route = useRoute()
const router = useRouter()
const store = useTempoStore()
const open = ref(false)
const items = ref([])

// ?blocks= carries a base64url JSON array of up to 8 short titles, set by the timejournal page.
function decode(raw) {
  try {
    const b64 = String(raw).replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(escape(atob(b64)))
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return []
    return arr.filter((t) => typeof t === 'string').map((t) => t.trim().slice(0, 80)).filter(Boolean).slice(0, 8)
  } catch (e) { return [] }
}

function check() {
  const raw = route.query.blocks
  if (!raw) return
  const list = decode(Array.isArray(raw) ? raw[0] : raw)
  if (list.length) { items.value = list; open.value = true } else clearQuery()
}
function clearQuery() {
  const { blocks, ...rest } = route.query
  router.replace({ query: rest })
}
function close() { open.value = false; clearQuery() }
function apply() {
  const blocks = store.blocks
  items.value.forEach((name, i) => { if (blocks[i]) store.saveBlock(blocks[i].id, { name }) })
  close()
  router.push({ name: 'blocks' })
}

onMounted(check)
watch(() => route.query.blocks, check)
</script>

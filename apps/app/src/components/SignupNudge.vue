<template>
  <q-banner v-if="visible" dense class="bg-white text-primary signup-nudge">
    <template #avatar><q-icon name="cloud_sync" color="secondary" /></template>
    <b>Sign up to save and sync your progress.</b>
    Your log is only on this device until you do.
    <template #action>
      <q-btn flat no-caps dense label="Not now" @click="dismiss" />
      <q-btn unelevated no-caps dense color="secondary" label="Sign up" class="q-px-sm" @click="go" />
    </template>
  </q-banner>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTempoStore } from 'stores/tempo'
import { supabase } from 'src/services/supabase'

// Ask after the user has seen value: first at 3 logged slots, once more at a full day (48 slots).
const THRESHOLDS = [3, 48]
const LS_KEY = 'tempo30:signupNudge'

const store = useTempoStore()
const router = useRouter()

const readDismissed = () => {
  try { return Number(localStorage.getItem(LS_KEY) || 0) } catch (e) { return 0 }
}
const dismissed = ref(readDismissed())

const logged = computed(() => Object.values(store.records).filter((r) => r.kind === 'slot' && !r.deleted).length)
const due = computed(() => THRESHOLDS.filter((t) => logged.value >= t).pop() || 0)
const visible = computed(() => !!supabase && !store.user && due.value > dismissed.value)

function dismiss() {
  dismissed.value = due.value
  try { localStorage.setItem(LS_KEY, String(due.value)) } catch (e) { /* storage unavailable */ }
}
function go() {
  router.push({ name: 'settings', query: { signup: '1' } })
}
</script>

<style scoped>
.signup-nudge { border-bottom: 1px solid var(--rule-strong); }
</style>

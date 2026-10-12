<template>
  <q-page class="q-pa-md">
    <div class="text-subtitle2 text-weight-bold q-mb-sm">30-minute prompt</div>
    <q-btn-toggle
      :model-value="s.promptMode" spread no-caps unelevated toggle-color="primary" color="white" text-color="primary"
      style="border: 2px solid var(--ink)"
      :options="[{ label: 'One tap', value: 'quick' }, { label: 'Full screen', value: 'full' }, { label: 'Both', value: 'both' }]"
      @update:model-value="(v) => update({ promptMode: v })"
    />
    <div class="text-caption text-grey-7 q-mt-xs q-mb-md">
      {{ { quick: 'Buttons on the notification: Productive or Passing time. Tapping it opens the week.', full: 'Tapping the notification opens the log screen (focus block, goal, note).', both: 'Buttons for a quick answer, and tapping the notification opens the log screen.' }[s.promptMode] }}
    </div>

    <q-toggle :model-value="s.notificationsEnabled" label="Notify me every 30 minutes (05:00–23:00)" @update:model-value="toggleNotifications" />
    <q-toggle :model-value="s.planReminders" label="Remind me when a pre-blocked focus block starts" @update:model-value="(v) => update({ planReminders: v })" />
    <div class="row items-center q-mt-sm">
      <span class="text-body2 q-mr-md">Friday summary at</span>
      <q-input :model-value="s.summaryTime" type="time" dense outlined style="width: 130px" @update:model-value="(v) => v && update({ summaryTime: v })" />
    </div>
    <div v-if="!isNative" class="text-caption text-grey-7 q-mt-sm">
      In the browser, prompts only appear while the app is open. Install the Android/iOS app for background notifications.
    </div>

    <q-separator class="q-my-lg" />

    <div class="text-subtitle2 text-weight-bold q-mb-sm">Account and sync</div>
    <div v-if="!supabase" class="text-body2 text-grey-8">
      Sync is off because no Supabase credentials were set at build time. Your data stays on this device.
    </div>
    <template v-else-if="store.user">
      <div class="text-body2 q-mb-sm">Signed in as <b>{{ store.user.email }}</b></div>
      <div v-if="store.syncError" class="text-negative text-caption q-mb-sm">{{ store.syncError }}</div>
      <q-btn color="primary" unelevated no-caps label="Sync now" :loading="store.syncing" class="q-mr-sm" @click="store.sync()" />
      <q-btn flat no-caps color="secondary" label="Sign out" @click="store.signOut()" />
    </template>
    <template v-else>
      <q-input v-model="email" type="email" label="Email" outlined dense class="q-mb-sm" />
      <q-input v-model="password" type="password" label="Password (min 6 characters)" outlined dense class="q-mb-sm" />
      <div class="text-negative text-caption q-mb-sm" v-if="authError">{{ authError }}</div>
      <q-btn color="primary" unelevated no-caps label="Sign in" class="q-mr-sm" :loading="busy" @click="auth('in')" />
      <q-btn flat no-caps label="Create account" :loading="busy" @click="auth('up')" />
    </template>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useTempoStore } from 'stores/tempo'
import { supabase } from 'src/services/supabase'
import { isNative, reschedule, requestPermission } from 'src/services/notify'

const $q = useQuasar()
const store = useTempoStore()
const s = computed(() => store.settings)
const email = ref('')
const password = ref('')
const authError = ref('')
const busy = ref(false)

function update(patch) {
  store.saveSettings(patch)
  reschedule(store)
}
async function toggleNotifications(on) {
  if (on && !(await requestPermission())) {
    $q.notify({ type: 'warning', message: 'Notifications are blocked. Allow them in system settings.' })
    return
  }
  update({ notificationsEnabled: on })
}
async function auth(mode) {
  busy.value = true
  authError.value = ''
  try {
    if (mode === 'in') await store.signIn(email.value, password.value)
    else {
      const res = await store.signUp(email.value, password.value)
      if (!res.session) $q.notify({ message: 'Check your email to confirm the account, then sign in.', timeout: 6000 })
    }
  } catch (e) {
    authError.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

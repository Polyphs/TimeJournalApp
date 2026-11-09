<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-white text-primary" style="border-bottom: 2px solid var(--ink)">
      <q-toolbar style="min-height: 50px">
        <q-toolbar-title class="text-weight-bold" style="letter-spacing: -0.01em; white-space: normal; line-height: 1.15; font-size: 15px">Time Journal - Your guide to mindful time Journaling</q-toolbar-title>
        <q-spinner v-if="store.syncing" size="18px" color="primary" class="q-mr-sm" />
        <q-icon v-else-if="store.syncError" name="cloud_off" color="negative" size="20px" class="q-mr-sm" />
        <q-icon v-else-if="store.user" name="cloud_done" color="positive" size="20px" class="q-mr-sm" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <SignupNudge />
      <BlockImport />
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-primary" style="border-top: 2px solid var(--ink)">
      <q-tabs dense no-caps active-color="secondary" indicator-color="secondary" class="text-primary">
        <q-route-tab :to="{ name: 'week' }" exact icon="calendar_view_week" label="Week" />
        <q-route-tab :to="{ name: 'log' }" icon="edit_note" label="Log" />
        <q-route-tab :to="{ name: 'summary' }" icon="insights" label="Summary" />
        <q-route-tab :to="{ name: 'blocks' }" icon="view_agenda" label="Blocks" />
        <q-route-tab :to="{ name: 'settings' }" icon="tune" label="Settings" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { useTempoStore } from 'stores/tempo'
import SignupNudge from 'components/SignupNudge.vue'
import BlockImport from 'components/BlockImport.vue'
const store = useTempoStore()
</script>

<template>
  <q-page>
    <div v-if="!target" class="q-pa-lg text-grey-8">
      Nothing to log right now. Prompts run from 05:00 to 23:00, every 30 minutes.
    </div>
    <template v-else>
      <div class="q-px-md q-pt-md text-body2 text-grey-8">How did you spend this time?</div>
      <SlotEditor :key="target.date + target.idx" :date="target.date" :idx="target.idx" @done="router.replace({ name: 'week' })" />
    </template>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SlotEditor from 'components/SlotEditor.vue'
import { lastEndedSlot } from 'src/utils/time'

const route = useRoute()
const router = useRouter()
const target = computed(() => {
  if (route.query.date && route.query.idx != null) return { date: String(route.query.date), idx: Number(route.query.idx) }
  return lastEndedSlot(new Date())
})
</script>

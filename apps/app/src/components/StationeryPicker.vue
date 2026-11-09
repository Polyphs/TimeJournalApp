<template>
  <div class="q-pa-sm" style="width: 300px; max-width: 90vw">
    <div class="text-caption text-grey-7 q-mb-xs">Choose your journal stationery</div>
    <div class="picker-grid">
      <button
        v-for="p in store.stationeryList" :key="p.id" type="button" class="picker-item" :class="{ on: p.id === modelValue }"
        :aria-pressed="p.id === modelValue" @click="$emit('update:modelValue', p.id)"
      >
        <PaperSample :paper="p.paper" :title="p.name" />
      </button>
    </div>
    <div class="text-caption text-grey-7 q-mt-sm">
      More papers: Settings, then Journal stationery.
    </div>
  </div>
</template>

<script setup>
import PaperSample from 'components/PaperSample.vue'
import { useTempoStore } from 'stores/tempo'

defineProps({ modelValue: String })
defineEmits(['update:modelValue'])
const store = useTempoStore()
</script>

<style scoped>
.picker-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 50vh; overflow-y: auto; }
.picker-item { padding: 0; border: 0; background: none; text-align: left; cursor: pointer; border-radius: 8px; }
.picker-item.on { outline: 3px solid var(--pen); outline-offset: 1px; }
</style>

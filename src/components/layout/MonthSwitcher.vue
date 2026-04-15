<template>
  <div class="switcher-wrap">
    <button class="switcher" type="button" @click="open = !open">
      <span>{{ store.activeMonthLabel }}</span>
      <span class="chevron">▾</span>
    </button>

    <div v-if="open" class="sheet-backdrop" @click="open = false">
      <div class="sheet" @click.stop>
        <div class="sheet-head">
          <strong>Выбор месяца</strong>
          <button class="sheet-close" type="button" @click="open = false">Закрыть</button>
        </div>
        <div class="sheet-list">
          <button
            v-for="month in store.months"
            :key="month.id"
            class="sheet-item"
            :class="{ active: month.id === store.activeMonthId }"
            type="button"
            @click="selectMonth(month.id)"
          >
            <span>{{ month.label }}</span>
            <small>{{ month.id }}</small>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetStore } from '../../app/stores/budget'

const store = useBudgetStore()
const open = ref(false)

async function selectMonth(monthId: string) {
  await store.switchMonth(monthId)
  open.value = false
}
</script>

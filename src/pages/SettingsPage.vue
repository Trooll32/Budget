<template>
  <section class="page stack-lg">
    <article class="panel stack">
      <div class="panel-head"><h2>Данные</h2></div>
      <button class="secondary-btn" type="button" @click="downloadBackup">Экспорт JSON</button>
      <p class="small">Используй экспорт как резервную копию локальной базы.</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { useBudgetStore } from '../app/stores/budget'

const store = useBudgetStore()

async function downloadBackup() {
  const content = await store.exportData()
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

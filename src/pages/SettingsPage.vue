<template>
  <section class="page stack-lg">
    <!-- Accounts editor -->
    <article class="panel stack">
      <div class="panel-head"><h2>Счета</h2><span class="small">Проценты распределения</span></div>
      <div class="stack">
        <div v-for="acc in draftAccounts" :key="acc.id" class="editor-row">
          <input v-model="acc.name" class="field-input" placeholder="Название" />
          <input v-model.number="acc.percent" class="field-input" type="number" min="0" max="100" step="1" style="width:80px;" />
          <input v-model="acc.color" type="color" class="field-input color-field" />
          <button class="icon-btn" type="button" @click="removeAccount(acc.id)">×</button>
        </div>
      </div>
      <button class="secondary-btn" type="button" @click="addAccount">Добавить счёт</button>
      <div class="percent-total" :class="percentTotal === 100 ? 'positive' : 'negative'">
        Сумма процентов: {{ percentTotal }}%
      </div>
      <button class="primary-btn" type="button" :disabled="percentTotal !== 100" @click="saveAccounts">
        Сохранить счета
      </button>
    </article>

    <!-- Categories editor -->
    <article class="panel stack">
      <div class="panel-head"><h2>Категории</h2></div>
      <div class="stack">
        <div v-for="cat in draftCategories" :key="cat.id" class="editor-row">
          <input v-model="cat.name" class="field-input" placeholder="Название" />
          <input v-model="cat.color" type="color" class="field-input color-field" />
          <button class="icon-btn" type="button" @click="removeCategory(cat.id)">×</button>
        </div>
      </div>
      <button class="secondary-btn" type="button" @click="addCategory">Добавить категорию</button>
      <button class="primary-btn" type="button" @click="saveCategories">Сохранить категории</button>
    </article>

    <!-- Data -->
    <article class="panel stack">
      <div class="panel-head"><h2>Данные</h2></div>
      <button class="primary-btn" type="button" @click="downloadBackup">Экспорт JSON</button>
      <label class="secondary-btn" style="display:flex;align-items:center;justify-content:center;cursor:pointer;">
        Импорт JSON
        <input type="file" accept="application/json" hidden @change="importBackup" />
      </label>
      <button class="danger-btn" type="button" @click="reset">Сбросить всё</button>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBudgetStore } from '../app/stores/budget'
import type { AccountRecord, CategoryRecord } from '../types/domain'

const store = useBudgetStore()

// ─── Accounts draft ───────────────────────────────────────────────────────────
const COLORS = ['#8b6cff', '#7ce5e0', '#58d67b', '#ff9a5c', '#ff6d8a', '#5c89ff']

const draftAccounts = ref<AccountRecord[]>([])
const draftCategories = ref<CategoryRecord[]>([])

watch(
  () => store.accounts,
  (val) => { draftAccounts.value = val.map((a) => ({ ...a })) },
  { immediate: true }
)

watch(
  () => store.categories,
  (val) => { draftCategories.value = val.map((c) => ({ ...c })) },
  { immediate: true }
)

const percentTotal = computed(() =>
  draftAccounts.value.reduce((s, a) => s + Number(a.percent || 0), 0)
)

function addAccount() {
  draftAccounts.value.push({
    id: crypto.randomUUID(),
    name: 'Новый счёт',
    percent: 0,
    color: COLORS[draftAccounts.value.length % COLORS.length],
    archived: false
  })
}

function removeAccount(id: string) {
  if (draftAccounts.value.length <= 1) return
  draftAccounts.value = draftAccounts.value.filter((a) => a.id !== id)
}

async function saveAccounts() {
  if (percentTotal.value !== 100) return
  await store.saveAccounts(draftAccounts.value)
}

// ─── Categories draft ─────────────────────────────────────────────────────────
function addCategory() {
  draftCategories.value.push({
    id: crypto.randomUUID(),
    name: 'Новая категория',
    color: COLORS[draftCategories.value.length % COLORS.length],
    archived: false
  })
}

function removeCategory(id: string) {
  if (draftCategories.value.length <= 1) return
  draftCategories.value = draftCategories.value.filter((c) => c.id !== id)
}

async function saveCategories() {
  if (draftCategories.value.some((c) => !c.name.trim())) return
  await store.saveCategories(draftCategories.value)
}

// ─── Data ─────────────────────────────────────────────────────────────────────
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

async function importBackup(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    await store.importData(text)
  } catch {
    alert('Ошибка импорта JSON — проверь формат файла')
  }
  (e.target as HTMLInputElement).value = ''
}

async function reset() {
  if (!confirm('Сбросить все данные? Это действие нельзя отменить.')) return
  await store.resetAll()
}
</script>

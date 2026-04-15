<template>
  <section class="page">

    <!-- Large title -->
    <h1 class="set-title">Настройки</h1>

    <!-- ── Accounts ────────────────────────────────────────────────── -->
    <div class="set-section">
      <div class="set-section__head">
        <div>
          <div class="set-section__title">Счета</div>
          <div class="set-section__sub">Распределение доходов по %</div>
        </div>
        <button class="set-add-btn" type="button" @click="addAccount">+ Счёт</button>
      </div>

      <div class="set-rows">
        <div v-for="acc in draftAccounts" :key="acc.id" class="set-row">
          <input v-model="acc.color" type="color" class="set-color" />
          <input v-model="acc.name" class="set-row__name field-input" placeholder="Название" />
          <div class="set-row__percent-wrap">
            <input
              v-model.number="acc.percent"
              type="number" min="0" max="100" step="1"
              class="set-row__percent field-input"
            />
            <span class="set-row__pct-sign">%</span>
          </div>
          <button class="set-del-btn" type="button" @click="removeAccount(acc.id)">×</button>
        </div>
      </div>

      <!-- Percent bar -->
      <div class="set-pct-bar">
        <div
          v-for="acc in draftAccounts" :key="acc.id"
          class="set-pct-bar__seg"
          :style="{ flex: acc.percent, background: acc.color }"
          :title="acc.name + ': ' + acc.percent + '%'"
        ></div>
      </div>
      <div class="set-pct-total" :class="percentTotal === 100 ? 'positive' : 'negative'">
        {{ percentTotal === 100 ? '✔ 100%' : 'Сумма: ' + percentTotal + '% (должно быть 100%)' }}
      </div>

      <button
        class="primary-btn"
        type="button"
        :disabled="percentTotal !== 100"
        @click="saveAccounts"
      >Сохранить счета</button>
    </div>

    <!-- ── Categories ──────────────────────────────────────────────── -->
    <div class="set-section">
      <div class="set-section__head">
        <div>
          <div class="set-section__title">Категории</div>
          <div class="set-section__sub">Типы трат</div>
        </div>
        <button class="set-add-btn" type="button" @click="addCategory">+ Категория</button>
      </div>

      <div class="set-rows">
        <div v-for="cat in draftCategories" :key="cat.id" class="set-row">
          <input v-model="cat.color" type="color" class="set-color" />
          <input v-model="cat.name" class="set-row__name field-input" placeholder="Название" />
          <button class="set-del-btn" type="button" @click="removeCategory(cat.id)">×</button>
        </div>
      </div>

      <button class="primary-btn" type="button" @click="saveCategories">Сохранить категории</button>
    </div>

    <!-- ── Data ──────────────────────────────────────────────────────────── -->
    <div class="set-section">
      <div class="set-section__head">
        <div>
          <div class="set-section__title">Данные</div>
          <div class="set-section__sub">Бекап и восстановление</div>
        </div>
      </div>

      <div class="set-data-btns">
        <button class="set-data-btn" type="button" @click="downloadBackup">
          <span class="set-data-btn__icon">⬇️</span>
          <div>
            <div class="set-data-btn__title">Экспорт JSON</div>
            <div class="set-data-btn__sub">Скачать резервную копию</div>
          </div>
        </button>
        <label class="set-data-btn" style="cursor:pointer;">
          <span class="set-data-btn__icon">⬆️</span>
          <div>
            <div class="set-data-btn__title">Импорт JSON</div>
            <div class="set-data-btn__sub">Восстановить из файла</div>
          </div>
          <input type="file" accept="application/json" hidden @change="importBackup" />
        </label>
      </div>

      <button class="danger-btn" style="margin-top:var(--space-2);" type="button" @click="reset">
        ⚠️ Сбросить все данные
      </button>
    </div>

    <!-- bottom padding for tab bar -->
    <div style="height: var(--space-8);"></div>

  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBudgetStore } from '../app/stores/budget'
import type { AccountRecord, CategoryRecord } from '../types/domain'

const store = useBudgetStore()
const COLORS = ['#8b6cff', '#7ce5e0', '#58d67b', '#ff9a5c', '#ff6d8a', '#5c89ff']

const draftAccounts = ref<AccountRecord[]>([])
const draftCategories = ref<CategoryRecord[]>([])

watch(() => store.accounts, (val) => { draftAccounts.value = val.map((a) => ({ ...a })) }, { immediate: true })
watch(() => store.categories, (val) => { draftCategories.value = val.map((c) => ({ ...c })) }, { immediate: true })

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

<style scoped>
.set-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -.03em;
  margin-bottom: var(--space-5);
}

/* ── Section ─────────────────────────────────────────────────────────── */
.set-section {
  background: rgba(255,255,255,.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  display: grid;
  gap: var(--space-4);
}
.set-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.set-section__title {
  font-size: 16px;
  font-weight: 700;
}
.set-section__sub {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.set-add-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,.06);
  border: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  flex-shrink: 0;
  transition: background var(--transition);
}
.set-add-btn:active { background: rgba(255,255,255,.12); }

/* ── Rows ────────────────────────────────────────────────────────────── */
.set-rows { display: grid; gap: var(--space-2); }
.set-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.set-color {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  padding: 2px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}
.set-row__name {
  flex: 1;
  min-width: 0;
}
.set-row__percent-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.set-row__percent {
  width: 58px;
  text-align: right;
}
.set-row__pct-sign {
  font-size: 13px;
  color: var(--color-text-muted);
}
.set-del-btn {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: rgba(255,109,138,.08);
  border: 1px solid rgba(255,109,138,.15);
  color: var(--color-negative);
  font-size: 16px;
  flex-shrink: 0;
  transition: background var(--transition);
}
.set-del-btn:active { background: rgba(255,109,138,.2); }

/* ── Percent bar ──────────────────────────────────────────────────── */
.set-pct-bar {
  display: flex;
  height: 6px;
  border-radius: var(--radius-full);
  overflow: hidden;
  gap: 2px;
}
.set-pct-bar__seg {
  border-radius: var(--radius-full);
  transition: flex .3s ease;
  min-width: 4px;
}
.set-pct-total {
  font-size: 12px;
  font-weight: 600;
  margin-top: -8px;
}
.positive { color: var(--color-positive); }
.negative { color: var(--color-negative); }

/* ── Data buttons ──────────────────────────────────────────────────── */
.set-data-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.set-data-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: rgba(255,255,255,.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: left;
  transition: background var(--transition);
}
.set-data-btn:active { background: rgba(255,255,255,.09); }
.set-data-btn__icon { font-size: 22px; flex-shrink: 0; }
.set-data-btn__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}
.set-data-btn__sub {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
</style>

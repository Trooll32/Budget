<template>
  <section class="page">

    <!-- ── Large title row ─────────────────────────────────────────── -->
    <div class="exp-header">
      <h1 class="exp-title">Траты</h1>
      <button class="exp-add-btn" type="button" @click="openAdd">+ Трата</button>
    </div>

    <!-- ── Summary strip ─────────────────────────────────────────── -->
    <div v-if="sorted.length" class="exp-summary">
      <div class="exp-summary__item">
        <div class="exp-summary__label">Трат за месяц</div>
        <div class="exp-summary__val negative">{{ formatMoney(totalExpenses) }}</div>
      </div>
      <div class="exp-summary__divider"></div>
      <div class="exp-summary__item">
        <div class="exp-summary__label">Операций</div>
        <div class="exp-summary__val">{{ sorted.length }}</div>
      </div>
      <div class="exp-summary__divider"></div>
      <div class="exp-summary__item">
        <div class="exp-summary__label">Ср. в день</div>
        <div class="exp-summary__val">{{ formatMoney(avgDaily) }}</div>
      </div>
    </div>

    <!-- ── Empty state ────────────────────────────────────────────── -->
    <div v-if="!sorted.length" class="exp-empty">
      <div class="exp-empty__icon">💳</div>
      <div class="exp-empty__title">Нет трат</div>
      <div class="exp-empty__sub">Добавь первую трату за этот месяц</div>
      <button class="primary-btn" style="margin-top:var(--space-4);max-width:220px;" @click="openAdd">+ Добавить</button>
    </div>

    <!-- ── Expenses list ───────────────────────────────────────────── -->
    <div v-else class="exp-list">
      <div
        v-for="item in sorted"
        :key="item.id"
        class="exp-item"
        :class="{ 'exp-item--swiped': swipedId === item.id }"
        @touchstart.passive="swipeStart($event, item.id)"
        @touchmove.passive="swipeMove"
        @touchend="swipeEnd"
      >
        <!-- Main row -->
        <div class="exp-item__main">
          <div class="exp-item__cat-dot" :style="{ background: categoryColor(item.categoryId) }"></div>
          <div class="exp-item__body">
            <div class="exp-item__title">{{ item.note || 'Трата' }}</div>
            <div class="exp-item__meta">
              {{ accountName(item.accountId) }}
              <span class="exp-item__sep">·</span>
              <span class="exp-item__cat">{{ categoryName(item.categoryId) }}</span>
              <span class="exp-item__sep">·</span>
              {{ formatDate(item.date) }}
            </div>
          </div>
          <div class="exp-item__amount">−{{ formatMoney(item.amount) }}</div>
        </div>

        <!-- Swipe actions (revealed on swipe left) -->
        <div class="exp-item__actions">
          <button class="exp-action exp-action--edit" @click.stop="openEdit(item.id)">⚙️ Изм.</button>
          <button class="exp-action exp-action--del" @click.stop="deleteItem(item.id)">🗑 Удал.</button>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBudgetStore } from '../app/stores/budget'
import { useMoney } from '../composables/useMoney'

const store = useBudgetStore()
const { formatMoney, formatDate } = useMoney()

const openAddExpense = inject<() => void>('openAddExpense')
const openEditExpense = inject<(id: string) => void>('openEditExpense')

import { inject } from 'vue'

const sorted = computed(() =>
  [...store.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

const totalExpenses = computed(() => store.expenses.reduce((s, e) => s + e.amount, 0))
const avgDaily = computed(() => totalExpenses.value / Math.max(1, new Date().getDate()))

function accountName(id: string) {
  return store.accounts.find((a) => a.id === id)?.name ?? 'Счёт'
}
function categoryName(id: string) {
  return store.categories.find((c) => c.id === id)?.name ?? 'Категория'
}
function categoryColor(id: string) {
  return store.categories.find((c) => c.id === id)?.color ?? 'var(--color-text-faint)'
}

function openAdd() { openAddExpense?.() }
function openEdit(id: string) { openEditExpense?.(id) }

async function deleteItem(id: string) {
  swipedId.value = null
  await store.deleteExpense(id)
}

// ── Swipe to reveal actions ──────────────────────────────────────────
const swipedId = ref<string | null>(null)
let swipeStartX = 0
let swipeStartY = 0
let swipeLocked = false

function swipeStart(e: TouchEvent, id: string) {
  swipeStartX = e.touches[0].clientX
  swipeStartY = e.touches[0].clientY
  swipeLocked = false
  // close others
  if (swipedId.value && swipedId.value !== id) swipedId.value = null
}
function swipeMove(e: TouchEvent) {
  if (swipeLocked) return
  const dx = e.touches[0].clientX - swipeStartX
  const dy = e.touches[0].clientY - swipeStartY
  if (Math.abs(dy) > Math.abs(dx)) { swipeLocked = true }
}
function swipeEnd(e: TouchEvent) {
  if (swipeLocked) return
  const dx = e.changedTouches[0].clientX - swipeStartX
  const id = (e.currentTarget as HTMLElement).dataset.id as string
  const itemId = sorted.value.find((_, i) =>
    (e.currentTarget as HTMLElement) === document.querySelectorAll('.exp-item')[i]
  )?.id
  if (dx < -40) {
    // find id from element
    const el = e.currentTarget as HTMLElement
    const foundId = sorted.value[Array.from(document.querySelectorAll('.exp-item')).indexOf(el)]?.id
    if (foundId) swipedId.value = foundId
  } else if (dx > 20) {
    swipedId.value = null
  }
}
</script>

<style scoped>
/* ── Header ─────────────────────────────────────────────────────────── */
.exp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.exp-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -.03em;
  line-height: 1;
}
.exp-add-btn {
  height: 38px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  background: rgba(255,255,255,.06);
  border: 1px solid var(--color-border);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  transition: background var(--transition);
}
.exp-add-btn:active { background: rgba(255,255,255,.12); }

/* ── Summary strip ────────────────────────────────────────────────── */
.exp-summary {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: rgba(255,255,255,.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}
.exp-summary__item {
  flex: 1;
  text-align: center;
}
.exp-summary__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}
.exp-summary__val {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.exp-summary__divider {
  width: 1px;
  height: 32px;
  background: rgba(255,255,255,.08);
  flex-shrink: 0;
}

/* ── Empty state ───────────────────────────────────────────────────── */
.exp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-12) var(--space-4);
  gap: var(--space-2);
}
.exp-empty__icon { font-size: 40px; margin-bottom: var(--space-2); }
.exp-empty__title { font-size: 18px; font-weight: 700; }
.exp-empty__sub { font-size: 14px; color: var(--color-text-muted); }

/* ── List ────────────────────────────────────────────────────────────── */
.exp-list {
  display: grid;
  gap: var(--space-3);
  padding-bottom: var(--space-6);
}

/* ── Swipe item ──────────────────────────────────────────────────────── */
.exp-item {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgba(255,255,255,.04);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 14px rgba(0,0,0,.18);
}
.exp-item__main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  position: relative;
  z-index: 1;
  background: rgba(255,255,255,.04);
  transition: transform .22s cubic-bezier(.16,1,.3,1);
}
.exp-item--swiped .exp-item__main {
  transform: translateX(-130px);
}
.exp-item__cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
  align-self: flex-start;
}
.exp-item__body { flex: 1; min-width: 0; }
.exp-item__title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.exp-item__meta {
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}
.exp-item__sep { opacity: .4; }
.exp-item__cat {
  color: var(--color-text-muted);
}
.exp-item__amount {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-negative);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Swipe action buttons ──────────────────────────────────────────── */
.exp-item__actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  z-index: 0;
}
.exp-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  font-size: 11px;
  font-weight: 600;
  gap: 4px;
  flex-direction: column;
  border: none;
  cursor: pointer;
  transition: opacity var(--transition);
}
.exp-action--edit {
  background: rgba(139,108,255,.18);
  color: var(--color-primary-2);
}
.exp-action--del {
  background: rgba(255,109,138,.18);
  color: var(--color-negative);
}
.exp-action:active { opacity: .7; }

/* ── Colors ─────────────────────────────────────────────────────────── */
.negative { color: var(--color-negative); }
.positive { color: var(--color-positive); }
</style>

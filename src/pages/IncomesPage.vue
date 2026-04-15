<template>
  <section class="page">

    <!-- ── Large title row ─────────────────────────────────────────── -->
    <div class="inc-header">
      <h1 class="inc-title">Доходы</h1>
      <button class="inc-add-btn" type="button" @click="openSheet">Добавить доход</button>
    </div>

    <!-- ── Empty state ─────────────────────────────────────────────── -->
    <div v-if="!sorted.length" class="inc-empty">
      <div class="inc-empty__icon">💸</div>
      <div class="inc-empty__title">Нет доходов</div>
      <div class="inc-empty__sub">Добавь первый доход за этот месяц</div>
      <button class="primary-btn" style="margin-top:var(--space-4);max-width:220px;" @click="openSheet">+ Добавить</button>
    </div>

    <!-- ── Incomes list ────────────────────────────────────────────── -->
    <div v-else class="inc-list">
      <div v-for="item in sorted" :key="item.id" class="inc-item">
        <div class="inc-item__left">
          <div class="inc-item__source">{{ item.source }}</div>
          <div class="inc-item__meta">Доход · {{ formatDate(item.date) }}{{ item.note ? ' · ' + item.note : '' }}</div>
          <div class="inc-item__chips">
            <span v-for="acc in store.accounts" :key="acc.id" class="inc-chip">
              <span class="inc-chip__dot" :style="{ background: acc.color }"></span>
              {{ acc.name }}: {{ formatMoney(item.amount * (acc.percent / 100)) }}
            </span>
          </div>
        </div>
        <div class="inc-item__right">
          <div class="inc-item__amount">+{{ formatMoney(item.amount) }}</div>
          <button class="inc-del-btn" type="button" @click="confirmDelete(item.id)">Удалить</button>
        </div>
      </div>
    </div>

    <!-- ── Add income sheet ────────────────────────────────────────── -->
    <Teleport to="body">
      <div class="sheet-backdrop" :class="{ open: sheetOpen }" @click="closeSheet">
        <div class="sheet" :class="{ open: sheetOpen }" @click.stop ref="sheetEl">
          <div class="sheet-handle" @touchstart.passive="dragStart" @touchmove.passive="dragMove" @touchend="dragEnd"></div>
          <div class="sheet-head">
            <div>
              <h3>Новый доход</h3>
              <p class="helper">Я, жена, бонус, аванс</p>
            </div>
            <button class="icon-btn" type="button" @click="closeSheet">×</button>
          </div>
          <form class="fields" @submit.prevent="submit">
            <div class="field">
              <label>Источник</label>
              <input v-model="source" class="field-input" placeholder="Например: я, жена" autofocus />
            </div>
            <div class="field">
              <label>Дата</label>
              <input v-model="date" type="date" class="field-input" />
            </div>
            <div class="field">
              <label>Сумма</label>
              <input v-model.number="amount" type="number" min="0" step="0.01" placeholder="0" class="field-input inc-amount-input" />
            </div>
            <div class="field">
              <label>Комментарий</label>
              <input v-model="note" class="field-input" placeholder="Например: аванс" />
            </div>
            <!-- Allocation preview -->
            <div v-if="amount > 0" class="inc-alloc">
              <div class="inc-alloc__label">Распределение по счетам</div>
              <div class="inc-alloc__grid">
                <div v-for="acc in store.accounts" :key="acc.id" class="inc-alloc__row">
                  <span class="inc-alloc__dot" :style="{ background: acc.color }"></span>
                  <span class="inc-alloc__name">{{ acc.name }}</span>
                  <span class="inc-alloc__val">{{ formatMoney(amount * (acc.percent / 100)) }}</span>
                </div>
              </div>
            </div>
            <button class="primary-btn" type="submit" :disabled="!source.trim() || !amount || amount <= 0">
              Добавить доход
            </button>
          </form>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBudgetStore } from '../app/stores/budget'
import { useMoney } from '../composables/useMoney'

const store = useBudgetStore()
const { formatMoney, formatDate, today } = useMoney()

// ── Form state ───────────────────────────────────────────────────────────────
const source = ref('')
const amount = ref<number>(0)
const date = ref(today())
const note = ref('')

// ── Sheet state ──────────────────────────────────────────────────────────────
const sheetOpen = ref(false)
const sheetEl = ref<HTMLElement | null>(null)

function openSheet() {
  source.value = ''
  amount.value = 0
  note.value = ''
  date.value = today()
  sheetOpen.value = true
}
function closeSheet() { sheetOpen.value = false }

// ── Drag to close ────────────────────────────────────────────────────────────
let dragStartY = 0, dragCurrentY = 0, dragging = false
function dragStart(e: TouchEvent) {
  dragStartY = e.touches[0].clientY
  dragCurrentY = 0
  dragging = true
  if (sheetEl.value) sheetEl.value.style.transition = 'none'
}
function dragMove(e: TouchEvent) {
  if (!dragging) return
  dragCurrentY = Math.max(0, e.touches[0].clientY - dragStartY)
  if (sheetEl.value) sheetEl.value.style.transform = `translateY(${dragCurrentY}px)`
}
function dragEnd() {
  if (!dragging) return
  dragging = false
  if (sheetEl.value) sheetEl.value.style.transition = ''
  if (dragCurrentY > 120) { closeSheet(); return }
  if (sheetEl.value) sheetEl.value.style.transform = ''
}

// ── List ─────────────────────────────────────────────────────────────────────
const sorted = computed(() =>
  [...store.incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

// ── Actions ──────────────────────────────────────────────────────────────────
async function submit() {
  if (!source.value.trim() || !amount.value || amount.value <= 0) return
  await store.createIncome({
    source: source.value.trim(),
    amount: amount.value,
    date: date.value,
    note: note.value.trim()
  })
  closeSheet()
}

async function confirmDelete(id: string) {
  if (!confirm('Удалить этот доход?')) return
  await store.deleteIncome(id)
}
</script>

<style scoped>
/* ── Header ─────────────────────────────────────────────────────────── */
.inc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.inc-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -.03em;
  line-height: 1;
}
.inc-add-btn {
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
.inc-add-btn:active { background: rgba(255,255,255,.12); }

/* ── Empty state ────────────────────────────────────────────────────── */
.inc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-12) var(--space-4);
  gap: var(--space-2);
}
.inc-empty__icon { font-size: 40px; margin-bottom: var(--space-2); }
.inc-empty__title { font-size: 18px; font-weight: 700; }
.inc-empty__sub { font-size: 14px; color: var(--color-text-muted); }

/* ── List ────────────────────────────────────────────────────────────── */
.inc-list {
  display: grid;
  gap: var(--space-3);
  padding-bottom: var(--space-6);
}
.inc-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  background: rgba(255,255,255,.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: 0 4px 14px rgba(0,0,0,.18);
}
.inc-item__left { flex: 1; min-width: 0; }
.inc-item__source {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 3px;
}
.inc-item__meta {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}
.inc-item__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.inc-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,.05);
  border: 1px solid var(--color-border);
  font-size: 11px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
.inc-chip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.inc-item__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.inc-item__amount {
  font-size: 17px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--color-positive);
  white-space: nowrap;
}
.inc-del-btn {
  font-size: 11px;
  color: var(--color-text-faint);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255,255,255,.08);
  background: transparent;
  transition: color var(--transition), border-color var(--transition);
}
.inc-del-btn:active {
  color: var(--color-negative);
  border-color: rgba(255,109,138,.3);
}

/* ── Sheet allocation preview ──────────────────────────────────────── */
.inc-amount-input { font-size: 22px !important; font-weight: 700; }
.inc-alloc {
  background: rgba(139,108,255,.08);
  border: 1px solid rgba(139,108,255,.18);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.inc-alloc__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}
.inc-alloc__grid { display: grid; gap: 8px; }
.inc-alloc__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.inc-alloc__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.inc-alloc__name { flex: 1; color: var(--color-text-muted); }
.inc-alloc__val {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}
</style>

<template>
  <section class="page">

    <!-- ── Month switcher ────────────────────────────────────── -->
    <div class="dash-month">
      <MonthSwitcher />
    </div>

    <!-- ── Hero summary card ─────────────────────────────────── -->
    <div class="dash-hero">
      <div class="dash-hero__top">
        <div>
          <div class="dash-label">Пришло за месяц</div>
          <div class="dash-hero__income">{{ formatMoney(t.totalIncome) }}</div>
        </div>
        <div class="dash-hero__badge" :class="t.freeCash >= 0 ? 'badge--pos' : 'badge--neg'">
          {{ t.freeCash >= 0 ? '+' : '' }}{{ formatMoney(t.freeCash) }}
        </div>
      </div>
      <div class="dash-hero__divider"></div>
      <div class="dash-hero__row">
        <div class="dash-hero__stat">
          <div class="dash-label">Потрачено</div>
          <div class="dash-hero__val negative">{{ formatMoney(t.totalExpense) }}</div>
        </div>
        <div class="dash-hero__stat">
          <div class="dash-label">Осталось</div>
          <div class="dash-hero__val" :class="t.freeCash >= 0 ? 'positive' : 'negative'">{{ formatMoney(t.freeCash) }}</div>
        </div>
        <div class="dash-hero__stat">
          <div class="dash-label">Доходов</div>
          <div class="dash-hero__val">{{ store.incomes.length }}</div>
        </div>
        <div class="dash-hero__stat">
          <div class="dash-label">Трат</div>
          <div class="dash-hero__val">{{ store.expenses.length }}</div>
        </div>
      </div>
    </div>

    <!-- ── Burn rate strip ────────────────────────────────────── -->
    <div class="dash-burn" :class="burnAhead ? 'burn--warn' : 'burn--ok'">
      <div class="dash-burn__left">
        <span class="dash-burn__icon">{{ burnAhead ? '⚡' : '✓' }}</span>
        <span>{{ burnAhead ? 'Тратишь быстрее месяца' : 'Темп под контролем' }}</span>
      </div>
      <div class="dash-burn__right">
        <span class="dash-burn__val">{{ burnRate }}%</span>
        <span class="dash-label"> / {{ monthProgress }}% мес.</span>
      </div>
    </div>

    <!-- ── Quick stats 2×2 ────────────────────────────────────── -->
    <div class="dash-quick">
      <div class="dash-quick__card">
        <div class="dash-label">Ср. расход / день</div>
        <div class="dash-quick__val">{{ formatMoney(avgDaily) }}</div>
      </div>
      <div class="dash-quick__card">
        <div class="dash-label">Топ-категория</div>
        <div class="dash-quick__val">{{ topCategoryName }}</div>
        <div class="dash-quick__sub negative">{{ topCategoryAmount > 0 ? formatMoney(topCategoryAmount) : '—' }}</div>
      </div>
    </div>

    <!-- ── Accounts ───────────────────────────────────────────── -->
    <div class="dash-section-title">Счета</div>
    <div class="dash-accounts">
      <div
        v-for="acc in store.accounts"
        :key="acc.id"
        class="dash-acc"
      >
        <div class="dash-acc__header">
          <div class="dash-acc__dot" :style="{ background: acc.color }"></div>
          <div class="dash-acc__name">{{ acc.name }}</div>
          <div
            class="dash-acc__remain"
            :class="remainByAccount(acc.id) >= 0 ? 'positive' : 'negative'"
          >{{ formatMoney(remainByAccount(acc.id)) }}</div>
        </div>
        <div class="dash-acc__bar-wrap">
          <div
            class="dash-acc__bar-fill"
            :style="{
              width: barWidth(t.allocatedByAccount[acc.id], t.spentByAccount[acc.id]) + '%',
              background: acc.color
            }"
          ></div>
        </div>
        <div class="dash-acc__meta">
          <span class="dash-label">{{ acc.percent }}% · план {{ formatMoney(t.allocatedByAccount[acc.id] ?? 0) }}</span>
          <span class="negative">−{{ formatMoney(t.spentByAccount[acc.id] ?? 0) }}</span>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBudgetStore } from '../app/stores/budget'
import { useMoney } from '../composables/useMoney'
import MonthSwitcher from '../components/layout/MonthSwitcher.vue'

const store = useBudgetStore()
const { formatMoney } = useMoney()
const t = computed(() => store.totals)

const monthProgress = computed(() => {
  const now = new Date()
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.max(1, Math.round((now.getDate() / days) * 100))
})

const burnRate = computed(() =>
  t.value.totalIncome > 0 ? Math.round((t.value.totalExpense / t.value.totalIncome) * 100) : 0
)

const burnAhead = computed(() => {
  const expected = t.value.totalIncome * (monthProgress.value / 100)
  return t.value.totalExpense > expected
})

const avgDaily = computed(() =>
  t.value.totalExpense / Math.max(1, new Date().getDate())
)

const topCategoryEntry = computed(() => {
  const entries = Object.entries(t.value.spentByCategory).sort((a, b) => b[1] - a[1])
  return entries[0] ?? null
})

const topCategoryName = computed(() => {
  if (!topCategoryEntry.value) return '—'
  return store.categories.find((c) => c.id === topCategoryEntry.value![0])?.name ?? '—'
})

const topCategoryAmount = computed(() => topCategoryEntry.value?.[1] ?? 0)

function remainByAccount(id: string) {
  return (t.value.allocatedByAccount[id] ?? 0) - (t.value.spentByAccount[id] ?? 0)
}

function barWidth(allocated: number, spent: number) {
  if (!allocated || allocated <= 0) return 0
  return Math.min(100, Math.round((spent / allocated) * 100))
}
</script>

<style scoped>
/* ── Month switcher row ────────────────────────────────── */
.dash-month {
  padding: 0 0 var(--space-4);
}

/* ── Hero ─────────────────────────────────────────────── */
.dash-hero {
  background: linear-gradient(160deg, rgba(139,108,255,.18) 0%, rgba(139,108,255,.06) 60%, rgba(255,255,255,.03) 100%);
  border: 1px solid rgba(139,108,255,.22);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  box-shadow: 0 12px 32px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.06);
}
.dash-hero__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.dash-label {
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-bottom: 4px;
}
.dash-hero__income {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -.03em;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.dash-hero__badge {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge--pos {
  background: rgba(88,214,123,.14);
  color: var(--color-positive);
  border: 1px solid rgba(88,214,123,.22);
}
.badge--neg {
  background: rgba(255,109,138,.14);
  color: var(--color-negative);
  border: 1px solid rgba(255,109,138,.22);
}
.dash-hero__divider {
  height: 1px;
  background: rgba(255,255,255,.07);
  margin-bottom: var(--space-4);
}
.dash-hero__row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}
.dash-hero__stat {}
.dash-hero__val {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ── Burn rate ─────────────────────────────────────────── */
.dash-burn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: 13px;
  font-weight: 600;
  gap: var(--space-3);
}
.burn--ok {
  background: rgba(88,214,123,.1);
  border: 1px solid rgba(88,214,123,.18);
  color: var(--color-positive);
}
.burn--warn {
  background: rgba(255,109,138,.1);
  border: 1px solid rgba(255,109,138,.18);
  color: var(--color-negative);
}
.dash-burn__left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dash-burn__icon { font-size: 15px; }
.dash-burn__right {
  display: flex;
  align-items: baseline;
  gap: 3px;
  white-space: nowrap;
}
.dash-burn__val {
  font-size: 16px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* ── Quick stats ───────────────────────────────────────── */
.dash-quick {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.dash-quick__card {
  background: rgba(255,255,255,.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: 0 4px 12px rgba(0,0,0,.18);
}
.dash-quick__val {
  font-size: 16px;
  font-weight: 700;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.dash-quick__sub {
  font-size: 12px;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}

/* ── Section title ─────────────────────────────────────── */
.dash-section-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -.02em;
  margin-bottom: var(--space-3);
}

/* ── Account cards ─────────────────────────────────────── */
.dash-accounts {
  display: grid;
  gap: var(--space-3);
  padding-bottom: var(--space-6);
}
.dash-acc {
  background: rgba(255,255,255,.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: 0 4px 16px rgba(0,0,0,.18);
}
.dash-acc__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.dash-acc__dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.dash-acc__name {
  font-weight: 600;
  font-size: 15px;
  flex: 1;
}
.dash-acc__remain {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.dash-acc__bar-wrap {
  height: 6px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,.08);
  overflow: hidden;
  margin-bottom: 8px;
}
.dash-acc__bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width .4s cubic-bezier(.16,1,.3,1);
  min-width: 2px;
}
.dash-acc__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

/* ── Colors ────────────────────────────────────────────── */
.positive { color: var(--color-positive); }
.negative { color: var(--color-negative); }
</style>

<template>
  <section class="page stack-lg">
    <!-- Hero card -->
    <div class="hero-card">
      <div>
        <div class="eyebrow">Активный месяц</div>
        <h1>Бюджет месяца</h1>
      </div>
      <MonthSwitcher />
    </div>

    <!-- Summary stats -->
    <div class="stats-grid">
      <article class="stat-card">
        <span>Доходы</span>
        <strong>{{ formatMoney(t.totalIncome) }}</strong>
      </article>
      <article class="stat-card">
        <span>Траты</span>
        <strong>{{ formatMoney(t.totalExpense) }}</strong>
      </article>
      <article class="stat-card wide">
        <span>Остаток</span>
        <strong :class="t.freeCash >= 0 ? 'positive' : 'negative'">{{ formatMoney(t.freeCash) }}</strong>
      </article>
    </div>

    <!-- Priority mini cards -->
    <div class="mini-grid">
      <div class="mini-card">
        <span>Темп трат</span>
        <strong>{{ burnRate }}% / {{ monthProgress }}%</strong>
        <div class="small" :class="burnAhead ? 'negative' : 'positive'">
          {{ burnAhead ? 'Тратишь быстрее месяца' : 'Темп под контролем' }}
        </div>
      </div>
      <div class="mini-card">
        <span>Топ-категория</span>
        <strong>{{ topCategoryName }}</strong>
        <div class="small negative">{{ formatMoney(topCategoryAmount) }}</div>
      </div>
      <div class="mini-card">
        <span>Свободный остаток</span>
        <strong :class="t.freeCash >= 0 ? 'positive' : 'negative'">{{ formatMoney(t.freeCash) }}</strong>
      </div>
      <div class="mini-card">
        <span>Средний расход / день</span>
        <strong>{{ formatMoney(avgDaily) }}</strong>
      </div>
    </div>

    <!-- Accounts list with progress bars -->
    <article class="panel">
      <div class="panel-head"><h2>Счета</h2></div>
      <div class="list">
        <div v-for="account in store.accounts" :key="account.id" class="list-item">
          <div style="width:100%;">
            <div class="account-row">
              <div class="title">{{ account.name }}</div>
              <div class="account-amounts">
                <span class="positive">{{ formatMoney(t.allocatedByAccount[account.id] ?? 0) }}</span>
                <span class="negative">−{{ formatMoney(t.spentByAccount[account.id] ?? 0) }}</span>
              </div>
            </div>
            <div class="bar" style="margin-top:8px;">
              <span
                :style="{
                  width: barWidth(t.allocatedByAccount[account.id], t.spentByAccount[account.id]) + '%',
                  background: account.color
                }"
              ></span>
            </div>
            <div class="small" style="margin-top:4px;">{{ account.percent }}% от дохода</div>
          </div>
          <div class="dot" :style="{ background: account.color }" style="flex-shrink:0;"></div>
        </div>
      </div>
    </article>
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

function barWidth(allocated: number, spent: number) {
  if (!allocated || allocated <= 0) return 0
  return Math.min(100, Math.round((spent / allocated) * 100))
}
</script>

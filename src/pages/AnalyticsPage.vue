<template>
  <section class="page stack-lg">
    <div class="panel-head" style="padding:0;"><h2>Аналитика</h2></div>

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
      <article class="stat-card">
        <span>Остаток</span>
        <strong :class="t.freeCash >= 0 ? 'positive' : 'negative'">{{ formatMoney(t.freeCash) }}</strong>
      </article>
      <article class="stat-card">
        <span>Операций</span>
        <strong>{{ store.expenses.length + store.incomes.length }}</strong>
      </article>
    </div>

    <!-- Category breakdown -->
    <article class="panel">
      <div class="panel-head"><h2>По категориям</h2></div>
      <div class="list">
        <template v-if="categoryRows.length">
          <div v-for="row in categoryRows" :key="row.id" class="list-item">
            <div style="width:100%;">
              <div class="account-row">
                <div class="title">{{ row.name }}</div>
                <strong class="negative">{{ formatMoney(row.amount) }}</strong>
              </div>
              <div class="bar" style="margin-top:6px;">
                <span :style="{ width: row.pct + '%', background: row.color }"></span>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty">Нет трат в этом месяце.</div>
      </div>
    </article>

    <!-- Account balance breakdown -->
    <article class="panel">
      <div class="panel-head"><h2>Остатки по счетам</h2></div>
      <div class="list">
        <div v-for="acc in store.accounts" :key="acc.id" class="list-item">
          <div style="width:100%;">
            <div class="account-row">
              <div class="title">{{ acc.name }}</div>
              <strong :class="remainByAccount(acc.id) >= 0 ? 'positive' : 'negative'">
                {{ formatMoney(remainByAccount(acc.id)) }}
              </strong>
            </div>
            <div class="bar" style="margin-top:6px;">
              <span
                :style="{
                  width: barWidth(t.allocatedByAccount[acc.id], t.spentByAccount[acc.id]) + '%',
                  background: acc.color
                }"
              ></span>
            </div>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBudgetStore } from '../app/stores/budget'
import { useMoney } from '../composables/useMoney'

const store = useBudgetStore()
const { formatMoney } = useMoney()
const t = computed(() => store.totals)

const maxCatAmount = computed(() => Math.max(1, ...Object.values(t.value.spentByCategory)))

const categoryRows = computed(() =>
  store.categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      amount: t.value.spentByCategory[c.id] ?? 0,
      pct: Math.round(((t.value.spentByCategory[c.id] ?? 0) / maxCatAmount.value) * 100)
    }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
)

function remainByAccount(id: string) {
  return (t.value.allocatedByAccount[id] ?? 0) - (t.value.spentByAccount[id] ?? 0)
}

function barWidth(allocated: number, spent: number) {
  if (!allocated || allocated <= 0) return 0
  return Math.min(100, Math.round((spent / allocated) * 100))
}
</script>

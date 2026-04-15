<template>
  <section class="page stack-lg">
    <div class="hero-card">
      <div>
        <div class="eyebrow">Активный месяц</div>
        <h1>Бюджет месяца</h1>
      </div>
      <MonthSwitcher />
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <span>Доходы</span>
        <strong>{{ formatMoney(store.totalIncome) }}</strong>
      </article>
      <article class="stat-card">
        <span>Траты</span>
        <strong>{{ formatMoney(store.totalExpense) }}</strong>
      </article>
      <article class="stat-card wide">
        <span>Остаток</span>
        <strong>{{ formatMoney(store.balance) }}</strong>
      </article>
    </div>

    <article class="panel">
      <div class="panel-head">
        <h2>Счета и проценты</h2>
      </div>
      <div class="list">
        <div v-for="account in store.accounts" :key="account.id" class="list-item">
          <div>
            <div class="title">{{ account.name }}</div>
            <div class="small">{{ account.percent }}%</div>
          </div>
          <div class="dot" :style="{ background: account.color }"></div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { useBudgetStore } from '../app/stores/budget'
import MonthSwitcher from '../components/layout/MonthSwitcher.vue'

const store = useBudgetStore()

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
}
</script>

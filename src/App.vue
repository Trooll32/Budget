<template>
  <div class="shell">
    <header class="topbar">
      <div class="brand-row">
        <div class="brand-logo"></div>
        <div class="brand-copy">
          <strong class="brand-title">Budget</strong>
          <span class="brand-sub eyebrow">Семейный бюджет</span>
        </div>
      </div>
    </header>

    <main class="content" v-if="store.ready">
      <DashboardPage v-if="tab === 'dashboard'" />
      <IncomesPage v-else-if="tab === 'incomes'" />
      <ExpensesPage v-else-if="tab === 'expenses'" />
      <AnalyticsPage v-else-if="tab === 'analytics'" />
      <SettingsPage v-else />
    </main>

    <nav class="tabbar">
      <button :class="['tab-btn', { active: tab === 'dashboard' }]" @click="tab = 'dashboard'">Обзор</button>
      <button :class="['tab-btn', { active: tab === 'incomes' }]" @click="tab = 'incomes'">Доходы</button>
      <button class="tab-btn tab-add" @click="openAddExpense">+</button>
      <button :class="['tab-btn', { active: tab === 'expenses' }]" @click="tab = 'expenses'">Траты</button>
      <button :class="['tab-btn', { active: tab === 'settings' }]" @click="tab = 'settings'">Настройки</button>
    </nav>
  </div>

  <!-- Global Expense Sheet -->
  <ExpenseSheet v-if="expenseSheetOpen" :editing-id="editingExpenseId" @close="closeExpenseSheet" />
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { useBudgetStore } from './app/stores/budget'
import DashboardPage from './pages/DashboardPage.vue'
import IncomesPage from './pages/IncomesPage.vue'
import ExpensesPage from './pages/ExpensesPage.vue'
import AnalyticsPage from './pages/AnalyticsPage.vue'
import SettingsPage from './pages/SettingsPage.vue'
import ExpenseSheet from './components/sheets/ExpenseSheet.vue'

const tab = ref<'dashboard' | 'incomes' | 'expenses' | 'analytics' | 'settings'>('dashboard')
const store = useBudgetStore()
const expenseSheetOpen = ref(false)
const editingExpenseId = ref<string | null>(null)

onMounted(async () => {
  await store.init()
})

function openAddExpense() {
  editingExpenseId.value = null
  expenseSheetOpen.value = true
}

function openEditExpense(id: string) {
  editingExpenseId.value = id
  expenseSheetOpen.value = true
}

function closeExpenseSheet() {
  expenseSheetOpen.value = false
  editingExpenseId.value = null
}

provide('openEditExpense', openEditExpense)
provide('openAddExpense', openAddExpense)
</script>

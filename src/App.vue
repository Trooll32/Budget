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
      <button :class="['tab-btn', { active: tab === 'settings' }]" @click="tab = 'settings'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </nav>
  </div>

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

onMounted(async () => { await store.init() })

function openAddExpense() { editingExpenseId.value = null; expenseSheetOpen.value = true }
function openEditExpense(id: string) { editingExpenseId.value = id; expenseSheetOpen.value = true }
function closeExpenseSheet() { expenseSheetOpen.value = false; editingExpenseId.value = null }

provide('openEditExpense', openEditExpense)
provide('openAddExpense', openAddExpense)
</script>

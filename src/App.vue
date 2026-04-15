<template>
  <div class="shell">
    <header class="topbar">
      <div>
        <div class="eyebrow">Budget webview</div>
        <strong class="brand">Personal Budget</strong>
      </div>
    </header>

    <main class="content" v-if="store.ready">
      <DashboardPage v-if="tab === 'dashboard'" />
      <IncomesPage v-else-if="tab === 'incomes'" />
      <ExpensesPage v-else-if="tab === 'expenses'" />
      <SettingsPage v-else />
    </main>

    <nav class="tabbar">
      <button :class="['tab-btn', { active: tab === 'dashboard' }]" @click="tab = 'dashboard'">Обзор</button>
      <button :class="['tab-btn', { active: tab === 'incomes' }]" @click="tab = 'incomes'">Доходы</button>
      <button :class="['tab-btn', { active: tab === 'expenses' }]" @click="tab = 'expenses'">Траты</button>
      <button :class="['tab-btn', { active: tab === 'settings' }]" @click="tab = 'settings'">Настройки</button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBudgetStore } from './app/stores/budget'
import DashboardPage from './pages/DashboardPage.vue'
import IncomesPage from './pages/IncomesPage.vue'
import ExpensesPage from './pages/ExpensesPage.vue'
import SettingsPage from './pages/SettingsPage.vue'

const tab = ref<'dashboard' | 'incomes' | 'expenses' | 'settings'>('dashboard')
const store = useBudgetStore()

onMounted(async () => {
  await store.init()
})
</script>

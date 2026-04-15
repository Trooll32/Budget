<template>
  <div v-if="!authStore.ready" class="splash">
    <div class="splash-spinner"></div>
    <p class="splash-text" v-if="authStore.redirectPending">Возвращаемся...</p>
  </div>

  <div v-else-if="!authStore.isLoggedIn" class="login-screen">
    <div class="login-card">
      <div class="login-logo"></div>
      <h1 class="login-title">Budget</h1>
      <p class="login-sub">Семейный бюджет</p>
      <div v-if="authStore.error" class="login-error">{{ authStore.error }}</div>
      <button class="google-btn" @click="login" :disabled="loggingIn">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {{ loggingIn ? 'Переход на Google...' : 'Войти через Google' }}
      </button>
      <p class="login-hint">Войдите с одного аккаунта, чтобы данные были общими</p>
    </div>
  </div>

  <div v-else class="shell">
    <header class="topbar">
      <div class="brand-row">
        <div class="brand-logo"></div>
        <div class="brand-copy">
          <strong class="brand-title">Budget</strong>
          <span class="brand-sub eyebrow">Семейный бюджет</span>
        </div>
        <div class="topbar-user" v-if="authStore.photoURL">
          <img :src="authStore.photoURL" class="user-avatar" :alt="authStore.displayName ?? ''" />
        </div>
      </div>
    </header>

    <main class="content" v-if="budgetStore.ready">
      <DashboardPage v-if="tab === 'dashboard'" />
      <IncomesPage v-else-if="tab === 'incomes'" />
      <ExpensesPage v-else-if="tab === 'expenses'" />
      <AnalyticsPage v-else-if="tab === 'analytics'" />
      <SettingsPage v-else />
    </main>

    <!-- Дебаг: показываем ошибку если есть -->
    <div v-else-if="budgetError" class="content-error">
      <p class="error-title">Ошибка загрузки</p>
      <p class="error-msg">{{ budgetError }}</p>
      <button class="retry-btn" @click="retryBudget">Повторить</button>
    </div>

    <div v-else class="content-loading">
      <div class="splash-spinner"></div>
      <p class="loading-label">uid: {{ authStore.uid?.slice(0,8) }}</p>
    </div>

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
import { ref, onMounted, watch, provide } from 'vue'
import { useAuthStore } from './app/stores/auth'
import { useBudgetStore } from './app/stores/budget'
import DashboardPage from './pages/DashboardPage.vue'
import IncomesPage from './pages/IncomesPage.vue'
import ExpensesPage from './pages/ExpensesPage.vue'
import AnalyticsPage from './pages/AnalyticsPage.vue'
import SettingsPage from './pages/SettingsPage.vue'
import ExpenseSheet from './components/sheets/ExpenseSheet.vue'

const authStore = useAuthStore()
const budgetStore = useBudgetStore()
const tab = ref<'dashboard' | 'incomes' | 'expenses' | 'analytics' | 'settings'>('dashboard')
const expenseSheetOpen = ref(false)
const editingExpenseId = ref<string | null>(null)
const loggingIn = ref(false)
const budgetError = ref('')

async function initBudget() {
  budgetError.value = ''
  try {
    await budgetStore.init()
  } catch (e: any) {
    budgetError.value = e?.message ?? String(e)
    console.error('budgetStore.init error:', e)
  }
}

async function retryBudget() {
  budgetStore.ready = false
  await initBudget()
}

onMounted(async () => {
  await authStore.init()
  if (authStore.isLoggedIn) await initBudget()
})

watch(
  () => authStore.uid,
  async (uid) => {
    if (uid && !budgetStore.ready) {
      await initBudget()
    }
    if (!uid) {
      budgetStore.ready = false
      budgetError.value = ''
    }
  }
)

async function login() {
  loggingIn.value = true
  await authStore.loginWithGoogle()
  loggingIn.value = false
}

function openAddExpense() { editingExpenseId.value = null; expenseSheetOpen.value = true }
function openEditExpense(id: string) { editingExpenseId.value = id; expenseSheetOpen.value = true }
function closeExpenseSheet() { expenseSheetOpen.value = false; editingExpenseId.value = null }

provide('openEditExpense', openEditExpense)
provide('openAddExpense', openAddExpense)
</script>

<style scoped>
.splash {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--color-bg);
}
.splash-text { font-size: 14px; color: var(--color-text-muted); }
.content-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 60dvh;
}
.loading-label {
  font-size: 11px;
  font-family: monospace;
  color: var(--color-text-faint);
}
.content-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 60dvh;
  padding: 24px;
  text-align: center;
}
.error-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-negative);
}
.error-msg {
  font-size: 12px;
  font-family: monospace;
  color: var(--color-text-muted);
  word-break: break-all;
  max-width: 320px;
}
.retry-btn {
  padding: 10px 24px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}
.splash-spinner {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(139,108,255,.15);
  border-top-color: var(--color-primary);
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.login-screen {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #1a1e31 0%, #0b0d14 60%);
  padding: 24px;
}
.login-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}
.login-logo {
  width: 56px; height: 56px;
  border-radius: 18px;
  background: linear-gradient(180deg, var(--color-primary-2), var(--color-primary));
  box-shadow: 0 0 0 12px rgba(139,108,255,.08);
}
.login-title { font-size: 32px; font-weight: 800; letter-spacing: -.03em; margin-top: 8px; }
.login-sub { color: var(--color-text-muted); font-size: 15px; margin-top: -8px; }
.login-error {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: rgba(255,109,138,.12);
  border: 1px solid rgba(255,109,138,.25);
  color: var(--color-negative);
  font-size: 13px;
  text-align: left;
}
.google-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 0 20px;
  border-radius: var(--radius-md);
  background: rgba(255,255,255,.06);
  border: 1px solid var(--color-border);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  justify-content: center;
  transition: background var(--transition);
  margin-top: 8px;
}
.google-btn:active { background: rgba(255,255,255,.1); }
.google-btn:disabled { opacity: .6; }
.login-hint { font-size: 12px; color: var(--color-text-faint); max-width: 28ch; line-height: 1.5; }
.topbar-user { margin-left: auto; }
.user-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--color-border); object-fit: cover; }
</style>

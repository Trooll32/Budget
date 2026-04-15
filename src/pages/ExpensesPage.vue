<template>
  <section class="page stack-lg">
    <article class="panel">
      <div class="panel-head"><h2>Добавить трату</h2></div>
      <form class="stack" @submit.prevent="submit">
        <select v-model="accountId" class="field">
          <option disabled value="">Счёт</option>
          <option v-for="account in store.accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
        </select>
        <select v-model="categoryId" class="field">
          <option disabled value="">Категория</option>
          <option v-for="category in store.categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
        <input v-model.number="amount" class="field" type="number" placeholder="Сумма" />
        <input v-model="date" class="field" type="date" />
        <input v-model="note" class="field" placeholder="Комментарий" />
        <button class="primary-btn" type="submit">Сохранить трату</button>
      </form>
    </article>

    <article class="panel">
      <div class="panel-head"><h2>Траты месяца</h2></div>
      <div v-if="store.expenses.length" class="list">
        <div v-for="item in store.expenses" :key="item.id" class="list-item align-start">
          <div>
            <div class="title">{{ categoryName(item.categoryId) }}</div>
            <div class="small">{{ accountName(item.accountId) }} · {{ item.note || 'Без комментария' }} · {{ item.date }}</div>
          </div>
          <strong>{{ formatMoney(item.amount) }}</strong>
        </div>
      </div>
      <div v-else class="empty">Пока нет трат в этом месяце.</div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useBudgetStore } from '../app/stores/budget'

const store = useBudgetStore()
const accountId = ref('')
const categoryId = ref('')
const amount = ref<number | null>(null)
const date = ref(new Date().toISOString().slice(0, 10))
const note = ref('')

watch(
  () => store.accounts,
  (accounts) => {
    if (!accountId.value && accounts.length) accountId.value = accounts[0].id
  },
  { immediate: true }
)

watch(
  () => store.categories,
  (categories) => {
    if (!categoryId.value && categories.length) categoryId.value = categories[0].id
  },
  { immediate: true }
)

async function submit() {
  if (!accountId.value || !categoryId.value || !amount.value || amount.value <= 0) return
  await store.createExpense({ accountId: accountId.value, categoryId: categoryId.value, amount: amount.value, date: date.value, note: note.value.trim() })
  amount.value = null
  note.value = ''
  date.value = new Date().toISOString().slice(0, 10)
}

function accountName(id: string) {
  return store.accounts.find((item) => item.id === id)?.name ?? 'Счёт'
}

function categoryName(id: string) {
  return store.categories.find((item) => item.id === id)?.name ?? 'Категория'
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
}
</script>

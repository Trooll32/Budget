<template>
  <section class="page stack-lg">
    <article class="panel">
      <div class="panel-head"><h2>Добавить доход</h2></div>
      <form class="stack" @submit.prevent="submit">
        <input v-model="source" class="field" placeholder="Источник" />
        <input v-model.number="amount" class="field" type="number" placeholder="Сумма" />
        <input v-model="date" class="field" type="date" />
        <input v-model="note" class="field" placeholder="Комментарий" />
        <button class="primary-btn" type="submit">Сохранить доход</button>
      </form>
    </article>

    <article class="panel">
      <div class="panel-head"><h2>Доходы месяца</h2></div>
      <div v-if="store.incomes.length" class="list">
        <div v-for="item in store.incomes" :key="item.id" class="list-item align-start">
          <div>
            <div class="title">{{ item.source }}</div>
            <div class="small">{{ item.note || 'Без комментария' }} · {{ item.date }}</div>
          </div>
          <strong>{{ formatMoney(item.amount) }}</strong>
        </div>
      </div>
      <div v-else class="empty">Пока нет доходов в этом месяце.</div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetStore } from '../app/stores/budget'

const store = useBudgetStore()
const source = ref('')
const amount = ref<number | null>(null)
const date = ref(new Date().toISOString().slice(0, 10))
const note = ref('')

async function submit() {
  if (!source.value.trim() || !amount.value || amount.value <= 0) return
  await store.createIncome({ source: source.value.trim(), amount: amount.value, date: date.value, note: note.value.trim() })
  source.value = ''
  amount.value = null
  note.value = ''
  date.value = new Date().toISOString().slice(0, 10)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
}
</script>

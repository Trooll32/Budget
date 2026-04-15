<template>
  <section class="page stack-lg">
    <article class="panel">
      <div class="panel-head"><h2>Добавить доход</h2></div>
      <form class="stack" @submit.prevent="submit">
        <div class="two-col">
          <div class="field">
            <label>Источник</label>
            <input v-model="source" class="field-input" placeholder="Я, жена, бонус…" />
          </div>
          <div class="field">
            <label>Дата</label>
            <input v-model="date" class="field-input" type="date" />
          </div>
        </div>
        <div class="two-col">
          <div class="field">
            <label>Сумма</label>
            <input v-model.number="amount" class="field-input" type="number" min="0" step="0.01" placeholder="0" />
          </div>
          <div class="field">
            <label>Комментарий</label>
            <input v-model="note" class="field-input" placeholder="Аванс, зарплата…" />
          </div>
        </div>
        <button class="primary-btn" type="submit">Добавить доход</button>
      </form>
    </article>

    <article class="panel">
      <div class="panel-head"><h2>Доходы месяца</h2></div>
      <div v-if="store.incomes.length" class="list">
        <div v-for="item in sorted" :key="item.id" class="list-item align-start">
          <div style="flex:1;">
            <div class="title">{{ item.source }}</div>
            <div class="small">{{ item.note || 'Без комментария' }} · {{ formatDate(item.date) }}</div>
            <!-- allocation chips -->
            <div class="chips" style="margin-top:8px;">
              <span
                v-for="acc in store.accounts"
                :key="acc.id"
                class="chip"
              >{{ acc.name }}: {{ formatMoney(item.amount * (acc.percent / 100)) }}</span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div class="amount positive">+{{ formatMoney(item.amount) }}</div>
            <button class="mini-btn" style="margin-top:8px;" type="button" @click="remove(item.id)">Удалить</button>
          </div>
        </div>
      </div>
      <div v-else class="empty">Пока нет доходов в этом месяце.</div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBudgetStore } from '../app/stores/budget'
import { useMoney } from '../composables/useMoney'

const store = useBudgetStore()
const { formatMoney, formatDate, today } = useMoney()

const source = ref('')
const amount = ref<number | null>(null)
const date = ref(today())
const note = ref('')

const sorted = computed(() =>
  [...store.incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

async function submit() {
  if (!source.value.trim() || !amount.value || amount.value <= 0) return
  await store.createIncome({ source: source.value.trim(), amount: amount.value, date: date.value, note: note.value.trim() })
  source.value = ''
  amount.value = null
  note.value = ''
  date.value = today()
}

async function remove(id: string) {
  await store.deleteIncome(id)
}
</script>

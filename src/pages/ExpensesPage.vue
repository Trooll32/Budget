<template>
  <section class="page stack-lg">
    <article class="panel">
      <div class="panel-head">
        <h2>Траты месяца</h2>
        <button class="secondary-btn" type="button" @click="openAdd">+ Трата</button>
      </div>
      <div v-if="sorted.length" class="list">
        <div v-for="item in sorted" :key="item.id" class="list-item align-start">
          <div style="flex:1;">
            <div class="title">{{ item.note || 'Трата' }}</div>
            <div class="small">
              {{ accountName(item.accountId) }} · {{ categoryName(item.categoryId) }} · {{ formatDate(item.date) }}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div class="amount negative">−{{ formatMoney(item.amount) }}</div>
            <button class="mini-btn" style="margin-top:8px;" type="button" @click="openEdit(item.id)">Изменить</button>
          </div>
        </div>
      </div>
      <div v-else class="empty">Пока нет трат в этом месяце.</div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useBudgetStore } from '../app/stores/budget'
import { useMoney } from '../composables/useMoney'

const store = useBudgetStore()
const { formatMoney, formatDate } = useMoney()

const openAddExpense = inject<() => void>('openAddExpense')
const openEditExpense = inject<(id: string) => void>('openEditExpense')

const sorted = computed(() =>
  [...store.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

function accountName(id: string) {
  return store.accounts.find((a) => a.id === id)?.name ?? 'Счёт'
}

function categoryName(id: string) {
  return store.categories.find((c) => c.id === id)?.name ?? 'Категория'
}

function openAdd() {
  openAddExpense?.()
}

function openEdit(id: string) {
  openEditExpense?.(id)
}
</script>

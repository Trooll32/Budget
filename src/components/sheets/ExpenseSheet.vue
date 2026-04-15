<template>
  <Teleport to="body">
    <div class="sheet-backdrop open" @click="emit('close')">
      <div class="sheet open" @click.stop ref="sheetEl">
        <div class="sheet-handle" @touchstart.passive="dragStart" @touchmove.passive="dragMove" @touchend="dragEnd"></div>
        <div class="sheet-head">
          <div>
            <h3>{{ editingId ? 'Редактировать трату' : 'Новая трата' }}</h3>
            <p class="helper">Выбери счёт и категорию</p>
          </div>
          <button class="icon-btn" type="button" @click="emit('close')">×</button>
        </div>
        <form class="fields" @submit.prevent="submit">
          <div class="two-col">
            <div class="field">
              <label for="exp-date">Дата</label>
              <input id="exp-date" v-model="date" type="date" class="field-input" />
            </div>
            <div class="field">
              <label for="exp-amount">Сумма</label>
              <input id="exp-amount" v-model.number="amount" type="number" min="0" step="0.01" placeholder="0" class="field-input" />
            </div>
          </div>
          <div class="two-col">
            <div class="field">
              <label for="exp-account">Счёт</label>
              <select id="exp-account" v-model="accountId" class="field-input">
                <option v-for="a in store.accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </div>
            <div class="field">
              <label for="exp-category">Категория</label>
              <select id="exp-category" v-model="categoryId" class="field-input">
                <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label for="exp-note">Комментарий</label>
            <input id="exp-note" v-model="note" type="text" placeholder="Например: супермаркет" class="field-input" />
          </div>
          <div class="inline-actions">
            <button v-if="editingId" class="danger-btn" type="button" @click="deleteItem">Удалить</button>
            <button class="primary-btn" type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBudgetStore } from '../../app/stores/budget'
import { useMoney } from '../../composables/useMoney'

const props = defineProps<{ editingId: string | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useBudgetStore()
const { today } = useMoney()

const date = ref(today())
const amount = ref<number | null>(null)
const accountId = ref('')
const categoryId = ref('')
const note = ref('')
const sheetEl = ref<HTMLElement | null>(null)

let dragStartY = 0
let dragCurrentY = 0
let dragging = false

function dragStart(e: TouchEvent) {
  dragStartY = e.touches[0].clientY
  dragCurrentY = 0
  dragging = true
  if (sheetEl.value) sheetEl.value.style.transition = 'none'
}
function dragMove(e: TouchEvent) {
  if (!dragging) return
  dragCurrentY = Math.max(0, e.touches[0].clientY - dragStartY)
  if (sheetEl.value) sheetEl.value.style.transform = `translateY(${dragCurrentY}px)`
}
function dragEnd() {
  if (!dragging) return
  dragging = false
  if (sheetEl.value) sheetEl.value.style.transition = ''
  if (dragCurrentY > 120) { emit('close'); return }
  if (sheetEl.value) sheetEl.value.style.transform = ''
}

onMounted(() => {
  if (store.accounts.length) accountId.value = store.accounts[0].id
  if (store.categories.length) categoryId.value = store.categories[0].id

  if (props.editingId) {
    const item = store.expenses.find((e) => e.id === props.editingId)
    if (item) {
      date.value = item.date
      amount.value = item.amount
      accountId.value = item.accountId
      categoryId.value = item.categoryId
      note.value = item.note
    }
  }
})

async function submit() {
  if (!amount.value || amount.value <= 0) return
  const payload = {
    accountId: accountId.value,
    categoryId: categoryId.value,
    amount: amount.value,
    date: date.value,
    note: note.value.trim()
  }
  if (props.editingId) {
    await store.updateExpense(props.editingId, payload)
  } else {
    await store.createExpense(payload)
  }
  emit('close')
}

async function deleteItem() {
  if (!props.editingId) return
  await store.deleteExpense(props.editingId)
  emit('close')
}
</script>

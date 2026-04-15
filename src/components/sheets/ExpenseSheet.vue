<template>
  <Teleport to="body">
    <div class="sheet-backdrop open" @click="emit('close')">
      <div class="sheet open" @click.stop ref="sheetEl">

        <!-- Handle -->
        <div class="sheet-handle" @touchstart.passive="dragStart" @touchmove.passive="dragMove" @touchend="dragEnd"></div>

        <!-- Head -->
        <div class="sheet-head">
          <div>
            <h3>{{ editingId ? 'Редактировать трату' : 'Новая трата' }}</h3>
            <p class="helper">Выбери счёт и категорию</p>
          </div>
          <button class="icon-btn" type="button" @click="emit('close')">×</button>
        </div>

        <form class="es-form" @submit.prevent="submit">

          <!-- Amount (big) -->
          <div class="es-amount-wrap">
            <div class="es-amount__label">Сумма</div>
            <div class="es-amount__row">
              <span class="es-amount__currency">₽</span>
              <input
                ref="amountInput"
                v-model.number="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                class="es-amount__input"
                inputmode="decimal"
              />
            </div>
          </div>

          <!-- Date -->
          <div class="field">
            <label class="es-field-label">Дата</label>
            <input v-model="date" type="date" class="field-input" />
          </div>

          <!-- Account picker -->
          <div class="field">
            <label class="es-field-label">Счёт</label>
            <div class="es-picker">
              <button
                v-for="acc in store.accounts"
                :key="acc.id"
                type="button"
                class="es-pill"
                :class="{ 'es-pill--active': accountId === acc.id }"
                :style="accountId === acc.id ? { borderColor: acc.color, background: acc.color + '22' } : {}"
                @click="accountId = acc.id"
              >
                <span class="es-pill__dot" :style="{ background: acc.color }"></span>
                {{ acc.name }}
              </button>
            </div>
          </div>

          <!-- Category picker -->
          <div class="field">
            <label class="es-field-label">Категория</label>
            <div class="es-picker">
              <button
                v-for="cat in store.categories"
                :key="cat.id"
                type="button"
                class="es-pill"
                :class="{ 'es-pill--active': categoryId === cat.id }"
                :style="categoryId === cat.id ? { borderColor: cat.color, background: cat.color + '22' } : {}"
                @click="categoryId = cat.id"
              >
                <span class="es-pill__dot" :style="{ background: cat.color }"></span>
                {{ cat.name }}
              </button>
            </div>
          </div>

          <!-- Note -->
          <div class="field">
            <label class="es-field-label">Комментарий</label>
            <input v-model="note" type="text" placeholder="Например: супермаркет" class="field-input" />
          </div>

          <!-- Actions -->
          <div class="es-actions">
            <button v-if="editingId" class="danger-btn es-actions__del" type="button" @click="deleteItem">Удалить</button>
            <button
              class="primary-btn es-actions__save"
              type="submit"
              :disabled="!amount || amount <= 0 || !accountId || !categoryId"
            >Сохранить</button>
          </div>

        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
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
const amountInput = ref<HTMLInputElement | null>(null)

// ── Drag to close
let dragStartY = 0, dragCurrentY = 0, dragging = false
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

onMounted(async () => {
  // defaults
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

  // focus amount field
  await nextTick()
  amountInput.value?.focus()
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

<style scoped>
/* ── Amount block ───────────────────────────────────────────────── */
.es-form { display: grid; gap: var(--space-4); }

.es-amount-wrap {
  background: rgba(255,255,255,.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
}
.es-amount__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}
.es-amount__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.es-amount__currency {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-muted);
  line-height: 1;
}
.es-amount__input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 36px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
  letter-spacing: -.02em;
  width: 100%;
  -moz-appearance: textfield;
}
.es-amount__input::-webkit-outer-spin-button,
.es-amount__input::-webkit-inner-spin-button { -webkit-appearance: none; }
.es-amount__input::placeholder { color: var(--color-text-faint); }

/* ── Field label ──────────────────────────────────────────────────── */
.es-field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 8px;
  display: block;
}

/* ── Pill picker ───────────────────────────────────────────────────── */
.es-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.es-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: rgba(255,255,255,.04);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: color var(--transition), border-color var(--transition), background var(--transition);
  cursor: pointer;
}
.es-pill--active {
  color: var(--color-text);
  font-weight: 600;
}
.es-pill__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Actions ─────────────────────────────────────────────────────────── */
.es-actions {
  display: flex;
  gap: var(--space-3);
  padding-top: var(--space-2);
}
.es-actions__save { flex: 1; }
.es-actions__del { flex-shrink: 0; min-width: 100px; }
</style>

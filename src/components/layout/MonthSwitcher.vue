<template>
  <div class="ms-wrap">
    <button class="ms-btn" type="button" @click="open = !open">
      <span class="ms-btn__label">{{ store.activeMonthLabel }}</span>
      <span class="ms-btn__badge" v-if="!store.isCurrentMonth">Архив</span>
      <span class="ms-btn__chevron">▾</span>
    </button>

    <Teleport to="body">
      <div class="sheet-backdrop" :class="{ open }" @click="open = false">
        <div class="sheet" :class="{ open }" @click.stop>
          <div class="sheet-handle"></div>
          <div class="sheet-head">
            <div>
              <strong>Выбор месяца</strong>
              <p class="helper">Будущие месяцы недоступны</p>
            </div>
            <button class="icon-btn" type="button" @click="open = false">×</button>
          </div>
          <div class="sheet-list">
            <button
              v-for="month in store.months"
              :key="month.id"
              class="ms-item"
              :class="{
                'ms-item--active': month.id === store.activeMonthId,
                'ms-item--current': month.id === store.currentMonthId
              }"
              type="button"
              @click="selectMonth(month.id)"
            >
              <div class="ms-item__left">
                <span class="ms-item__dot" :class="month.id === store.currentMonthId ? 'ms-item__dot--current' : ''"></span>
                <div>
                  <div class="ms-item__label">{{ month.label }}</div>
                  <div class="ms-item__sub" v-if="month.id === store.currentMonthId">Текущий месяц</div>
                  <div class="ms-item__sub" v-else>Архив</div>
                </div>
              </div>
              <span v-if="month.id === store.activeMonthId" class="ms-item__check">✓</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetStore } from '../../app/stores/budget'

const store = useBudgetStore()
const open = ref(false)

async function selectMonth(monthId: string) {
  await store.switchMonth(monthId)
  open.value = false
}
</script>

<style scoped>
.ms-wrap { position: relative; }

.ms-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,.05);
  border: 1px solid var(--color-border);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  transition: background var(--transition);
}
.ms-btn:active { background: rgba(255,255,255,.1); }
.ms-btn__label { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ms-btn__badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: rgba(255,154,92,.15);
  color: #ff9a5c;
  text-transform: uppercase;
  letter-spacing: .05em;
}
.ms-btn__chevron { color: var(--color-text-muted); font-size: 11px; }

/* ── Sheet list items ────────────────────────────────────────── */
.ms-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 12px var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  text-align: left;
  transition: background var(--transition), border-color var(--transition);
}
.ms-item:active { background: rgba(255,255,255,.04); }
.ms-item--active {
  background: rgba(139,108,255,.08);
  border-color: rgba(139,108,255,.2);
}

.ms-item__left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ms-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,.2);
  flex-shrink: 0;
}
.ms-item__dot--current {
  background: var(--color-positive);
  box-shadow: 0 0 0 3px rgba(88,214,123,.2);
}
.ms-item__label {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  text-transform: capitalize;
}
.ms-item__sub {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 1px;
}
.ms-item__check {
  color: var(--color-primary-2);
  font-size: 16px;
  font-weight: 700;
}
</style>

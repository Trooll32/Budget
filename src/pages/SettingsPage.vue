<template>
  <section class="page">

    <h1 class="set-title">Настройки</h1>

    <!-- ── Профиль ──────────────────────────────────────────────── -->
    <div class="set-group-label">Аккаунт</div>
    <div class="set-group">
      <div class="profile-row">
        <img v-if="authStore.photoURL" :src="authStore.photoURL" class="profile-avatar" :alt="authStore.displayName ?? ''" />
        <div v-else class="profile-avatar-placeholder">{{ initials }}</div>
        <div class="profile-info">
          <span class="profile-name">{{ authStore.displayName ?? 'Пользователь' }}</span>
          <span class="profile-email">{{ authStore.user?.email ?? '' }}</span>
        </div>
      </div>
      <div class="set-group__divider"></div>
      <button class="set-row-btn set-row-btn--danger" type="button" @click="logout">
        <span class="set-row-btn__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </span>
        <span class="set-row-btn__text">
          <span class="set-row-btn__title">Выйти из аккаунта</span>
          <span class="set-row-btn__sub">Выйдете с текущего устройства</span>
        </span>
        <span class="set-row-btn__chevron">›</span>
      </button>
    </div>

    <!-- ── Group: Бюджет ─────────────────────────────────────────────── -->
    <div class="set-group-label">Бюджет</div>
    <div class="set-group">
      <button class="set-row-btn" type="button" @click="openSheet('accounts')">
        <span class="set-row-btn__icon">🏦</span>
        <span class="set-row-btn__text">
          <span class="set-row-btn__title">Счета</span>
          <span class="set-row-btn__sub">{{ store.accounts.length }} счёта · распределение доходов</span>
        </span>
        <span class="set-row-btn__chevron">›</span>
      </button>
      <div class="set-group__divider"></div>
      <button class="set-row-btn" type="button" @click="openSheet('categories')">
        <span class="set-row-btn__icon">🏷️</span>
        <span class="set-row-btn__text">
          <span class="set-row-btn__title">Категории</span>
          <span class="set-row-btn__sub">{{ store.categories.length }} категорий трат</span>
        </span>
        <span class="set-row-btn__chevron">›</span>
      </button>
    </div>

    <!-- ── Group: Данные ─────────────────────────────────────────────── -->
    <div class="set-group-label">Данные</div>
    <div class="set-group">
      <button class="set-row-btn" type="button" @click="downloadBackup">
        <span class="set-row-btn__icon">⬇️</span>
        <span class="set-row-btn__text">
          <span class="set-row-btn__title">Экспорт JSON</span>
          <span class="set-row-btn__sub">Скачать резервную копию</span>
        </span>
        <span class="set-row-btn__chevron">›</span>
      </button>
      <div class="set-group__divider"></div>
      <label class="set-row-btn" style="cursor:pointer;">
        <span class="set-row-btn__icon">⬆️</span>
        <span class="set-row-btn__text">
          <span class="set-row-btn__title">Импорт JSON</span>
          <span class="set-row-btn__sub">Восстановить из файла</span>
        </span>
        <span class="set-row-btn__chevron">›</span>
        <input type="file" accept="application/json" hidden @change="importBackup" />
      </label>
    </div>

    <!-- ── Group: Опасно ─────────────────────────────────────────────── -->
    <div class="set-group-label">Опасная зона</div>
    <div class="set-group set-group--danger">
      <button class="set-row-btn set-row-btn--danger" type="button" @click="reset">
        <span class="set-row-btn__icon">⚠️</span>
        <span class="set-row-btn__text">
          <span class="set-row-btn__title">Сбросить все данные</span>
          <span class="set-row-btn__sub">Нельзя отменить</span>
        </span>
        <span class="set-row-btn__chevron">›</span>
      </button>
    </div>

    <div style="height: var(--space-8);"></div>

    <!-- ── Sheet: Accounts ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <div class="sheet-backdrop" :class="{ open: activeSheet === 'accounts' }" @click="closeSheet">
        <div class="sheet" :class="{ open: activeSheet === 'accounts' }" @click.stop ref="sheetAccEl">
          <div class="sheet-handle" @touchstart.passive="dragStart($event, 'acc')" @touchmove.passive="dragMove($event, 'acc')" @touchend="dragEnd('acc')"></div>
          <div class="sheet-head">
            <div>
              <h3>Счета</h3>
              <p class="helper">Распределение доходов по %</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button class="set-sheet-add" type="button" @click="addAccount">+ Счёт</button>
              <button class="icon-btn" type="button" @click="closeSheet">×</button>
            </div>
          </div>
          <div class="set-rows">
            <div v-for="acc in draftAccounts" :key="acc.id" class="set-row">
              <input v-model="acc.color" type="color" class="set-color" />
              <input v-model="acc.name" class="set-row__name field-input" placeholder="Название" />
              <div class="set-row__percent-wrap">
                <input v-model.number="acc.percent" type="number" min="0" max="100" step="1" class="set-row__percent field-input" />
                <span class="set-row__pct-sign">%</span>
              </div>
              <button class="set-del-btn" type="button" @click="removeAccount(acc.id)">×</button>
            </div>
          </div>
          <div class="set-pct-bar">
            <div v-for="acc in draftAccounts" :key="acc.id" class="set-pct-bar__seg"
              :style="{ flex: acc.percent, background: acc.color }"
              :title="acc.name + ': ' + acc.percent + '%'"></div>
          </div>
          <div class="set-pct-total" :class="percentTotal === 100 ? 'positive' : 'negative'">
            {{ percentTotal === 100 ? '✔ 100%' : 'Сумма: ' + percentTotal + '% (должно быть 100%)' }}
          </div>
          <button class="primary-btn" type="button" :disabled="percentTotal !== 100" @click="saveAccounts">Сохранить счета</button>
        </div>
      </div>
    </Teleport>

    <!-- ── Sheet: Categories ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <div class="sheet-backdrop" :class="{ open: activeSheet === 'categories' }" @click="closeSheet">
        <div class="sheet" :class="{ open: activeSheet === 'categories' }" @click.stop ref="sheetCatEl">
          <div class="sheet-handle" @touchstart.passive="dragStart($event, 'cat')" @touchmove.passive="dragMove($event, 'cat')" @touchend="dragEnd('cat')"></div>
          <div class="sheet-head">
            <div>
              <h3>Категории</h3>
              <p class="helper">Типы трат</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button class="set-sheet-add" type="button" @click="addCategory">+ Кат.</button>
              <button class="icon-btn" type="button" @click="closeSheet">×</button>
            </div>
          </div>
          <div class="set-rows">
            <div v-for="cat in draftCategories" :key="cat.id" class="set-row">
              <input v-model="cat.color" type="color" class="set-color" />
              <input v-model="cat.name" class="set-row__name field-input" placeholder="Название" />
              <button class="set-del-btn" type="button" @click="removeCategory(cat.id)">×</button>
            </div>
          </div>
          <button class="primary-btn" type="button" @click="saveCategories">Сохранить категории</button>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBudgetStore } from '../app/stores/budget'
import { useAuthStore } from '../app/stores/auth'
import type { AccountRecord, CategoryRecord } from '../types/domain'

const store = useBudgetStore()
const authStore = useAuthStore()
const COLORS = ['#8b6cff', '#7ce5e0', '#58d67b', '#ff9a5c', '#ff6d8a', '#5c89ff']

const initials = computed(() => {
  const name = authStore.displayName ?? ''
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
})

async function logout() {
  if (!confirm('Выйти из аккаунта?')) return
  await authStore.logout()
}

const activeSheet = ref<'accounts' | 'categories' | null>(null)
const sheetAccEl = ref<HTMLElement | null>(null)
const sheetCatEl = ref<HTMLElement | null>(null)

function openSheet(s: 'accounts' | 'categories') { activeSheet.value = s }
function closeSheet() { activeSheet.value = null }

const dragState: Record<string, { startY: number; cur: number; going: boolean }> = {
  acc: { startY: 0, cur: 0, going: false },
  cat: { startY: 0, cur: 0, going: false }
}
function elOf(k: string) { return k === 'acc' ? sheetAccEl.value : sheetCatEl.value }
function dragStart(e: TouchEvent, k: string) {
  dragState[k].startY = e.touches[0].clientY
  dragState[k].cur = 0
  dragState[k].going = true
  const el = elOf(k); if (el) el.style.transition = 'none'
}
function dragMove(e: TouchEvent, k: string) {
  if (!dragState[k].going) return
  dragState[k].cur = Math.max(0, e.touches[0].clientY - dragState[k].startY)
  const el = elOf(k); if (el) el.style.transform = `translateY(${dragState[k].cur}px)`
}
function dragEnd(k: string) {
  if (!dragState[k].going) return
  dragState[k].going = false
  const el = elOf(k); if (el) el.style.transition = ''
  if (dragState[k].cur > 120) { closeSheet(); return }
  const el2 = elOf(k); if (el2) el2.style.transform = ''
}

const draftAccounts = ref<AccountRecord[]>([])
const draftCategories = ref<CategoryRecord[]>([])
watch(() => store.accounts, (v) => { draftAccounts.value = v.map((a) => ({ ...a })) }, { immediate: true })
watch(() => store.categories, (v) => { draftCategories.value = v.map((c) => ({ ...c })) }, { immediate: true })

const percentTotal = computed(() =>
  draftAccounts.value.reduce((s, a) => s + Number(a.percent || 0), 0)
)

function addAccount() {
  draftAccounts.value.push({ id: crypto.randomUUID(), name: 'Новый счёт', percent: 0, color: COLORS[draftAccounts.value.length % COLORS.length], archived: false })
}
function removeAccount(id: string) {
  if (draftAccounts.value.length <= 1) return
  draftAccounts.value = draftAccounts.value.filter((a) => a.id !== id)
}
async function saveAccounts() {
  if (percentTotal.value !== 100) return
  await store.saveAccounts(draftAccounts.value)
  closeSheet()
}

function addCategory() {
  draftCategories.value.push({ id: crypto.randomUUID(), name: 'Новая категория', color: COLORS[draftCategories.value.length % COLORS.length], archived: false })
}
function removeCategory(id: string) {
  if (draftCategories.value.length <= 1) return
  draftCategories.value = draftCategories.value.filter((c) => c.id !== id)
}
async function saveCategories() {
  if (draftCategories.value.some((c) => !c.name.trim())) return
  await store.saveCategories(draftCategories.value)
  closeSheet()
}

async function downloadBackup() {
  const content = await store.exportData()
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
async function importBackup(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try { await store.importData(await file.text()) } catch { alert('Ошибка импорта') }
  (e.target as HTMLInputElement).value = ''
}
async function reset() {
  if (!confirm('Сбросить все данные? Это действие нельзя отменить.')) return
  await store.resetAll()
}
</script>

<style scoped>
.set-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -.03em;
  margin-bottom: var(--space-5);
}
.set-group-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--color-text-muted);
  padding-left: var(--space-2);
  margin-bottom: 8px;
  margin-top: var(--space-4);
}
.set-group-label:first-of-type { margin-top: 0; }
.set-group {
  background: rgba(255,255,255,.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-2);
}
.set-group--danger {
  background: rgba(255,109,138,.04);
  border-color: rgba(255,109,138,.12);
}
.set-group__divider {
  height: 1px;
  background: rgba(255,255,255,.06);
  margin: 0 var(--space-4);
}

/* ── Profile row ──────────────────────────────────────────────────── */
.profile-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 14px var(--space-4);
}
.profile-avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  object-fit: cover;
  flex-shrink: 0;
}
.profile-avatar-placeholder {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.profile-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-email {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Row button ────────────────────────────────────────────────────── */
.set-row-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 14px var(--space-4);
  text-align: left;
  background: transparent;
  border: none;
  transition: background var(--transition);
}
.set-row-btn:active { background: rgba(255,255,255,.06); }
.set-row-btn--danger:active { background: rgba(255,109,138,.08); }
.set-row-btn__icon { font-size: 20px; flex-shrink: 0; width: 28px; text-align: center; display: flex; align-items: center; justify-content: center; color: var(--color-negative); }
.set-row-btn__text { flex: 1; min-width: 0; }
.set-row-btn__title { display: block; font-size: 15px; font-weight: 600; color: var(--color-text); }
.set-row-btn--danger .set-row-btn__title { color: var(--color-negative); }
.set-row-btn__sub { display: block; font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
.set-row-btn__chevron { font-size: 18px; color: var(--color-text-faint); flex-shrink: 0; }

/* ── Sheet internals ─────────────────────────────────────────────────── */
.set-sheet-add {
  height: 32px; padding: 0 12px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,.06);
  border: 1px solid var(--color-border);
  font-size: 12px; font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  transition: background var(--transition);
}
.set-sheet-add:active { background: rgba(255,255,255,.12); }
.set-rows { display: grid; gap: var(--space-2); margin-bottom: var(--space-3); }
.set-row { display: flex; align-items: center; gap: var(--space-2); }
.set-color { width: 32px; height: 32px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); padding: 2px; background: transparent; cursor: pointer; flex-shrink: 0; }
.set-row__name { flex: 1; min-width: 0; }
.set-row__percent-wrap { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.set-row__percent { width: 58px; text-align: right; }
.set-row__pct-sign { font-size: 13px; color: var(--color-text-muted); }
.set-del-btn { width: 30px; height: 30px; border-radius: var(--radius-sm); background: rgba(255,109,138,.08); border: 1px solid rgba(255,109,138,.15); color: var(--color-negative); font-size: 16px; flex-shrink: 0; transition: background var(--transition); }
.set-del-btn:active { background: rgba(255,109,138,.2); }
.set-pct-bar { display: flex; height: 6px; border-radius: var(--radius-full); overflow: hidden; gap: 2px; margin-bottom: 8px; }
.set-pct-bar__seg { border-radius: var(--radius-full); transition: flex .3s ease; min-width: 4px; }
.set-pct-total { font-size: 12px; font-weight: 600; margin-bottom: var(--space-4); }
.positive { color: var(--color-positive); }
.negative { color: var(--color-negative); }
</style>

import { defineStore } from 'pinia'
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

// Safari ITP блокирует cookies при cross-site redirect
// На desktop Safari работает popup, на iOS нужен redirect
function isMobileIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    ready: false,
    redirectPending: false,
    error: '' as string
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    uid: (state) => state.user?.uid ?? null,
    displayName: (state) => state.user?.displayName ?? null,
    photoURL: (state) => state.user?.photoURL ?? null
  },

  actions: {
    async init(): Promise<void> {
      this.error = ''

      // Устанавливаем localStorage персистенцию — сессия живёт между редиректами
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch (e) {
        console.warn('setPersistence failed:', e)
      }

      // Проверяем результат редиректа (iOS)
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          this.user = result.user
          this.ready = true
          return
        }
      } catch (e: any) {
        console.error('getRedirectResult error:', e)
        if (e?.code && e.code !== 'auth/no-auth-event') {
          this.error = e.message ?? 'Ошибка: ' + (e.code ?? '')
        }
      }

      // Обычная проверка сессии
      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
          this.user = user
          this.ready = true
          unsub()
          resolve()
        })
      })
    },

    async loginWithGoogle() {
      this.error = ''
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch (e) {
        console.warn('setPersistence failed:', e)
      }

      if (isMobileIOS()) {
        // iOS Safari: только redirect
        this.redirectPending = true
        try {
          await signInWithRedirect(auth, googleProvider)
        } catch (e: any) {
          this.redirectPending = false
          this.error = e.message ?? 'Ошибка входа'
        }
      } else {
        // Desktop Safari / Chrome: popup — надёжнее
        try {
          const result = await signInWithPopup(auth, googleProvider)
          this.user = result.user
        } catch (e: any) {
          // Если popup заблокирован — фаллбэк на redirect
          if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/popup-closed-by-user') {
            this.redirectPending = true
            await signInWithRedirect(auth, googleProvider)
          } else {
            this.error = e.message ?? 'Ошибка входа: ' + (e.code ?? '')
            console.error('signInWithPopup error:', e)
          }
        }
      }
    },

    async logout() {
      await signOut(auth)
      this.user = null
    }
  }
})

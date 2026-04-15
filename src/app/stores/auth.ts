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

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// iOS PWA standalone — добавлено на домашний экран
 function isIOSStandalone(): boolean {
  return isIOS() && (window.navigator as any).standalone === true
}

function isDesktop(): boolean {
  return !/iphone|ipad|ipod|android/i.test(navigator.userAgent)
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

      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch (e) {
        console.warn('setPersistence failed:', e)
      }

      // Проверяем redirect результат только если не iOS standalone
      if (!isIOSStandalone()) {
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
      }

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

      if (isDesktop()) {
        // Desktop: popup — самый надёжный
        try {
          const result = await signInWithPopup(auth, googleProvider)
          this.user = result.user
          return
        } catch (e: any) {
          if (e?.code !== 'auth/popup-blocked' && e?.code !== 'auth/popup-closed-by-user') {
            this.error = e.message ?? 'Ошибка: ' + (e.code ?? '')
            return
          }
          // popup заблокирован — фаллбэк на redirect
        }
      }

      if (isIOSStandalone()) {
        // iOS PWA standalone: popup через window.open —
        // открывается в SFSafariViewController и не теряет сессию PWA
        try {
          const result = await signInWithPopup(auth, googleProvider)
          this.user = result.user
          return
        } catch (e: any) {
          if (e?.code !== 'auth/popup-blocked' && e?.code !== 'auth/popup-closed-by-user') {
            this.error = e.message ?? 'Ошибка: ' + (e.code ?? '')
            return
          }
        }
      }

      // iOS Safari браузер (Android) — redirect
      this.redirectPending = true
      try {
        await signInWithRedirect(auth, googleProvider)
      } catch (e: any) {
        this.redirectPending = false
        this.error = e.message ?? 'Ошибка входа'
      }
    },

    async logout() {
      await signOut(auth)
      this.user = null
    }
  }
})

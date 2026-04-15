import { defineStore } from 'pinia'
import {
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

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

      // Сначала обрабатываем результат редиректа — это должно быть первым
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          this.user = result.user
          this.ready = true
          return  // уже авторизован, выходим
        }
      } catch (e: any) {
        console.error('getRedirectResult error:', e)
        if (e?.code && e.code !== 'auth/no-auth-event') {
          this.error = e.message ?? 'Ошибка авторизации: ' + (e.code ?? '')
        }
      }

      // Если редиректа не было — проверяем сессию через onAuthStateChanged
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
      this.redirectPending = true
      try {
        await signInWithRedirect(auth, googleProvider)
      } catch (e: any) {
        this.redirectPending = false
        this.error = e.message ?? 'Не удалось запустить вход'
        console.error('signInWithRedirect error:', e)
      }
    },

    async logout() {
      await signOut(auth)
      this.user = null
    }
  }
})

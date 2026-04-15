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
    redirectPending: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    uid: (state) => state.user?.uid ?? null,
    displayName: (state) => state.user?.displayName ?? null,
    photoURL: (state) => state.user?.photoURL ?? null
  },

  actions: {
    async init(): Promise<void> {
      // Сначала проверяем результат редиректа если есть
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          this.user = result.user
        }
      } catch (e) {
        console.error('Redirect result error:', e)
      }

      // Потом подписываемся на статус авторизации
      return new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
          this.user = user
          this.ready = true
          unsub()
          resolve()
        })
      })
    },

    async loginWithGoogle() {
      // Редирект — работает везде: WebView, Safari, GitLab Pages
      this.redirectPending = true
      await signInWithRedirect(auth, googleProvider)
      // Страница перезагрузится после возвращения с Google
    },

    async logout() {
      await signOut(auth)
      this.user = null
    }
  }
})

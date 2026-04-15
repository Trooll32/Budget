import { defineStore } from 'pinia'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    ready: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    uid: (state) => state.user?.uid ?? null,
    displayName: (state) => state.user?.displayName ?? null,
    photoURL: (state) => state.user?.photoURL ?? null
  },

  actions: {
    init(): Promise<void> {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          this.user = user
          this.ready = true
          resolve()
        })
      })
    },

    async loginWithGoogle() {
      const result = await signInWithPopup(auth, googleProvider)
      this.user = result.user
    },

    async logout() {
      await signOut(auth)
      this.user = null
    }
  }
})

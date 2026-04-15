import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAVbuOm2nQJIUMYj7Qd3xKeOjThY0VpY5U',
  authDomain: 'budget-app-a2d77.firebaseapp.com',
  projectId: 'budget-app-a2d77',
  storageBucket: 'budget-app-a2d77.firebasestorage.app',
  messagingSenderId: '993908016035',
  appId: '1:993908016035:web:d7eef94f6465e646c35016'
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
export const googleProvider = new GoogleAuthProvider()

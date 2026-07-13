import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getFunctions } from "firebase/functions"

const firebaseConfig = {
  apiKey: "AIzaSyDAJiNPRUrIlxG3OUah1VGP42f823en8CM",
  authDomain: "money-mind-90176.firebaseapp.com",
  projectId: "money-mind-90176",
  storageBucket: "money-mind-90176.firebasestorage.app",
  messagingSenderId: "754888879912",
  appId: "1:754888879912:web:7b57cac57f9b9c05216a1d"

};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)
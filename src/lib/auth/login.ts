import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();

  return signInWithPopup(auth, provider);
}

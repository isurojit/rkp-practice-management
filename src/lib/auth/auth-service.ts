import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../firebase";

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);

  const user = result.user;

  const userRef = doc(db, "users", user.uid);

  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      role: "employee",
      createdAt: serverTimestamp(),
    });
  }

  return user;
}

export async function loginEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerEmail(
  name: string,
  email: string,
  password: string,
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  await updateProfile(credential.user, {
    displayName: name,
  });

  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    name,
    email,
    role: "employee",
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

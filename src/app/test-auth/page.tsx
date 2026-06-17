"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function TestAuthPage() {
  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      await setDoc(
        doc(db, "users", result.user.uid),
        {
          uid: result.user.uid,
          name: result.user.displayName,
          email: result.user.email,
          role: "super_admin",
          createdAt: new Date(),
        },
        { merge: true },
      );

      console.log("Logged in");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        onClick={login}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Login with Google
      </button>
    </div>
  );
}

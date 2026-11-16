"use client";

// Shows a Google sign-in screen until an allowed account is signed in.
// Note: this only hides the UI. The real protection is firestore.rules, which
// refuse to return any data to accounts not on the list.
import { useEffect, useState } from "react";
import Image from "next/image";
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut } from "firebase/auth";
import { auth, climateAuth, climateIsSeparate } from "@/lib/firebase";
import { ALLOWED_EMAILS } from "@/lib/config";

const isAllowed = (user) => user?.emailVerified && ALLOWED_EMAILS.includes(user.email?.toLowerCase());

// The Raspberry Pi data lives in a second Firebase project. Reuse the same
// Google sign-in there so the climate tabs work too. If the climate project
// isn't set up for it (see README), the climate tabs show a notice instead.
export async function signInToClimate(result) {
  if (!climateIsSeparate) return;
  const cred = GoogleAuthProvider.credentialFromResult(result);
  if (!cred) return;
  try {
    await signInWithCredential(climateAuth, cred);
  } catch {
    try {
      // Fallback: the access token alone works without safelisting the OAuth client.
      await signInWithCredential(climateAuth, GoogleAuthProvider.credential(null, cred.accessToken));
    } catch (err) {
      console.warn("Climate project sign-in failed:", err.code || err.message);
    }
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  await signInToClimate(result);
  return result;
}

export function signOutEverywhere() {
  return Promise.all([signOut(auth), climateIsSeparate ? signOut(climateAuth) : null]);
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still checking
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const handleSignIn = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setError(err.message);
    }
  };

  if (user === undefined) return <div className="center-screen muted">Loading…</div>;

  if (!user || !isAllowed(user)) {
    return (
      <div className="center-screen">
        <div className="login-card">
          <Image src="/logo.png" alt="Hometown Harvest" width={120} height={120} className="login-logo" priority />
          <h1>Hometown Harvest Hub</h1>
          {user ? (
            <>
              <p className="error">{user.email} isn&apos;t allowed to use this dashboard.</p>
              <button className="btn" onClick={signOutEverywhere}>Sign out</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleSignIn}>Sign in with Google</button>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  return children;
}

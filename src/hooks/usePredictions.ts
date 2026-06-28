import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../lib/firebase";
import type { GroupId, GroupPrediction, KnockoutPrediction, Predictions } from "../types";

const storageKey = "world-cup-2026-predictions-v1";

const defaultPredictions: Predictions = {
  nickname: "",
  group: {},
  knockout: {},
  manualOrders: {},
  favoriteTeamIds: [],
  theme: "dark",
};

type AuthResult = {
  ok: boolean;
  message?: string;
};

function normalizePredictions(value: unknown): Predictions {
  if (!value || typeof value !== "object") return defaultPredictions;
  const parsed = value as Partial<Predictions>;
  return {
    nickname: typeof parsed.nickname === "string" ? parsed.nickname : "",
    group: parsed.group && typeof parsed.group === "object" ? parsed.group : {},
    knockout: parsed.knockout && typeof parsed.knockout === "object" ? parsed.knockout : {},
    manualOrders:
      parsed.manualOrders && typeof parsed.manualOrders === "object" ? parsed.manualOrders : {},
    favoriteTeamIds: Array.isArray(parsed.favoriteTeamIds) ? parsed.favoriteTeamIds.slice(0, 2) : [],
    theme: parsed.theme === "light" ? "light" : "dark",
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function userDoc(uid: string) {
  if (!db) throw new Error("Firestore no está configurado.");
  return doc(db, "users", uid);
}

async function ensureUserDocument(user: User, theme: Predictions["theme"]) {
  const reference = userDoc(user.uid);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    await setDoc(
      reference,
      {
        email: user.email,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }

  await setDoc(reference, {
    email: user.email,
    predictions: { ...defaultPredictions, theme },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

function authMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code.includes("auth/email-already-in-use")) return "Ese correo ya está registrado. Entra con tu contraseña.";
  if (code.includes("auth/invalid-credential")) return "Correo o contraseña incorrectos.";
  if (code.includes("auth/weak-password")) return "La contraseña debe tener al menos 6 caracteres.";
  if (code.includes("auth/too-many-requests")) return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  if (code.includes("auth/unauthorized-domain")) {
    return "Este dominio no está autorizado en Firebase. Agrega jhonatansolano.github.io en Authentication > Settings > Authorized domains.";
  }
  if (code.includes("auth/popup-closed-by-user")) return "Cerraste la ventana de Google antes de terminar.";
  if (code.includes("auth/cancelled-popup-request")) return "Ya hay una ventana de Google abierta. Ciérrala e inténtalo otra vez.";
  return "No pudimos completar la operación. Revisa tus datos e inténtalo de nuevo.";
}

export function usePredictions() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncReady, setSyncReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [predictions, setPredictions] = useState<Predictions>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? normalizePredictions(JSON.parse(raw)) : defaultPredictions;
    } catch {
      return defaultPredictions;
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = predictions.theme;
  }, [predictions.theme]);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser && !nextUser.emailVerified) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      setUser(nextUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setSyncReady(false);
      return;
    }

    setSyncReady(false);
    const unsubscribe: Unsubscribe = onSnapshot(userDoc(user.uid), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPredictions(normalizePredictions(data.predictions));
      } else {
        await setDoc(userDoc(user.uid), {
          email: user.email,
          predictions,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setSyncReady(true);
      setSyncStatus("saved");
    });

    return unsubscribe;
    // We intentionally subscribe by user only; prediction writes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(predictions));

    if (!user || !syncReady || !db) return;
    setSyncStatus("saving");
    const timeout = window.setTimeout(async () => {
      await setDoc(
        userDoc(user.uid),
        {
          email: user.email,
          predictions,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setSyncStatus("saved");
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [predictions, syncReady, user]);

  return useMemo(
    () => ({
      accountEmail: user?.email ?? null,
      authLoading,
      firebaseConfigured: isFirebaseConfigured,
      predictions,
      syncStatus,
      async login(email: string, password: string): Promise<AuthResult> {
        if (!auth) return { ok: false, message: "Firebase no está configurado todavía." };
        try {
          const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
          await reload(credential.user);
          if (!credential.user.emailVerified) {
            await sendEmailVerification(credential.user);
            await signOut(auth);
            return {
              ok: false,
              message: "Tu correo aún no está verificado. Te reenviamos el enlace de verificación.",
            };
          }
          return { ok: true };
        } catch (error) {
          return { ok: false, message: authMessage(error) };
        }
      },
      async register(email: string, password: string): Promise<AuthResult> {
        if (!auth) return { ok: false, message: "Firebase no está configurado todavía." };
        try {
          const credential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
          await sendEmailVerification(credential.user);
          await ensureUserDocument(credential.user, predictions.theme);
          await signOut(auth);
          return {
            ok: true,
            message: "Cuenta creada. Revisa tu correo, verifica tu cuenta y luego entra.",
          };
        } catch (error) {
          return { ok: false, message: authMessage(error) };
        }
      },
      async loginWithGoogle(): Promise<AuthResult> {
        if (!auth) return { ok: false, message: "Firebase no está configurado todavía." };
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          const credential = await signInWithPopup(auth, provider);
          await ensureUserDocument(credential.user, predictions.theme);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: authMessage(error) };
        }
      },
      async logout() {
        if (auth) await signOut(auth);
        setUser(null);
        setSyncReady(false);
      },
      pickGroup(matchId: string, value: GroupPrediction) {
        setPredictions((current) => ({
          ...current,
          group: { ...current.group, [matchId]: value },
        }));
      },
      pickKnockout(matchId: string, value: KnockoutPrediction) {
        setPredictions((current) => ({
          ...current,
          knockout: { ...current.knockout, [matchId]: value },
        }));
      },
      setManualOrder(scope: GroupId | "thirds", order: string[]) {
        setPredictions((current) => ({
          ...current,
          manualOrders: { ...current.manualOrders, [scope]: order },
        }));
      },
      toggleTheme() {
        setPredictions((current) => ({
          ...current,
          theme: current.theme === "dark" ? "light" : "dark",
        }));
      },
      setFavoriteTeams(teamIds: string[]) {
        setPredictions((current) => ({
          ...current,
          favoriteTeamIds: teamIds.slice(0, 2),
        }));
      },
      setNickname(nickname: string) {
        setPredictions((current) => ({
          ...current,
          nickname: nickname.trim().slice(0, 32),
        }));
      },
      reset() {
        setPredictions({
          ...defaultPredictions,
          nickname: predictions.nickname,
          favoriteTeamIds: predictions.favoriteTeamIds,
          theme: predictions.theme,
        });
      },
      importPredictions(next: Predictions) {
        setPredictions(normalizePredictions({ ...defaultPredictions, ...next }));
      },
    }),
    [authLoading, predictions, syncStatus, user],
  );
}

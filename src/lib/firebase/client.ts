"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

/**
 * Web SDK — inicialização idempotente (HMR-safe). Usar só no client.
 *
 * Init guardada: se `apiKey` não estiver presente (ex.: build sem env vars, ou
 * prerender no servidor), NÃO inicializa — evita `auth/invalid-api-key` derrubar
 * o build. Em runtime no browser, com as env `NEXT_PUBLIC_FIREBASE_*` definidas,
 * inicializa normalmente. Consumidores só usam `auth`/`db` em effects/handlers
 * (client-side), nunca durante o prerender.
 */
const app = getApps().length
  ? getApp()
  : firebaseConfig.apiKey
    ? initializeApp(firebaseConfig)
    : null;

export const auth = (app ? getAuth(app) : undefined) as Auth;
export const db = (app ? getFirestore(app) : undefined) as Firestore;
export { app };

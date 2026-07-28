import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, hasFirebaseConfig } from "./firebase.js";

// Mesma interface de antes ({get, set}), mas agora escolhe automaticamente
// onde salvar: nuvem (Firestore), se o usuário estiver logado com Google,
// ou localStorage do navegador, se não estiver.
export const storage = {
  async get(key) {
    const user = hasFirebaseConfig ? auth.currentUser : null;
    if (user) {
      try {
        const ref = doc(db, "users", user.uid, "data", key);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { key, value: snap.data().value };
      } catch (e) {
        console.error("Erro ao ler da nuvem:", e);
        return null;
      }
    }
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;
      return { key, value };
    } catch (e) {
      return null;
    }
  },

  async set(key, value) {
    const user = hasFirebaseConfig ? auth.currentUser : null;
    if (user) {
      try {
        const ref = doc(db, "users", user.uid, "data", key);
        await setDoc(ref, { value });
        return { key, value };
      } catch (e) {
        console.error("Erro ao salvar na nuvem:", e);
        return null;
      }
    }
    try {
      localStorage.setItem(key, value);
      return { key, value };
    } catch (e) {
      return null;
    }
  },
};

// Usado uma única vez, logo depois do login, para levar os dados que já
// existiam localmente para a nuvem (caso a nuvem ainda esteja vazia).
export async function migrateLocalToCloud(key) {
  if (!hasFirebaseConfig || !auth.currentUser) return;
  const local = localStorage.getItem(key);
  if (!local) return;
  const ref = doc(db, "users", auth.currentUser.uid, "data", key);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { value: local });
  }
}

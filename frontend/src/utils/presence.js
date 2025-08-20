// src/utils/presence.js
import { ref, onDisconnect, set, serverTimestamp } from "firebase/database";
import { rtdb } from "../firebase";

/**
 * Mark user as online and register onDisconnect to set offline automatically.
 * uid: user's auth uid
 * role: optional (e.g. 'service-provider')
 */
export const setUserOnline = async (uid, role = "service-provider") => {
  if (!uid) return;
  const statusRef = ref(rtdb, `status/${uid}`);

  // Make sure onDisconnect is registered BEFORE we set the user online.
  // onDisconnect().set() returns a promise that resolves when server knows about the onDisconnect.
  await onDisconnect(statusRef).set({
    online: false,
    lastSeen: serverTimestamp(),
    role,
  });

  // Now set online
  await set(statusRef, {
    online: true,
    lastSeen: serverTimestamp(),
    role,
  });
};

export const setUserOffline = async (uid, role = "service-provider") => {
  if (!uid) return;
  const statusRef = ref(rtdb, `status/${uid}`);
  await set(statusRef, {
    online: false,
    lastSeen: serverTimestamp(),
    role,
  });
};

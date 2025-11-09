// src/utils/chatUtils.js
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const getOrCreateChat = async (currentUser, otherUser) => {
  if (!currentUser?.uid || !otherUser?.uid) return null;

  const chatId = [currentUser.uid, otherUser.uid].sort().join("_");
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [currentUser.uid, otherUser.uid],
      lastMessage: "",
      lastTimestamp: serverTimestamp(),
    });
  }

  return chatId;
};

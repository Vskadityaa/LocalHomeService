// src/hooks/useNotifications.js
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

export default function useNotifications(currentUser) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalUnread = 0;
      let lastMsg = null;

      snapshot.docs.forEach((chatDoc) => {
        const data = chatDoc.data();
        if (data.lastMessage && data.lastSenderId !== currentUser.uid) {
          if (!data.seenBy?.includes(currentUser.uid)) {
            totalUnread++;
            lastMsg = data.lastMessage;
          }
        }
      });

      setUnreadCount(totalUnread);
      setLatestMessage(lastMsg);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return { unreadCount, latestMessage };
}

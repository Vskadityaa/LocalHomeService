// src/components/ChatList.js
import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import ChatWindow from "./ChatWindow";

const ChatList = ({ currentUser }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastTimestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  return (
    <div style={styles.container}>
      {!selectedChat ? (
        <>
          <h2>💬 My Chats</h2>
          {chats.length === 0 && <p>No chats yet</p>}
          {chats.map((chat) => {
            const otherId = chat.participants.find((id) => id !== currentUser.uid);
            return (
              <div
                key={chat.id}
                style={styles.chatItem}
                onClick={() => {
                  setSelectedChat(chat.id);
                  setOtherUser({ uid: otherId, name: chat.otherName || "User" });
                }}
              >
                <strong>{chat.otherName || "User"}</strong>
                <p style={{ margin: 0 }}>{chat.lastMessage}</p>
              </div>
            );
          })}
        </>
      ) : (
        <ChatWindow
          chatId={selectedChat}
          otherUser={otherUser}
          currentUser={currentUser}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </div>
  );
};

const styles = {
  container: { padding: 20, maxWidth: 400, margin: "auto" },
  chatItem: {
    padding: 12,
    borderBottom: "1px solid #ddd",
    cursor: "pointer",
  },
};

export default ChatList;

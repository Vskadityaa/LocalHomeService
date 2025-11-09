import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";

const ChatWindow = ({ chatId, currentUser, otherUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;
    const msgsRef = collection(db, "chats", chatId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);

      // mark unseen messages as seen
      snap.docs.forEach(async (docSnap) => {
        const msg = docSnap.data();
        if (!msg.seen && msg.senderId !== currentUser.uid) {
          await updateDoc(doc(db, "chats", chatId, "messages", docSnap.id), { seen: true });
        }
      });

      scrollToBottom();
    });

    return () => unsub();
  }, [chatId, currentUser.uid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    const msgsRef = collection(db, "chats", chatId, "messages");
    await addDoc(msgsRef, {
      text: newMsg.trim(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || "You",
      timestamp: serverTimestamp(),
      seen: false,
    });

    // update last message
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: newMsg.trim(),
      lastTimestamp: serverTimestamp(),
    });

    setNewMsg("");
    scrollToBottom();
  };

  const handleEnterPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>{otherUser.name || "User"}</h3>
          <button onClick={onClose} style={styles.closeBtn}>✖</button>
        </div>

        <div style={styles.messagesContainer}>
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <div
                key={msg.id}
                style={{
                  ...styles.messageBubble,
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  backgroundColor: isMe ? "#2563eb" : "#f3f4f6",
                  color: isMe ? "#fff" : "#111",
                }}
              >
                <span>{msg.text}</span>
                {msg.timestamp && (
                  <div style={styles.timestamp}>
                    {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={handleEnterPress}
            style={styles.input}
          />
          <button onClick={handleSend} style={styles.sendBtn}>Send</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3000,
  },
  modal: {
    display: "flex",
    flexDirection: "column",
    width: "400px",
    maxHeight: "80vh",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
    overflow: "hidden",
    animation: "fadeIn 0.3s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "12px 16px",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
  },
  messagesContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "12px",
    gap: "8px",
    overflowY: "auto",
    backgroundColor: "#f9fafb",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: "14px",
    fontSize: "14px",
    lineHeight: 1.4,
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  timestamp: {
    fontSize: "10px",
    color: "#6b7280",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #e5e7eb",
    gap: "8px",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "20px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
  },
  sendBtn: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },
};

export default ChatWindow;

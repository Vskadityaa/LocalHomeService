// src/pages/ChatPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";

const ChatPage = () => {
  const { clientId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return navigate("/auth");

    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (msg) =>
            (msg.fromId === currentUser.uid && msg.toId === clientId) ||
            (msg.fromId === clientId && msg.toId === currentUser.uid)
        );
      setMessages(filtered);
      window.scrollTo(0, document.body.scrollHeight); // auto scroll
    });

    return () => unsubscribe();
  }, [clientId, currentUser, navigate]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, "messages"), {
      fromId: currentUser.uid,
      toId: clientId,
      text: newMessage,
      timestamp: Date.now(),
    });
    setNewMessage("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Chat with Client</h2>
      <div style={{ maxHeight: "60vh", overflowY: "auto", marginBottom: "10px" }}>
        {messages.map((msg) => (
          <p
            key={msg.id}
            style={{
              textAlign: msg.fromId === currentUser.uid ? "right" : "left",
              background: msg.fromId === currentUser.uid ? "#2563eb" : "#e2e8f0",
              color: msg.fromId === currentUser.uid ? "white" : "black",
              padding: "6px 12px",
              borderRadius: "10px",
              margin: "4px 0",
              display: "inline-block",
              maxWidth: "70%",
            }}
          >
            {msg.text}
          </p>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          style={{ flex: 1, padding: "8px" }}
          placeholder="Type message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <button style={{ marginTop: "20px" }} onClick={() => navigate(-1)}>⬅️ Back</button>
    </div>
  );
};

export default ChatPage;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import ChatWindow from "./ChatWindow";

// Create chat if not exists
const getOrCreateChat = async (currentUser, otherUser) => {
  const chatId = [currentUser.uid, otherUser.uid].sort().join("_");
  const chatRef = doc(db, "chats", chatId);
  await setDoc(
    chatRef,
    { participants: [currentUser.uid, otherUser.uid], lastMessage: "", lastTimestamp: serverTimestamp() },
    { merge: true }
  );
  return chatId;
};

const ClientDashboard = () => {
  const [providers, setProviders] = useState([]);
  const [client, setClient] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [providerStatuses, setProviderStatuses] = useState({});
  const [chatUser, setChatUser] = useState(null);
  const [unseenChats, setUnseenChats] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();

  // Authentication & data fetch
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/auth");

      // Fetch Firestore user data
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      const data = userSnap.exists() ? userSnap.data() : {};

      setClient({
        uid: user.uid,
        email: user.email,
        name: data.name || "Client",
        imageURL: data.imageURL || "",
      });

      // Fetch providers
      const usersRef = collection(db, "users");
      const providerSnap = await getDocs(query(usersRef, where("role", "==", "service-provider")));
      setProviders(providerSnap.docs.map(d => ({ id: d.id, ...d.data(), uid: d.data().uid || d.id })));

      // Fetch bookings
      const bookingSnap = await getDocs(query(collection(db, "bookings"), where("clientId", "==", user.uid)));
      setBookings(bookingSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch unseen chats
      const chatsRef = collection(db, "chats");
      const chatsQuery = query(chatsRef, where("participants", "array-contains", user.uid));
      onSnapshot(chatsQuery, snap => {
        snap.docs.forEach(chatDoc => {
          const chatId = chatDoc.id;
          onSnapshot(collection(db, "chats", chatId, "messages"), msgsSnap => {
            const unseen = msgsSnap.docs.filter(m => !m.data().seen && m.data().senderId !== user.uid);
            setUnseenChats(prev => ({ ...prev, [chatId]: unseen.length }));
          });
        });
      });
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // Provider online/offline status
  useEffect(() => {
    const dbRealtime = getDatabase();
    const statusRef = ref(dbRealtime, "/status");
    onValue(statusRef, snapshot => setProviderStatuses(snapshot.val() || {}));
  }, []);

  // Handlers
  const toggleSidebar = () => setShowSidebar(prev => !prev);
  const handleLogout = async () => { await signOut(auth); navigate("/auth"); };
  const handleBookNow = (provider) => navigate("/service-details", { state: { provider, client } });
  const handleChatNow = async (provider) => {
    if (!client || !provider) return;
    const chatId = await getOrCreateChat(client, provider);
    setChatUser({ ...provider, chatId });
    setUnseenChats(prev => ({ ...prev, [chatId]: 0 }));
  };
  const goToProfile = () => navigate("/client-profile");

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <div style={styles.navbar}>
  <div style={styles.navLeft} onClick={toggleSidebar}>
    <span style={styles.navTitle}>Client Dashboard</span>
  </div>

  <div style={styles.navRight}>
    <div style={styles.clientProfileTop} onClick={goToProfile}>
      {/* Removed <img> */}
      <span style={styles.clientNameTop}>{client?.name}</span>
    </div>
    <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
  </div>
</div>

{/* Sidebar */}
{showSidebar && (
  <div style={styles.sidebar}>
    <div style={styles.sidebarHeader}>
      <button onClick={toggleSidebar} style={styles.closeButton}>❌</button>
      {/* Removed <img> */}
      <h3>{client?.name}</h3>
      <p>{client?.email}</p>
    </div>
  </div>
)}

      {/* Welcome */}
      <div style={styles.nameContainer}>
        <span style={styles.clientName}>Welcome, {client?.name}</span>
      </div>

      {/* Providers */}
      <div style={styles.content}>
        <h3 style={styles.sectionTitle}>📋 Available Service Providers</h3>
        <div style={styles.cardContainer}>
          {providers.map(provider => {
            const isOnline = providerStatuses[provider.uid]?.online;
            const chatId = [client?.uid, provider.uid].sort().join("_");
            const unseen = unseenChats[chatId] || 0;

            return (
              <div key={provider.id} style={styles.card}>
                <h4 style={styles.cardTitle}>{provider.serviceType}</h4>
                <p><strong>Name:</strong> {provider.name}</p>
                <p><strong>Phone:</strong> {provider.phone || "N/A"}</p>
                <p><strong>Price:</strong> ₹{provider.price || "N/A"}</p>
                <p><strong>Status:</strong>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: isOnline ? "#bbf7d0" : "#fecaca",
                    color: isOnline ? "#166534" : "#991b1b"
                  }}>
                    {isOnline ? "🟢 Online" : "🔴 Offline"}
                  </span>
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button style={styles.bookButton} onClick={() => handleBookNow(provider)}>Book Now</button>
                  <button style={styles.chatButton} onClick={() => handleChatNow(provider)}>
                    💬 Chat {unseen > 0 && <span style={styles.badge}>{unseen}</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Booking History */}
        <h3 style={styles.sectionTitle}>📖 Your Booking History</h3>
        <div style={styles.historyBox}>
          {bookings.length === 0 ? (<p>No bookings yet.</p>) : (
            bookings.map((b, i) => (
              <div key={i} style={styles.historyItem}>
                <h4>{b.serviceType}</h4>
                <p><strong>Provider:</strong> {b.providerName}</p>
                <p><strong>Status:</strong> {b.status}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {chatUser && <ChatWindow chatId={chatUser.chatId} currentUser={client} otherUser={chatUser} onClose={() => setChatUser(null)} />}
    </div>
  );
};

// ===== Styles =====
const styles = {
  page: { fontFamily: "Poppins, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "40px" },
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", background: "linear-gradient(90deg,#2563eb,#1e40af)", color: "#fff", position: "sticky", top: 0, zIndex: 100 },
  navLeft: { display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" },
  navRight: { display: "flex", alignItems: "center", gap: "12px" },
  navTitle: { fontSize: "20px", fontWeight: 600, color: "#fff" },
  logoutButton: { backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", cursor: "pointer" },
  clientProfileTop: { display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#e0f2fe", padding: "6px 10px", borderRadius: "12px", cursor: "pointer" },
  clientImageTop: { width: "35px", height: "35px", borderRadius: "50%", border: "2px solid #38bdf8" },
  clientNameTop: { fontSize: "14px", fontWeight: 600, color: "#1e293b" },
  sidebar: { position: "fixed", top: 0, left: 0, width: "250px", height: "100%", backgroundColor: "#1e293b", color: "#fff", zIndex: 1000, padding: "28px", boxShadow: "4px 0 12px rgba(0,0,0,0.4)" },
  sidebarHeader: { textAlign: "center", marginBottom: "30px", position: "relative" },
  closeButton: { position: "absolute", right: 0, top: 0, background: "transparent", border: "none", color: "white", fontSize: "20px", cursor: "pointer" },
  profileImageLarge: { width: "100px", height: "100px", borderRadius: "50%", marginBottom: "10px", border: "3px solid #38bdf8" },
  nameContainer: { display: "flex", justifyContent: "center", margin: "40px 0 20px" },
  clientName: { fontSize: "28px", fontWeight: "700", color: "#1e293b", backgroundColor: "#e0f2fe", padding: "12px 24px", borderRadius: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" },
  content: { padding: "20px" },
  sectionTitle: { marginTop: "30px", marginBottom: "20px", fontSize: "22px", fontWeight: 600, color: "#334155" },
  cardContainer: { display: "flex", flexWrap: "wrap", gap: "20px" },
  card: { backgroundColor: "#fff", borderRadius: "12px", padding: "20px", width: "260px", boxShadow: "0 6px 16px rgba(0,0,0,0.08)", transition: "transform 0.2s ease, box-shadow 0.2s ease" },
  cardTitle: { fontSize: "18px", fontWeight: 600, marginBottom: "10px", color: "#1e40af" },
  statusBadge: { display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  bookButton: { flex: 1, padding: "8px 12px", background: "linear-gradient(90deg,#2563eb,#1e40af)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 },
  chatButton: { flex: 1, padding: "8px 12px", background: "linear-gradient(90deg,#10b981,#047857)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, position: "relative" },
  badge: { position: "absolute", top: "-6px", right: "-6px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "50%", padding: "2px 6px", fontSize: "12px" },
  historyBox: { display: "flex", flexDirection: "column", gap: "12px" },
  historyItem: { backgroundColor: "#fff", padding: "14px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }
};

export default ClientDashboard;

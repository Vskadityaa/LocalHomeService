import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref as rtdbRef, set as rtdbSet, onDisconnect } from "firebase/database";
import { useNavigate } from "react-router-dom";
import ChatWindow from "./ChatWindow";
import "./ProviderDashboard.css";

const ProviderDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [providerInfo, setProviderInfo] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [unreadChats, setUnreadChats] = useState({});
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [phone, setPhone] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const messageUnsubsRef = useRef({});

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // ====== Auth & Real-time Bookings ======
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/auth");
      setCurrentUser(user);

      // Provider online/offline status
      const dbRealtime = getDatabase();
      const statusRef = rtdbRef(dbRealtime, `/status/${user.uid}`);
      rtdbSet(statusRef, { online: true, lastSeen: Date.now() });
      onDisconnect(statusRef).set({ online: false, lastSeen: Date.now() });

      // Provider info
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        setProviderInfo(docSnap.data());
        setPhone(docSnap.data()?.phone || "");
      } else {
        await setDoc(doc(db, "users", user.uid), { role: "service-provider", createdAt: serverTimestamp() }, { merge: true });
      }

      // Real-time bookings
      const bookingsRef = collection(db, "bookings");
      const bookingsQuery = query(bookingsRef, where("providerId", "==", user.uid));

      const unsubBookings = onSnapshot(bookingsQuery, async (snapshot) => {
        const enrichedBookings = await Promise.all(
          snapshot.docs.map(async (d) => {
            const b = { id: d.id, ...d.data() };
            if (b.clientId) {
              const clientDoc = await getDoc(doc(db, "users", b.clientId));
              if (clientDoc.exists()) b.clientDetails = clientDoc.data();
            }
            return b;
          })
        );
        enrichedBookings.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setBookings(enrichedBookings);
      });

      // Real-time chat unread messages
      const chatsRef = collection(db, "chats");
      const chatsQuery = query(chatsRef, where("participants", "array-contains", user.uid));
      onSnapshot(chatsQuery, snap => {
        snap.docs.forEach(chatDoc => {
          const chatId = chatDoc.id;
          if (messageUnsubsRef.current[chatId]) return;

          const msgsUnsub = onSnapshot(collection(db, "chats", chatId, "messages"), msgsSnap => {
            const msgs = msgsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const unseen = msgs.filter(m => !m.seen && m.senderId !== user.uid);
            setUnreadChats(prev => ({ ...prev, [chatId]: unseen.length }));
          });

          messageUnsubsRef.current[chatId] = msgsUnsub;
        });
      });

      return () => unsubBookings();
    });

    return () => {
      unsubAuth();
      Object.values(messageUnsubsRef.current).forEach(u => u && u());
    };
  }, [navigate]);

  // ====== Actions ======
  const handleLogout = async () => {
    if (currentUser) {
      const dbRealtime = getDatabase();
      const statusRef = rtdbRef(dbRealtime, `/status/${currentUser.uid}`);
      await rtdbSet(statusRef, { online: false, lastSeen: Date.now() });
    }
    await signOut(auth);
    navigate("/auth");
  };

  const confirmBooking = async (bookingId) => {
    await updateDoc(doc(db, "bookings", bookingId), { status: "Approved" });
  };

  const rejectBooking = async (bookingId) => {
    await updateDoc(doc(db, "bookings", bookingId), { status: "Rejected" });
  };

  const completeBooking = async (bookingId) => {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) return;
    const bookingData = bookingSnap.data();
    // Do NOT release payment yet, client pays after completion
    await updateDoc(bookingRef, { status: "Completed" });
  };

  const updatePhone = async () => {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), { phone });
    setProviderInfo(prev => ({ ...prev, phone }));
    alert("Phone number updated!");
  };

  const openChat = async (clientObj) => {
    if (!clientObj || !currentUser) return;
    const clientUid = clientObj.id || clientObj.uid || clientObj.clientId;
    const chatId = [currentUser.uid, clientUid].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists())
      await setDoc(chatRef, { participants: [currentUser.uid, clientUid], createdAt: serverTimestamp(), lastMessage: "", lastTimestamp: serverTimestamp() });
    setChatUser({ uid: clientUid, name: clientObj?.name || clientObj?.clientName || clientObj?.email, chatId });
    setUnreadChats(prev => ({ ...prev, [chatId]: 0 }));
  };

  // ====== Stats ======
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === "Pending").length;
  const approvedBookings = bookings.filter(b => b.status === "Approved").length;
  const completedBookings = bookings.filter(b => b.status === "Completed").length;
  const earnings = bookings
    .filter(b => b.status === "Completed" && b.paymentReleased)
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const menuItems = ["Dashboard", "Bookings", "Profile", "Settings"];

  return (
    <div className="dashboard-wrapper">
      <button className="hamburger-btn" onClick={toggleSidebar}>☰</button>

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2>{providerInfo?.name || "Provider"}</h2>
        <ul>
          {menuItems.map(item => (
            <li key={item} className={activeMenu === item ? "active" : ""} onClick={() => { setActiveMenu(item); toggleSidebar(); }}>
              {item}
            </li>
          ))}
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </div>

      <div className="main-content">
        {activeMenu === "Dashboard" && (
          <>
            <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#1890ff" }}>
              Welcome, {providerInfo?.name || "Provider"}!
            </h2>

            <div className="stats-grid">
              <div className="stat-card"><h3>{totalBookings}</h3><p>Total Bookings</p></div>
              <div className="stat-card"><h3>{pendingBookings}</h3><p>Pending</p></div>
              <div className="stat-card"><h3>{approvedBookings}</h3><p>Approved</p></div>
              <div className="stat-card"><h3>{completedBookings}</h3><p>Completed</p></div>
              <div className="stat-card"><h3>₹{earnings}</h3><p>Earnings</p></div>
            </div>

            <h3 className="section-title">Recent Bookings</h3>
            <div className="bookings-grid">
              {bookings.slice(0, 5).map(b => {
                const chatId = [currentUser?.uid, b.clientId].sort().join("_");
                const unread = unreadChats[chatId] || 0;
                let statusClass = b.status === "Pending" ? "status-pending" : b.status === "Approved" ? "status-approved" : "status-completed";

                return (
                  <div key={b.id} className="booking-card">
                    <div>
                      <p><strong>Client:</strong> {b.clientDetails?.name || b.clientName}</p>
                      <p><strong>Email:</strong> {b.clientDetails?.email}</p>
                      <p><strong>Phone:</strong> {b.clientDetails?.phone || "N/A"}</p>
                      <p><strong>Status:</strong> <span className={statusClass}>{b.status}</span></p>
                      {b.status === "Completed" && b.paymentReleased && <p><strong>Amount Paid:</strong> ₹{b.amount}</p>}
                    </div>
                    <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {b.status === "Pending" && (
                        <>
                          <button onClick={() => confirmBooking(b.id)} className="action-btn approve">✅ Approve</button>
                          <button onClick={() => rejectBooking(b.id)} className="action-btn reject">❌ Reject</button>
                        </>
                      )}
                      {b.status === "Approved" && (
                        <button onClick={() => completeBooking(b.id)} className="action-btn complete">✔️ Mark Completed</button>
                      )}
                      <button onClick={() => openChat({ id: b.clientId, ...b.clientDetails })} className="action-btn chat">
                        💬 Chat {unread > 0 && `(${unread})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeMenu === "Bookings" && (
          <div className="bookings-grid">
            {bookings.map(b => {
              const chatId = [currentUser?.uid, b.clientId].sort().join("_");
              const unread = unreadChats[chatId] || 0;
              let statusClass = b.status === "Pending" ? "status-pending" : b.status === "Approved" ? "status-approved" : "status-completed";

              return (
                <div key={b.id} className="booking-card">
                  <div>
                    <p><strong>Client:</strong> {b.clientDetails?.name || b.clientName}</p>
                    <p><strong>Email:</strong> {b.clientDetails?.email}</p>
                    <p><strong>Phone:</strong> {b.clientDetails?.phone || "N/A"}</p>
                    <p><strong>Status:</strong> <span className={statusClass}>{b.status}</span></p>
                    {b.status === "Completed" && b.paymentReleased && <p><strong>Amount Paid:</strong> ₹{b.amount}</p>}
                  </div>
                  <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {b.status === "Pending" && (
                      <>
                        <button onClick={() => confirmBooking(b.id)} className="action-btn approve">✅ Approve</button>
                        <button onClick={() => rejectBooking(b.id)} className="action-btn reject">❌ Reject</button>
                      </>
                    )}
                    {b.status === "Approved" && (
                      <button onClick={() => completeBooking(b.id)} className="action-btn complete">✔️ Mark Completed</button>
                    )}
                    <button onClick={() => openChat({ id: b.clientId, ...b.clientDetails })} className="action-btn chat">
                      💬 Chat {unread > 0 && `(${unread})`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeMenu === "Profile" && (
          <div>
            <h3>Profile Information</h3>
            <p><strong>Name:</strong> {providerInfo?.name}</p>
            <p><strong>Email:</strong> {currentUser?.email}</p>
            <p>
              <strong>Phone no:</strong>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ marginLeft: "10px" }} />
              <button onClick={updatePhone} style={{ marginLeft: "10px" }}>Update</button>
            </p>
          </div>
        )}

        {activeMenu === "Settings" && (
          <div>
            <h3>Settings</h3>
            <p>Coming soon...</p>
          </div>
        )}

        {chatUser && currentUser && (
          <ChatWindow
            chatId={chatUser.chatId}
            currentUser={{ uid: currentUser.uid, displayName: providerInfo?.name, email: currentUser.email }}
            otherUser={{ uid: chatUser.uid, name: chatUser.name }}
            onClose={() => setChatUser(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;

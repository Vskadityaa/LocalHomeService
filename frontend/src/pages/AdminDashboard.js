// src/AdminDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "../firebase";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line
} from "recharts";

/* -----------------------
  Small UI helpers
----------------------- */
function StatCard({ title, value, sub }) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 14, opacity: 0.8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <strong>{title}</strong>
          <button onClick={onClose} style={styles.modalClose}>✕</button>
        </div>
        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

/* -----------------------
  Admin Dashboard
----------------------- */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [userRole, setUserRole] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");

  const [timeFilter, setTimeFilter] = useState("overall");
  const [revenueFiltered, setRevenueFiltered] = useState(0);
  const [bookingsFiltered, setBookingsFiltered] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);

  // Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  /* -----------------------
    Fetch Data
  ----------------------- */
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubscribeBookings = onSnapshot(collection(db, "bookings"), (snapshot) => {
      const bookingsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setBookings(bookingsData);

      // Revenue + pending payouts
      let totalRevenue = 0;
      let pending = 0;
      bookingsData.forEach(b => {
        const amount = Number(b.amount ?? 0);
        const isPaid = b.paid === true || b.status === "completed" || b.status === "paid";
        if (isPaid) totalRevenue += amount;
        else pending += amount;
      });
      setRevenueFiltered(totalRevenue);
      setPendingPayouts(pending);
      setBookingsFiltered(bookingsData.length);
    });

    const unsubscribeReviews = onSnapshot(collection(db, "reviews"), (snapshot) => {
      setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeBookings();
      unsubscribeReviews();
    };
  }, []);

  /* -----------------------
    Helpers
  ----------------------- */
  const filterBookingsByTime = (bookings, filter) => {
    const now = new Date();
    return bookings.filter(b => {
      if (!b.createdAt?.toDate) return false;
      const created = b.createdAt.toDate();
      if (filter === "weekly") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return created >= oneWeekAgo;
      } else if (filter === "monthly") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return created >= oneMonthAgo;
      }
      return true;
    });
  };

  const filterUsersByTime = (users, filter) => {
    const now = new Date();
    return users.filter(u => {
      if (!u.createdAt?.toDate) return false;
      const created = u.createdAt.toDate();
      if (filter === "weekly") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return created >= oneWeekAgo;
      } else if (filter === "monthly") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return created >= oneMonthAgo;
      }
      return true;
    });
  };

  /* -----------------------
    Filtered Data
  ----------------------- */
  const filteredUsers = useMemo(() => {
    const timeFiltered = filterUsersByTime(users, timeFilter);
    return timeFiltered.filter(u => {
      const roleOk = userRole === "all" || (u.role || "").toLowerCase() === userRole;
      const q = userSearch.trim().toLowerCase();
      return (
        roleOk &&
        (!q ||
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q))
      );
    });
  }, [users, userRole, userSearch, timeFilter]);

  const filteredBookings = useMemo(() => {
    const timeFiltered = filterBookingsByTime(bookings, timeFilter);
    return timeFiltered.filter(b => {
      const statusOk = bookingStatus === "all" || (b.status || "").toLowerCase() === bookingStatus;
      const q = bookingSearch.trim().toLowerCase();
      return (
        statusOk &&
        (!q ||
          (b.clientId || "").toLowerCase().includes(q) ||
          (b.providerId || "").toLowerCase().includes(q))
      );
    });
  }, [bookings, bookingStatus, bookingSearch, timeFilter]);

  /* -----------------------
    Actions
  ----------------------- */
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/Auth");
  };

  const toggleBlockUser = async (uid, currentlyBlocked) => {
    await updateDoc(doc(db, "users", uid), { blocked: !currentlyBlocked });
  };

  const approveProvider = async (uid, approve = true) => {
    await updateDoc(doc(db, "users", uid), { approved: approve });
  };

  const handleDeleteUser = async (uid) => {
    await deleteDoc(doc(db, "users", uid));
  };

  const sendResetEmail = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const cancelBooking = async (id) => {
    await updateDoc(doc(db, "bookings", id), { status: "cancelled" });
  };

  const handleDeleteBooking = async (id) => {
    await deleteDoc(doc(db, "bookings", id));
  };

  const getUserName = (id) => users.find((u) => u.id === id)?.name || "—";

  /* -----------------------
    Charts
  ----------------------- */
  const bookingsStatusData = useMemo(() => {
    const statuses = { pending: 0, confirmed: 0, approved: 0, cancelled: 0 };
    bookings.forEach(b => {
      const status = (b.status || "pending").toLowerCase();
      if (statuses[status] !== undefined) statuses[status]++;
    });
    return Object.entries(statuses).map(([status, count]) => ({ status, count }));
  }, [bookings]);

  const revenueOverTime = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const amount = Number(b.amount ?? 0);
      const isPaid = b.paid === true || b.status === "completed" || b.status === "paid";
      if (!isPaid || !b.createdAt?.toDate) return;
      const date = b.createdAt.toDate();
      const key = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
      map[key] = (map[key] || 0) + amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, revenue]) => ({ date, revenue }));
  }, [bookings]);

  const completedPendingData = useMemo(() => {
    let completed = 0, pending = 0;
    bookings.forEach(b => {
      const amount = Number(b.amount ?? 0);
      const isPaid = b.paid === true || b.status === "completed" || b.status === "paid";
      if (isPaid) completed += amount;
      else pending += amount;
    });
    return [
      { name: "Completed", amount: completed },
      { name: "Pending", amount: pending }
    ];
  }, [bookings]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span>View stats for: </span>
        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={styles.select}>
          <option value="weekly">Last 7 days</option>
          <option value="monthly">Last 30 days</option>
          <option value="overall">Overall</option>
        </select>
      </div>

      <div style={styles.grid3}>
        <StatCard title="Total Users" value={filteredUsers.length} sub={timeFilter} />
        <StatCard title="Total Bookings" value={filteredBookings.length} sub={timeFilter} />
        <StatCard title="Revenue" value={`₹${revenueFiltered}`} sub="Collected" />
        <StatCard title="Pending Payouts" value={`₹${pendingPayouts}`} />
      </div>

      <div style={styles.grid2}>
        <div style={styles.chartCard}>
          <h4>Revenue Over Time</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueOverTime}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#1976d2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.chartCard}>
          <h4>Bookings by Status</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bookingsStatusData}>
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#43a047" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.chartCard}>
          <h4>Completed vs Pending Payouts</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={completedPendingData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#ff9800" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Users Table */}
      <div style={styles.tableCard}>
        <h4>Users</h4>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button style={styles.btnBlue} onClick={() => { setProfileModalOpen(true); setProfileUser(u); }}>View</button>
                  <button style={styles.btnOrange} onClick={() => toggleBlockUser(u.id, u.blocked)}>{u.blocked ? "Unblock" : "Block"}</button>
                  {u.role === "service-provider" && !u.approved && (
                    <button style={styles.btnGreen} onClick={() => approveProvider(u.id, true)}>Approve</button>
                  )}
                  <button style={styles.btnRed} onClick={() => handleDeleteUser(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bookings Table */}
      <div style={styles.tableCard}>
        <h4>Bookings</h4>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th><th>Client</th><th>Provider</th><th>Status</th><th>Amount</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(b => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{getUserName(b.clientId)}</td>
                <td>{getUserName(b.providerId)}</td>
                <td>{b.status}</td>
                <td>{b.amount}</td>
                <td>
                  <button style={styles.btnOrange} onClick={() => cancelBooking(b.id)}>Cancel</button>
                  <button style={styles.btnRed} onClick={() => handleDeleteBooking(b.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Profile Modal */}
      <Modal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="User Profile">
        {profileUser && (
          <div>
            <p><strong>Name:</strong> {profileUser.name}</p>
            <p><strong>Email:</strong> {profileUser.email}</p>
            <p><strong>Role:</strong> {profileUser.role}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* -----------------------
  Styles
----------------------- */
const styles = {
  container: { padding: 20, fontFamily: "Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  logoutBtn: { padding: "6px 12px", cursor: "pointer" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: 20 },
  card: { padding: 12, background: "#f5f5f5", borderRadius: 8, textAlign: "center" },
  chartCard: { padding: 12, background: "#fff", borderRadius: 8 },
  tableCard: { padding: 12, background: "#fff", borderRadius: 8, marginBottom: 20 },
  table: { width: "100%", borderCollapse: "collapse" },
  btnBlue: { background: "#1976d2", color: "white", padding: "4px 8px", margin: 2, border: "none", borderRadius: 4 },
  btnGreen: { background: "#43a047", color: "white", padding: "4px 8px", margin: 2, border: "none", borderRadius: 4 },
  btnOrange: { background: "#f57c00", color: "white", padding: "4px 8px", margin: 2, border: "none", borderRadius: 4 },
  btnRed: { background: "#d32f2f", color: "white", padding: "4px 8px", margin: 2, border: "none", borderRadius: 4 },
  input: { padding: 6, marginRight: 8, marginBottom: 8 },
  select: { padding: 6, marginRight: 8, marginBottom: 8 },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center" },
  modal: { background: "#fff", borderRadius: 8, width: 400, maxWidth: "90%", padding: 16 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalClose: { cursor: "pointer", border: "none", background: "transparent", fontSize: 16 },
  modalBody: { fontSize: 14 }
};

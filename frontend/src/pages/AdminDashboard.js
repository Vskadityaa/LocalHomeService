// src/AdminDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";

function StatCard({ title, value, sub }) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 14, opacity: 0.8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);

  const [userRole, setUserRole] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const bookingsSnap = await getDocs(collection(db, "bookings"));

      const usersData = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const bookingsData = bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      setUsers(usersData);
      setBookings(bookingsData);

      setUserCount(usersData.length);
      setBookingCount(bookingsData.length);
    } catch (e) {
      console.error(e);
      setError("Failed to load data. Check Firestore rules & field names.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/Auth");
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteDoc(doc(db, "users", id));
      fetchAllData();
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      await deleteDoc(doc(db, "bookings", id));
      fetchAllData();
    }
  };

  const handleUpdateBookingStatus = async (id, status) => {
    await updateDoc(doc(db, "bookings", id), { status });
    fetchAllData();
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const roleOk = userRole === "all" || (u.role || "").toLowerCase() === userRole;
      const q = userSearch.trim().toLowerCase();
      return roleOk && (!q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
    });
  }, [users, userRole, userSearch]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const statusOk = bookingStatus === "all" || (b.status || "").toLowerCase() === bookingStatus;
      const q = bookingSearch.trim().toLowerCase();
      return statusOk && (!q || (b.clientId || "").toLowerCase().includes(q) || (b.providerId || "").toLowerCase().includes(q) || (b.id || "").toLowerCase().includes(q));
    });
  }, [bookings, bookingStatus, bookingSearch]);

  const getUserName = (id) => users.find((u) => u.id === id)?.name || "—";

  // Graph Data
  const usersRoleData = useMemo(() => {
    const roles = { client: 0, "service-provider": 0, admin: 0 };
    users.forEach(u => {
      const role = (u.role || "unknown").toLowerCase();
      if (roles[role] !== undefined) roles[role]++;
    });
    return Object.entries(roles).map(([name, value]) => ({ name, value }));
  }, [users]);

  const bookingsStatusData = useMemo(() => {
    const statuses = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach(b => {
      const status = (b.status || "pending").toLowerCase();
      if (statuses[status] !== undefined) statuses[status]++;
    });
    return Object.entries(statuses).map(([status, count]) => ({ status, count }));
  }, [bookings]);

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

  if (loading) return <div style={{ padding: 24 }}>Loading dashboard…</div>;

  return (
    <div style={styles.wrap}>
      <aside style={styles.sidebar}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 24 }}>Admin Panel</div>
        <a href="#overview" style={styles.navItem}>Overview</a>
        <a href="#users" style={styles.navItem}>Users</a>
        <a href="#bookings" style={styles.navItem}>Bookings</a>
        <a href="#graphs" style={styles.navItem}>Graphs</a>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </aside>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}

        <h1 id="overview">Dashboard Overview</h1>
        <div style={styles.grid3}>
          <StatCard title="Total Users" value={userCount} sub="All roles" />
          <StatCard title="Total Bookings" value={bookingCount} sub="All statuses" />
          <StatCard
            title="Service Providers"
            value={users.filter((u) => (u.role || "").toLowerCase() === "service-provider").length}
            sub="From users list"
          />
        </div>

        {/* Graphs Section */}
        <section id="graphs" style={{ marginTop: 32 }}>
          <h2>Graphs</h2>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {/* Users per Role Pie Chart */}
            <div style={{ flex: 1, minWidth: 300, height: 300, background: "white", borderRadius: 16, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
              <h4 style={{ textAlign: "center" }}>Users by Role</h4>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie data={usersRoleData} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8" label>
                    {usersRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bookings per Status Bar Chart */}
            <div style={{ flex: 1, minWidth: 300, height: 300, background: "white", borderRadius: 16, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
              <h4 style={{ textAlign: "center" }}>Bookings by Status</h4>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={bookingsStatusData}>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Users Section */}
        <section id="users" style={{ marginTop: 32 }}>
          <div style={styles.sectionHeader}>
            <h2>Users</h2>
            <div style={styles.filtersRow}>
              <input type="text" placeholder="Search users" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={styles.input} />
              <select value={userRole} onChange={(e) => setUserRole(e.target.value)} style={styles.select}>
                <option value="all">All roles</option>
                <option value="client">Client</option>
                <option value="service-provider">Service Provider</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={styles.rowHover}>
                    <td style={styles.td}>{u.name || "—"}</td>
                    <td style={styles.td}>{u.email || "—"}</td>
                    <td style={styles.td}>{u.role || "—"}</td>
                    <td style={styles.td}>{u.createdAt?.toDate ? u.createdAt.toDate().toLocaleString() : "—"}</td>
                    <td style={styles.td}>
                      {u.role !== "admin" && (
                        <button style={styles.deleteBtn} onClick={() => handleDeleteUser(u.id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && <tr><td colSpan={5} style={styles.td}>No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bookings Section */}
        <section id="bookings" style={{ marginTop: 32 }}>
          <div style={styles.sectionHeader}>
            <h2>Bookings</h2>
            <div style={styles.filtersRow}>
              <input type="text" placeholder="Search bookings" value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} style={styles.input} />
              <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} style={styles.select}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Booking ID</th>
                  <th style={styles.th}>Client</th>
                  <th style={styles.th}>Provider</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id} style={styles.rowHover}>
                    <td style={styles.td}>{b.id}</td>
                    <td style={styles.td}>{getUserName(b.clientId)}</td>
                    <td style={styles.td}>{getUserName(b.providerId)}</td>
                    <td style={styles.td}>{b.status || "—"}</td>
                    <td style={styles.td}>{b.createdAt?.toDate ? b.createdAt.toDate().toLocaleString() : "—"}</td>
                    <td style={styles.td}>
                      <button style={styles.deleteBtn} onClick={() => handleDeleteBooking(b.id)}>Delete</button>
                      {b.status !== "confirmed" && (
                        <button style={styles.approveBtn} onClick={() => handleUpdateBookingStatus(b.id, "confirmed")}>Confirm</button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && <tr><td colSpan={6} style={styles.td}>No bookings found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        
      </main>
    </div>
  );
}

const styles = {
  wrap: { display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh", background: "#f6f8fb" },
  sidebar: { padding: 20, background: "#0f172a", color: "white", position: "sticky", top: 0, height: "100vh" },
  navItem: { display: "block", padding: "10px 12px", borderRadius: 10, textDecoration: "none", color: "white", opacity: 0.9, marginBottom: 6, background: "rgba(255,255,255,0.06)" },
  main: { padding: 24 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginTop: 16 },
  card: { background: "white", padding: 16, borderRadius: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  filtersRow: { display: "flex", gap: 8 },
  input: { padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", minWidth: 260, outline: "none" },
  select: { padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", outline: "none" },
  logoutButton: { marginTop: 24, padding: "10px 12px", borderRadius: 10, border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontWeight: 600, width: "100%" },
  tableWrap: { background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 14px", background: "#f1f5f9", fontWeight: 700, borderBottom: "1px solid #e5e7eb", fontSize: 13 },
  td: { padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: 14 },
  rowHover: { transition: "background 0.2s", cursor: "default" },
  error: { background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 12, marginBottom: 12 },
  deleteBtn: { background: "#dc2626", color: "white", border: "none", padding: "5px 8px", borderRadius: 6, marginRight: 6, cursor: "pointer" },
  approveBtn: { background: "#16a34a", color: "white", border: "none", padding: "5px 8px", borderRadius: 6, cursor: "pointer" },
};

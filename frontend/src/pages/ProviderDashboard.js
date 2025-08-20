import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import {
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  onDisconnect,
  onValue,
} from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import './ProviderDashboard.css';

const ProviderDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [providerInfo, setProviderInfo] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setProviderOnlineStatus(user.uid);
        fetchProviderData(user.uid);

        const dbRealtime = getDatabase();
        const statusRef = rtdbRef(dbRealtime, `/status/${user.uid}`);
        onValue(statusRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setIsOnline(data.online);
            setLastSeen(data.lastSeen);
          }
        });
      } else {
        navigate('/auth');
      }
    });
    return () => unsubscribe();
  }, []);

  const setProviderOnlineStatus = (uid) => {
    const dbRealtime = getDatabase();
    const statusRef = rtdbRef(dbRealtime, `/status/${uid}`);

    rtdbSet(statusRef, {
      online: true,
      lastSeen: Date.now(),
    });

    onDisconnect(statusRef).set({
      online: false,
      lastSeen: Date.now(),
    });
  };

  const fetchProviderData = async (uid) => {
    const bookingsRef = collection(db, 'bookings');
    const servicesRef = collection(db, 'services');
    const providerDocRef = doc(db, 'providers', uid);

    const bookingsSnapshot = await getDocs(
      query(bookingsRef, where('providerId', '==', uid))
    );
    const servicesSnapshot = await getDocs(
      query(servicesRef, where('providerId', '==', uid))
    );

    setBookings(bookingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setServices(servicesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

    const providerDoc = await getDoc(providerDocRef);
    if (providerDoc.exists()) {
      setProviderInfo(providerDoc.data());
    } else {
      await setDoc(providerDocRef, {}, { merge: true });
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      const dbRealtime = getDatabase();
      const statusRef = rtdbRef(dbRealtime, `/status/${currentUser.uid}`);
      await rtdbSet(statusRef, {
        online: false,
        lastSeen: Date.now(),
      });
    }
    await signOut(auth);
    navigate('/auth');
  };

  const confirmBooking = async (bookingId) => {
    await updateDoc(doc(db, 'bookings', bookingId), { status: 'Approved' });
    fetchProviderData(currentUser.uid);
  };

  const totalEarnings = bookings
    .filter((b) => b.status === 'Completed' && b.paymentReleased)
    .reduce((sum, b) => sum + Number(b.price || 0), 0);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h2>Service Provider</h2>
        <p><strong>Name:</strong> {providerInfo?.name || 'N/A'}</p>
        <p><strong>Email:</strong> {currentUser?.email}</p>
        <p>
          <strong>Status:</strong>{' '}
          {isOnline
            ? '🟢 Online'
            : `🔴 Offline (Last seen: ${
                lastSeen ? new Date(lastSeen).toLocaleString() : 'N/A'
              })`}
        </p>

        <ul className="sidebar-links">
          <li onClick={() => navigate('/ProviderDashboard')}>Dashboard</li>
          <li onClick={() => navigate('/provider/profile')}>Profile</li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          &#9776;
        </button>
        <h1>Welcome, {providerInfo?.name || 'Provider'}</h1>

        <div className="stats">
          <div className="stat-card"><h3>{bookings.length}</h3><p>Total Bookings</p></div>
          <div className="stat-card"><h3>{services.length}</h3><p>Services Listed</p></div>
          <div className="stat-card"><h3>{bookings.filter(b => b.status === 'Pending').length}</h3><p>Pending</p></div>
          <div className="stat-card"><h3>{bookings.filter(b => b.status === 'Approved').length}</h3><p>Approved</p></div>
          <div className="stat-card"><h3>₹{totalEarnings}</h3><p>Total Earnings</p></div>
        </div>

        <div className="bookings-section">
          <h2>Recent Client Bookings</h2>
          {bookings.length === 0 && <p>No bookings yet.</p>}
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <p><strong>Client:</strong> {booking.clientName}</p>
              <p><strong>Service:</strong> {booking.serviceType}</p>
              <p><strong>Location:</strong> {booking.location}</p>
              <p><strong>Price:</strong> ₹{booking.price || 'N/A'}</p>
              <p><strong>Status:</strong> {booking.status}</p>
              {booking.status === 'Pending' && (
                <button className="confirm-btn" onClick={() => confirmBooking(booking.id)}>
                  Confirm
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;

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
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './ProviderDashboard.css';

const ProviderDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [providerInfo, setProviderInfo] = useState({});
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      fetchProviderData();
    }
  }, [currentUser]);

  const fetchProviderData = async () => {
    const bookingsRef = collection(db, 'bookings');
    const servicesRef = collection(db, 'services');
    const providerDocRef = doc(db, 'providers', currentUser.uid);

    const bookingsSnapshot = await getDocs(
      query(bookingsRef, where('providerId', '==', currentUser.uid))
    );
    const servicesSnapshot = await getDocs(
      query(servicesRef, where('providerId', '==', currentUser.uid))
    );

    setBookings(bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const providerDoc = await getDoc(providerDocRef);
    if (providerDoc.exists()) {
      setProviderInfo(providerDoc.data());
    } else {
      await setDoc(providerDocRef, {}, { merge: true });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const confirmBooking = async bookingId => {
    await updateDoc(doc(db, 'bookings', bookingId), { status: 'Approved' });
    fetchProviderData();
  };

  const totalEarnings = bookings
    .filter(b => b.status === 'Completed' && b.paymentReleased)
    .reduce((sum, b) => sum + Number(b.price || 0), 0);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h2>Service Provider</h2>
        <p><strong>Name:</strong> {providerInfo?.name || 'N/A'}</p>
        <p><strong>Email:</strong> {currentUser?.email}</p>

        <ul className="sidebar-links">
          <li onClick={() => navigate('/ProviderDashboard')}>Dashboard</li>
          <li onClick={() => navigate('/provider/profile')}>Profile</li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>&#9776;</button>
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
          {bookings.map(booking => (
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

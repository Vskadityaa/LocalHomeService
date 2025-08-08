import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const ClientDashboard = () => {
  const [providers, setProviders] = useState([]);
  const [client, setClient] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/auth');

      const userRef = collection(db, 'users');
      const userSnapshot = await getDocs(query(userRef, where('email', '==', user.email)));
      const clientData = userSnapshot.docs[0]?.data();
      setClient({ ...clientData, uid: user.uid });

      const providerSnapshot = await getDocs(query(userRef, where('role', '==', 'service-provider')));
      setProviders(providerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const bookingSnapshot = await getDocs(query(collection(db, 'bookings'), where('clientId', '==', user.uid)));
      setBookings(bookingSnapshot.docs.map(doc => doc.data()));
    };

    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const handleBookNow = (provider) => {
    navigate('/payment', { state: { provider, client } });
  };

  const toggleSidebar = () => setShowSidebar(prev => !prev);

  const closeSidebar = () => setShowSidebar(false);

  const goToProfile = () => {
    navigate('/client-profile', { state: { client } });
    closeSidebar(); // Close sidebar when navigating away
  };

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <div style={styles.navLeft} onClick={toggleSidebar}>
          <img
            src={client?.imageURL || 'https://dummyimage.com/40x40/cccccc/ffffff&text=No+Image'}
            alt="Profile"
            style={styles.profileImage}
          />
        </div>
        <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <button
              onClick={closeSidebar}
              style={styles.closeButton}
              aria-label="Close Sidebar"
            >
              ❌
            </button>
            <img
              src={client?.imageURL || 'https://dummyimage.com/100x100/cccccc/ffffff&text=No+Image'}
              alt="Profile"
              style={styles.profileImageLarge}
            />
            <h3>{client?.name || 'Client'}</h3>
            <p>{client?.email}</p>
          </div>
          <div style={styles.sidebarMenu}>
            <button onClick={goToProfile}>👤 View/Edit Profile</button>
            <button onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>
      )}

      {/* Below Navbar */}
      <div style={styles.nameContainer}>
        <span style={styles.clientName}>
          Welcome, {client?.name || 'Client'}
        </span>
      </div>

      {/* Services */}
      <div style={styles.content}>
        <h3 style={styles.sectionTitle}>📋 Available Service Providers</h3>
        <div style={styles.cardContainer}>
          {providers.map(provider => (
            <div key={provider.id} style={styles.card}>
              <h4>{provider.serviceType}</h4>
              <p><strong>Name:</strong> {provider.name}</p>
              <p><strong>Location:</strong> {provider.location}</p>
              <p><strong>Price:</strong> ₹{provider.price}</p>
              <p><strong>Rating:</strong> ⭐ {provider.rating || 4.5}</p>
              <button style={styles.bookButton} onClick={() => handleBookNow(provider)}>Book Now</button>
            </div>
          ))}
        </div>

        {/* Booking History */}
        <h3 style={styles.sectionTitle}>📖 Your Booking History</h3>
        <div style={styles.historyBox}>
          {bookings.length === 0 ? (
            <p>No bookings yet.</p>
          ) : (
            bookings.map((booking, index) => (
              <div key={index} style={styles.historyItem}>
                <p><strong>Service:</strong> {booking.serviceType}</p>
                <p><strong>Provider:</strong> {booking.providerName}</p>
                <p><strong>Status:</strong> {booking.status}</p>
                <p><strong>Time:</strong> {booking.time}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    fontFamily: 'Poppins, sans-serif',
    backgroundColor: '#f0f4f8',
    minHeight: '100vh',
  },
  navbar: {
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  profileImage: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 18px',
    cursor: 'pointer',
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '260px',
    height: '100%',
    backgroundColor: '#1e293b',
    color: 'white',
    zIndex: 1000,
    padding: '24px',
    boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
  },
  sidebarHeader: {
    textAlign: 'center',
    marginBottom: '30px',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
  },
  profileImageLarge: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    marginBottom: '10px',
  },
  sidebarMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  nameContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '40px 0 20px',
  },
  clientName: {
    fontSize: '40px',
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: '0.5px',
    textTransform: 'capitalize',
    backgroundColor: '#e0f2fe',
    padding: '12px 24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  content: {
    padding: '30px',
  },
  sectionTitle: {
    marginTop: '20px',
    marginBottom: '20px',
  },
  cardContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    width: '280px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  bookButton: {
    marginTop: '12px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  historyBox: {
    marginTop: '30px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
  },
  historyItem: {
    borderBottom: '1px solid #ccc',
    marginBottom: '12px',
    paddingBottom: '10px',
  },
};

export default ClientDashboard;

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { provider, client } = location.state || {};

  const handleFakePayment = async () => {
    try {
      if (!provider || !client) throw new Error("Missing provider or client data");

      await addDoc(collection(db, 'bookings'), {
        clientId: client.uid,
        clientName: client.name || "Unknown",
        providerId: provider.id,
        providerName: provider.name || "Unknown",
        serviceType: provider.serviceType || "",
        location: provider.location || "",
        price: provider.price || "",
        status: 'Pending',
        createdAt: Timestamp.now(),
      });

      alert('Payment successful  ✅');
      navigate('/client-dashboard');
    } catch (err) {
      console.error("Booking error:", err.message);
      alert('Booking failed ❌');
    }
  };

  if (!provider || !client) return <p>Invalid payment data</p>;

  return (
    <div style={styles.container}>
      <h2> Payment Gateway 💳</h2>
      <p><strong>Welcome:</strong> {client.name}</p>
      <p><strong>Service:</strong> {provider.serviceType}</p>
      <p><strong>Price:</strong> ₹{provider.price}</p>
      <br />
      <div style={styles.card}>
        <label>Card Number:</label>
        <input style={styles.input} type="text" placeholder="1234 5678 9012 3456" />
        <label>Expiry Date:</label>
        <input style={styles.input} type="text" placeholder="MM/YY" />
        <label>CVV:</label>
        <input style={styles.input} type="password" placeholder="123" />
        <br />
        <button onClick={handleFakePayment} style={styles.payButton}>Pay Now</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px',
    fontFamily: 'Poppins',
    backgroundColor: '#f9fafb',
    minHeight: '100vh'
  },
  card: {
    background: '#f3f4f6',
    padding: '20px',
    borderRadius: '12px',
    width: '300px'
  },
  input: {
    display: 'block',
    width: '100%',
    marginBottom: '10px',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  payButton: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};

export default PaymentPage;

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ServiceDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { provider, client } = location.state || {};

  if (!provider) {
    return <p>No provider selected.</p>;
  }

  const handleConfirmBooking = () => {
    navigate('/payment', { state: { provider, client } });
  };

  return (
    <div style={styles.page}>
      <h2>{provider.serviceType}</h2>
      <img
        src={provider.imageURL || 'https://dummyimage.com/400x250/cccccc/fff&text=Service+Image'}
        alt={provider.serviceType}
        style={styles.image}
      />
      <p><strong>Provider:</strong> {provider.name}</p>
      <p><strong>Location:</strong> {provider.location}</p>
      <p><strong>Description:</strong> {provider.description || 'No description provided'}</p>
      <p><strong>Price:</strong> ₹{provider.price}</p>
      <button style={styles.confirmButton} onClick={handleConfirmBooking}>
        Confirm Booking
      </button>
    </div>
  );
};

const styles = {
  page: { padding: '20px', fontFamily: 'Poppins, sans-serif' },
  image: { width: '100%', maxWidth: '500px', borderRadius: '10px', marginBottom: '20px' },
  confirmButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer'
  }
};

export default ServiceDetails;

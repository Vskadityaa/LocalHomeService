import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ClientProfilePage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const client = state?.client;

  const [name, setName] = useState(client?.name || '');
  const [location, setLocation] = useState(client?.location || '');
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(client?.imageURL || '');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!client?.uid) return;

    try {
      setLoading(true);
      let imageURL = previewURL;

      if (imageFile) {
        const imageRef = ref(storage, `profiles/${client.uid}/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageURL = await getDownloadURL(imageRef);
      }

      const userRef = doc(db, 'users', client.uid);
      await updateDoc(userRef, {
        name,
        location,
        imageURL,
      });

      alert('✅ Profile updated successfully!');
      navigate(-1);
    } catch (error) {
      console.error(error);
      alert('❌ Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Edit Profile</h2>

        <div style={styles.centered}>
          <img
            src={previewURL || 'https://dummyimage.com/150x150/cccccc/ffffff&text=No+Image'}
            alt="Profile"
            style={styles.profileCircle}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Profile Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={styles.fileInput}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Name:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="Enter your name"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Location:</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={styles.input}
            placeholder="Enter your location"
          />
        </div>

        <button
          onClick={handleSave}
          style={styles.saveButton}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: '#f4f6f8',
    minHeight: '100vh',
    padding: '40px 0',
    fontFamily: 'Poppins, sans-serif',
  },
  card: {
    backgroundColor: '#fff',
    maxWidth: '500px',
    margin: 'auto',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  profileCircle: {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #ddd',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: '6px',
    display: 'block',
  },
  input: {
    padding: '10px',
    fontSize: '15px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    width: '100%',
  },
  fileInput: {
    border: 'none',
  },
  saveButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
};

export default ClientProfilePage;

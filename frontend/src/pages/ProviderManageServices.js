import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import {
  addDoc, collection, deleteDoc, doc, getDocs, query, where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ProviderDashboard.css';

const ProviderManageServices = () => {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    price: '',
  });
  const [image, setImage] = useState(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) fetchServices();
  }, [currentUser]);

  const fetchServices = async () => {
    const q = query(collection(db, 'services'), where('providerId', '==', currentUser.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setServices(data);
  };

  const handleChange = (e) => {
    setNewService(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.title || !newService.description || !newService.price) {
      alert('Please fill all fields.');
      return;
    }

    let imageUrl = '';
    if (image) {
      const imgRef = ref(storage, `services/${currentUser.uid}/${Date.now()}-${image.name}`);
      await uploadBytes(imgRef, image);
      imageUrl = await getDownloadURL(imgRef);
    }

    const docRef = await addDoc(collection(db, 'services'), {
      ...newService,
      price: parseFloat(newService.price),
      providerId: currentUser.uid,
      imageUrl,
      createdAt: new Date()
    });

    setNewService({ title: '', description: '', price: '' });
    setImage(null);
    fetchServices();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'services', id));
    fetchServices();
  };

  return (
    <div className="manage-services-container">
      <h2>Manage Your Services</h2>

      <form className="service-form" onSubmit={handleAddService}>
        <input
          type="text"
          name="title"
          placeholder="Service Title"
          value={newService.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Service Description"
          value={newService.description}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Service Price (INR)"
          value={newService.price}
          onChange={handleChange}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        <button type="submit">Add Service</button>
      </form>

      <div className="services-list">
        {services.map(service => (
          <div key={service.id} className="service-card">
            {service.imageUrl && (
              <img src={service.imageUrl} alt="Service" className="service-img" />
            )}
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <p><strong>Price:</strong> ₹{service.price}</p>
            <button onClick={() => handleDelete(service.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderManageServices;

import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase";
import { collection, getDocs, query, where, doc, updateDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import "./ManageService.css"; // create separate CSS

const ManageService = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    serviceType: "",
    location: "",
    license: "",
    price: "",
    description: "",
    images: []
  });
  const [currentServiceId, setCurrentServiceId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        fetchService(user.uid);
      } else {
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchService = async (uid) => {
    const servicesRef = collection(db, "services");
    const snapshot = await getDocs(query(servicesRef, where("providerId", "==", uid)));
    if (!snapshot.empty) {
      const service = snapshot.docs[0]; // get first service
      setCurrentServiceId(service.id);
      setServiceForm(service.data());
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setServiceForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const storageRef = ref(storage, `providerWork/${currentUser.uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setServiceForm(prev => ({ ...prev, images: [...prev.images, url] }));
  };

  const saveService = async () => {
    if (!currentUser) return;

    if (currentServiceId) {
      // Update existing service
      await updateDoc(doc(db, "services", currentServiceId), serviceForm);
    } else {
      // Add new service
      const servicesRef = collection(db, "services");
      const newDocRef = doc(servicesRef);
      await setDoc(newDocRef, { ...serviceForm, providerId: currentUser.uid });
      setCurrentServiceId(newDocRef.id);
    }

    alert("Service saved successfully!");
  };

  return (
    <div className="manage-service-container">
      <h1>Manage Your Service</h1>
      <div className="form-card">
        <input type="text" name="serviceType" placeholder="Service Type" value={serviceForm.serviceType} onChange={handleChange} />
        <input type="text" name="location" placeholder="Location" value={serviceForm.location} onChange={handleChange} />
        <input type="text" name="license" placeholder="License" value={serviceForm.license} onChange={handleChange} />
        <input type="text" name="price" placeholder="Price" value={serviceForm.price} onChange={handleChange} />
        <textarea name="description" placeholder="Description" value={serviceForm.description} onChange={handleChange}></textarea>

        <h4>Upload Work Images</h4>
        <input type="file" onChange={handleImageUpload} />
        <div className="image-preview">
          {serviceForm.images.map((img, idx) => (
            <img key={idx} src={img} alt="work" />
          ))}
        </div>

        <button className="save-btn" onClick={saveService}>Save Service</button>
      </div>
    </div>
  );
};

export default ManageService;

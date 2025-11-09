import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ClientProfile = () => {
  const [client, setClient] = useState({ name: "", email: "", phone: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/auth");

      const clientDoc = doc(db, "users", user.uid);
      const clientSnap = await getDoc(clientDoc);
      if (clientSnap.exists()) setClient({ ...clientSnap.data(), uid: user.uid });
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => setClient(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSave = async () => {
    const clientRef = doc(db, "users", client.uid);
    await updateDoc(clientRef, { name: client.name, phone: client.phone });
    alert("Profile updated!");
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Poppins, sans-serif" }}>
      <h2>Client Profile</h2>
      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
        <label>Name:</label>
        <input type="text" name="name" value={client.name} onChange={handleChange} style={inputStyle} />
        <label>Email:</label>
        <input type="email" name="email" value={client.email} disabled style={inputStyle} />
        <label>Phone:</label>
        <input type="text" name="phone" value={client.phone || ""} onChange={handleChange} style={inputStyle} />
        <button onClick={handleSave} style={buttonStyle}>Save Changes</button>
      </div>
    </div>
  );
};

const inputStyle = { padding: "8px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px" };
const buttonStyle = { padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#2563eb", color: "#fff", fontWeight: 600, cursor: "pointer", marginTop: "12px" };

export default ClientProfile;

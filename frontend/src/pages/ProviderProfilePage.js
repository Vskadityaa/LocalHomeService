import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const ProviderProfilePage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth"); // Redirect if not logged in
      return;
    }

    setEmail(currentUser.email);

    const fetchProfile = async () => {
      try {
        const providerRef = doc(db, "providers", currentUser.uid);
        const providerSnap = await getDoc(providerRef);

        if (providerSnap.exists()) {
          setName(providerSnap.data().name || "");
        } else {
          // If doc doesn't exist, create it with defaults
          await setDoc(providerRef, { name: "", email: currentUser.email });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [currentUser, navigate]);

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      const providerRef = doc(db, "providers", currentUser.uid);
      await updateDoc(providerRef, { name });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>Provider Profile</h2>
      <div style={{ marginBottom: "10px" }}>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Email:</label>
        <input
          type="text"
          value={email}
          readOnly
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "5px",
            background: "#eee",
          }}
        />
      </div>
      <button
        onClick={handleSave}
        style={{
          padding: "10px 20px",
          background: "#007bff",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Save
      </button>
    </div>
  );
};

export default ProviderProfilePage;

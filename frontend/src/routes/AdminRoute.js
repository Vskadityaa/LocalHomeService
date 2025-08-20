import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const role = snap.exists() ? snap.data().role : null;
        setIsAdmin(role === "admin");
      } catch (e) {
        console.error("Role check failed", e);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading admin access…</div>;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
}

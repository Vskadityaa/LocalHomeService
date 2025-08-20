// src/AuthPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

function AuthPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState("");
  const [license, setLicense] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState("");
  const navigate = useNavigate();

  // Hardcoded admin credentials
  const ADMIN_EMAIL = "admin@example.com";
  const ADMIN_PASSWORD = "admin123";

  // Automatically create admin in Auth + Firestore if not exists
  useEffect(() => {
    const createAdmin = async () => {
      try {
        // Check if admin exists in Firestore
        const adminQuerySnap = await getDoc(doc(db, "users", "admin"));
        if (adminQuerySnap.exists()) return;

        // Create admin in Firebase Auth
        let adminUID = null;
        try {
          const adminAuthUser = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
          adminUID = adminAuthUser.user.uid;
        } catch (err) {
          if (err.code === "auth/email-already-in-use") {
            const existingUser = auth.currentUser;
            adminUID = existingUser ? existingUser.uid : "admin"; // fallback if needed
          } else {
            console.error("Error creating admin in Auth:", err);
            return;
          }
        }

        // Create admin document in Firestore using UID
        await setDoc(doc(db, "users", adminUID), {
          name: "Admin",
          email: ADMIN_EMAIL,
          role: "admin",
          createdAt: serverTimestamp(),
          isVerified: true,
        });

        console.log("Admin created successfully!");
      } catch (err) {
        console.error("Failed to create admin:", err);
      }
    };

    createAdmin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password || (!isLogin && !name.trim())) {
      setMessage("Name, email and password are required!");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setMessage("Invalid email format.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      // Admin login check
      if (isLogin && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setMessage("Admin logged in successfully!");
        navigate("/admin-dashboard");
        return;
      }

      if (isLogin) {
        // Normal login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          setMessage("Please verify your email before logging in.");
          return;
        }

        const roleSnap = await getDoc(doc(db, "users", user.uid));
        const userRole = roleSnap.exists() ? roleSnap.data().role : "unknown";
        setMessage(`${userRole} logged in successfully!`);
        redirectBasedOnRole(userRole);
      } else {
        // Signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await sendEmailVerification(user);
        setMessage("Verification email sent! Please check your inbox.");

        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          role: role === "service_provider" ? "service-provider" : "client",
          serviceType: role === "service_provider" ? serviceType : null,
          location: role === "service_provider" ? location : null,
          license: role === "service_provider" ? license : null,
          price: role === "service_provider" ? price : null,
          rating: role === "service_provider" ? rating : null,
          isVerified: false,
          createdAt: serverTimestamp(),
        });

        navigate("/verify-email");
      }
    } catch (error) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        setMessage("Email is already registered. Please log in.");
      } else {
        setMessage(error.message || "Something went wrong.");
      }
    }
  };

  const redirectBasedOnRole = (userRole) => {
    if (userRole === "client") navigate("/client-dashboard");
    else if (userRole === "service-provider") navigate("/provider-dashboard");
    else if (userRole === "admin") navigate("/admin-dashboard");
    else navigate("/unknown-role");
  };

  return (
    <div style={styles.container}>
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {!isLogin && (
          <>
            <input type="text" placeholder="Full Name" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
            <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
              <option value="client">Client</option>
              <option value="service_provider">Service Provider</option>
            </select>
            {role === "service_provider" && (
              <>
                <input type="text" placeholder="Service Type" style={styles.input} value={serviceType} onChange={(e) => setServiceType(e.target.value)} />
                <input type="text" placeholder="Location" style={styles.input} value={location} onChange={(e) => setLocation(e.target.value)} />
                <input type="text" placeholder="License / ID" style={styles.input} value={license} onChange={(e) => setLicense(e.target.value)} />
                <input type="text" placeholder="Pricing" style={styles.input} value={price} onChange={(e) => setPrice(e.target.value)} />
                <input type="text" placeholder="Rating" style={styles.input} value={rating} onChange={(e) => setRating(e.target.value)} />
              </>
            )}
          </>
        )}
        <input type="email" placeholder="Email" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" style={styles.button}>{isLogin ? "Login" : "Sign Up"}</button>
      </form>
      <p onClick={() => setIsLogin(!isLogin)} style={styles.toggle}>
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
      </p>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  container: { maxWidth: 400, margin: "auto", padding: 20, border: "1px solid #ccc", borderRadius: 10, marginTop: 50, textAlign: "center", backgroundColor: "#f9f9f9" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: { padding: 10, fontSize: 16 },
  button: { padding: 10, fontSize: 16, backgroundColor: "#007bff", color: "white", border: "none", cursor: "pointer" },
  toggle: { marginTop: 15, color: "#007bff", cursor: "pointer", fontWeight: "bold" },
  message: { marginTop: 15, color: "green", fontWeight: "bold" },
};

export default AuthPage;

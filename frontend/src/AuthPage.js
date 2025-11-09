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
  const [phone, setPhone] = useState(""); // added phone state
  const [role, setRole] = useState("client");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState("");
  const [license, setLicense] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState("");
  const navigate = useNavigate();

  // Hardcoded Admin
  const ADMIN_EMAIL = "admin@example.com";
  const ADMIN_PASSWORD = "admin123";

  useEffect(() => {
    const createAdmin = async () => {
      try {
        const adminQuerySnap = await getDoc(doc(db, "users", "admin"));
        if (adminQuerySnap.exists()) return;

        let adminUID = null;
        try {
          const adminAuthUser = await createUserWithEmailAndPassword(
            auth,
            ADMIN_EMAIL,
            ADMIN_PASSWORD
          );
          adminUID = adminAuthUser.user.uid;
        } catch (err) {
          if (err.code === "auth/email-already-in-use") {
            const existingUser = auth.currentUser;
            adminUID = existingUser ? existingUser.uid : "admin";
          } else {
            console.error("Error creating admin in Auth:", err);
            return;
          }
        }

        await setDoc(doc(db, "users", adminUID), {
          name: "Admin",
          email: ADMIN_EMAIL,
          role: "admin",
          createdAt: serverTimestamp(),
          isVerified: true,
        });
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
      setMessage("Name, email, and password are required!");
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
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
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
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        await sendEmailVerification(user);
        setMessage("Verification email sent! Please check your inbox.");

        // Save user info in Firestore including phone
        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          phone: phone || "", // store phone
          role: role === "service_provider" ? "service-provider" : "client",
          serviceType: role === "service_provider" ? serviceType : null,
          location: role === "service_provider" ? location : null,
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
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isLogin ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Phone Number"
                style={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={styles.input}
              >
                <option value="client">Client</option>
                <option value="service_provider">Service Provider</option>
              </select>
              {role === "service_provider" && (
                <>
                  <input
                    type="text"
                    placeholder="Service Type"
                    style={styles.input}
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    style={styles.input}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Pricing"
                    style={styles.input}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Rating"
                    style={styles.input}
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </>
              )}
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" style={styles.button}>
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
        <p onClick={() => setIsLogin(!isLogin)} style={styles.toggle}>
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Login"}
        </p>
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #a50f0f, #2575fc)",
    fontFamily: "Poppins, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    padding: "30px 25px",
    borderRadius: "15px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    textAlign: "center",
  },
  title: {
    marginBottom: 20,
    fontSize: "1.8rem",
    fontWeight: "600",
    color: "#333",
  },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
    outline: "none",
    transition: "0.2s",
  },
  button: {
    padding: "12px",
    fontSize: "16px",
    fontWeight: "600",
    background: "linear-gradient(135deg, #bc0d0d, #2575fc)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  toggle: {
    marginTop: 20,
    color: "#2575fc",
    cursor: "pointer",
    fontWeight: "bold",
  },
  message: { marginTop: 15, fontWeight: "500", color: "#28a745" },
};

export default AuthPage;

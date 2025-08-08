import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";

function VerifyEmail() {
  const [message, setMessage] = useState("Please verify your email...");
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        setMessage("Email verified! Redirecting to login...");
        clearInterval(interval);
        setTimeout(() => navigate("/"), 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <h2>Verify Your Email</h2>
      <p>{message}</p>
      <p>Check your inbox and click the verification link we sent.</p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 400,
    margin: "auto",
    padding: 20,
    border: "1px solid #ccc",
    borderRadius: 10,
    marginTop: 50,
    textAlign: "center",
    backgroundColor: "#f9f9f9",
  },
};

export default VerifyEmail;

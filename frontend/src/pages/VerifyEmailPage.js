// src/pages/VerifyEmailPage.js
import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

function VerifyEmailPage() {
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        setVerified(true);
        clearInterval(interval);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <h2>Verification Required</h2>
      {verified ? (
        <p style={styles.success}>Email verified! Redirecting to login...</p>
      ) : (
        <p style={styles.info}>
          A verification link was sent to your email. Please verify and stay on this page.
        </p>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 500,
    margin: "auto",
    marginTop: 100,
    padding: 20,
    textAlign: "center",
    border: "1px solid #ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  info: {
    color: "#333",
    fontSize: 16,
  },
  success: {
    color: "green",
    fontWeight: "bold",
    fontSize: 18,
  },
};

export default VerifyEmailPage;

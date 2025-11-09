// src/VerifyEmail.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { sendEmailVerification } from "firebase/auth";

function VerifyEmail() {
  const [message, setMessage] = useState("Please verify your email...");
  const [resendMessage, setResendMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  // Auto-check if email is verified
  useEffect(() => {
    const interval = setInterval(async () => {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        setMessage("✅ Email verified! Redirecting to login...");
        clearInterval(interval);
        setTimeout(() => navigate("/"), 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  // Handle resend email with cooldown
  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setResendMessage("📩 Verification email resent! Check your inbox.");
        setResendCooldown(30); // 30s cooldown
      }
    } catch (error) {
      console.error(error);
      if (error.code === "auth/too-many-requests") {
        setResendMessage("⚠️ Too many requests. Please wait a few minutes.");
        setResendCooldown(60); // longer cooldown
      } else {
        setResendMessage("❌ Failed to resend email. Try again later.");
      }
    }

    setTimeout(() => setResendMessage(""), 5000);
  };

  // Countdown logic
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Verify Your Email</h2>
        <p style={styles.message}>{message}</p>
        <p style={styles.subtitle}>
          We’ve sent a verification link to your inbox. Please check your email
          and click the link to continue.
        </p>

        <button
          style={{
            ...styles.button,
            opacity: resendCooldown > 0 ? 0.6 : 1,
            cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
          }}
          onClick={handleResend}
          disabled={resendCooldown > 0}
        >
          {resendCooldown > 0
            ? `Resend available in ${resendCooldown}s`
            : "Resend Verification Email"}
        </button>

        {resendMessage && <p style={styles.resend}>{resendMessage}</p>}
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
    background: "linear-gradient(135deg, #fbfbfb, #2575fc)",
    fontFamily: "Poppins, sans-serif",
  },
  card: {
    maxWidth: 420,
    width: "100%",
    background: "#fff",
    padding: "30px 25px",
    borderRadius: "15px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    textAlign: "center",
  },
  title: {
    marginBottom: 15,
    fontSize: "1.8rem",
    fontWeight: "600",
    color: "#333",
  },
  message: { fontSize: "16px", fontWeight: "500", color: "#444" },
  subtitle: { marginTop: 10, color: "#666", fontSize: "14px" },
  button: {
    marginTop: 20,
    padding: "12px 18px",
    background: "linear-gradient(135deg, #bc0d0d, #2575fc)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.3s",
  },
  resend: { marginTop: 10, color: "#28a745", fontWeight: "500" },
};

export default VerifyEmail;

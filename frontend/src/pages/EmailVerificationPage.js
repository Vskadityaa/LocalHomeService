// src/pages/EmailVerificationPage.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

function EmailVerificationPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerification = setInterval(async () => {
      await auth.currentUser?.reload();
      const user = auth.currentUser;
      if (user?.emailVerified) {
        clearInterval(checkVerification);
        alert("Email verified successfully!");
        navigate("/"); // Redirect to login page
      }
    }, 3000); // check every 3 seconds

    return () => clearInterval(checkVerification);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <h2>Verify Your Email</h2>
      <p>
        A verification link has been sent to your email. Please check and
        verify to continue.
      </p>
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

export default EmailVerificationPage;

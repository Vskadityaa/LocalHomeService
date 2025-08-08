import React from "react";
import { motion } from "framer-motion";

const services = [
  {
    id: 1,
    title: "Plumbing",
    description: "Fix leaks, install pipes and fittings.",
    price: 499,
    image: "https://source.unsplash.com/400x300/?plumber",
  },
  {
    id: 2,
    title: "Electrician",
    description: "Switches, fans, lights and more.",
    price: 299,
    image: "https://source.unsplash.com/400x300/?electrician",
  },
  {
    id: 3,
    title: "Home Cleaning",
    description: "Deep cleaning for kitchens, bathrooms, sofas.",
    price: 799,
    image: "https://source.unsplash.com/400x300/?cleaning",
  },
  {
    id: 4,
    title: "AC Repair",
    description: "AC servicing, gas refilling, and repair.",
    price: 499,
    image: "https://source.unsplash.com/400x300/?ac",
  },
  {
    id: 5,
    title: "Painting",
    description: "Interior & exterior home painting.",
    price: 1999,
    image: "https://source.unsplash.com/400x300/?painting",
  },
];

const BookingPage = () => {
  const handleBooking = (service) => {
    const options = {
      key: "YOUR_RAZORPAY_KEY_ID", // 🔁 Replace this with your Razorpay Key ID
      amount: service.price * 100, // Amount in paise
      currency: "INR",
      name: "HomeCare",
      description: `Payment for ${service.title}`,
      image: "https://cdn-icons-png.flaticon.com/512/2920/2920211.png",
      handler: function (response) {
        alert("✅ Payment Successful!\nPayment ID: " + response.razorpay_payment_id);
      },
      prefill: {
        name: "Client Name",
        email: "client@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#007bff",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📋 Book a Service</h1>
      <p style={styles.subheading}>Choose a service and pay securely</p>
      <div style={styles.grid}>
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            style={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(0, 123, 255, 0.2)" }}
          >
            <img src={service.image} alt={service.title} style={styles.image} />
            <h2 style={styles.title}>{service.title}</h2>
            <p style={styles.description}>{service.description}</p>
            <p style={styles.price}>₹{service.price}</p>
            <motion.button
              onClick={() => handleBooking(service)}
              style={styles.button}
              whileHover={{ scale: 1.1 }}
            >
              Book & Pay
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "40px 20px",
    backgroundColor: "#f9fbfd",
    fontFamily: "Segoe UI, sans-serif",
    minHeight: "100vh",
  },
  heading: {
    textAlign: "center",
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#333",
  },
  subheading: {
    textAlign: "center",
    color: "#666",
    marginBottom: "40px",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
    width: "280px",
    padding: "20px",
    textAlign: "center",
    transition: "all 0.3s ease",
  },
  image: {
    width: "100%",
    height: "160px",
    borderRadius: "10px",
    objectFit: "cover",
    marginBottom: "15px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#007bff",
  },
  description: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "8px",
  },
  price: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: "16px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "14px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
};

export default BookingPage;

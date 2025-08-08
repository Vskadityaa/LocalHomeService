import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaStar,
  FaLocationArrow,
  FaBolt,
  FaMobileAlt,
  FaVideo,
  FaRupeeSign,
  FaCheckCircle,
} from "react-icons/fa";

function HomePage() {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Detecting...");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

 // ✅ Define this at the top inside your component
const rotatingImages = [
  {
    src: "https://th.bing.com/th/id/OIP.sWpOSiENSbNaLJY9cI42fwHaEJ?w=279&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7",
    caption: "Cleaning Service",
  },
  {
    src: "https://th.bing.com/th/id/OIP.PEO4X1I52bfZBEYCS8cCRQHaJK?w=137&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7",
    caption: "Plumbing Experts",
  },
  {
    src: "https://th.bing.com/th/id/OIP.Nybv7-DMmn3P8ZpNo6MitwHaE7?w=239&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7",
    caption: "Electric Repair",
  },
  {
    src: "https://th.bing.com/th/id/OIP.oHW5fd0GwGoCK_c_4l1c0AAAAA?w=249&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7",
    caption: "Salon at Home",
  },
  {
    src: "https://th.bing.com/th/id/OIP.bMO9YPiZoRVV3eM636GDmwHaE8?w=277&h=185&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    caption: "Home Appliance Repair",
  },
  {
    src: "https://th.bing.com/th/id/OIP.PXeYXlEdmvdg-BSQrVDHQgHaFj?w=315&h=189&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    caption: "Carpentry Work",
  },
];


 const services = [
    { title: "Plumbing", desc: "Expert plumbing solutions.", image: "https://th.bing.com/th/id/OIP.EEolzKnDL5QjO8uXHdLF3QHaE4?w=297&h=195&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3" },
    { title: "Electrician", desc: "Certified electricians.", image: "https://th.bing.com/th/id/OIP.pXSV2MXRNhP7SmJlXWaZTAHaDt?w=326&h=175&c=7&r=0&o=5&dpr=1.3&pid=1.7" },
    { title: "Cleaning", desc: "Deep cleaning services.", image: "https://th.bing.com/th/id/OIP.Rqj0C_gN5gX9qroUFUC8iAHaE8?w=242&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3" },
    { title: "AC Repair", desc: "Cooling maintenance.", image: "https://th.bing.com/th/id/OIP.Hk1mMeaRmRSXphoVSsGuWAHaE8?w=283&h=188&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3" },
    { title: "Painting", desc: "Interior and exterior work.", image: "https://th.bing.com/th/id/OIP.oi3l1FZkwcype-n-08IzlwAAAA?w=178&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3" },
  ];

  const topRated = [
    { name: "Ravi Kumar", service: "Electrician", stars: 5, img: "https://randomuser.me/api/portraits/men/21.jpg" },
    { name: "Sneha Joshi", service: "Cleaning", stars: 4, img: "https://randomuser.me/api/portraits/women/23.jpg" },
    { name: "Alok Sen", service: "Plumbing", stars: 5, img: "https://randomuser.me/api/portraits/men/41.jpg" },
  ];

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          .then((res) => res.json())
          .then((data) => {
            setLocation(data.address.city || data.address.town || data.address.village || "Your Area");
          });
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % rotatingImages.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const handleBookNow = () => navigate("/auth");

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "Segoe UI", background: "#ffffff", color: "#000000" }}>
      <nav style={{ background: "#000", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 24, color: "#0af" }}>🏠 HomeCare</div>
        <div>
          <button onClick={handleBookNow} style={{ padding: "8px 16px", background: "#0af", color: "#fff", border: "none", borderRadius: 6 }}>Login</button>
        </div>
      </nav>

      <section style={{
        backgroundImage: `url("https://cdn.fdsmax.com/wp-content/uploads/2024/11/the-importance-of-online-payments-for-local-providers-rvc.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "240px 35px",
        position: "relative"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" }}></div>
        <motion.div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#fff" }}
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 style={{ fontSize: 42 }}>Services in <FaLocationArrow /> {location}</h1>
          <p style={{ fontSize: 18, marginBottom: 20 }}>Reliable professionals for every home need.</p>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search services..."
            style={{ padding: 10, width: 300, borderRadius: 6, border: "none", marginRight: 10 }} />
          <motion.button whileHover={{ scale: 1.1 }} onClick={handleBookNow}
            style={{ padding: "10px 20px", fontSize: 16, backgroundColor: "#0af", color: "white", border: "none", borderRadius: 6 }}>
            Book Now
          </motion.button>
        </motion.div>
      </section>

      {/* Auto-scrolling image + service feature section */}
 <section
  style={{
    padding: "50px",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }}
>
  <h2 style={{ fontSize: "2rem", marginBottom: "20px" }}>Top Services</h2>

  <div style={{ overflow: "hidden", width: "100%" }}>
    <div
      style={{
        display: "inline-flex",
        gap: 10,
        animation: "scroll-left 25s linear infinite",
      }}
    >
      {[...rotatingImages, ...rotatingImages].map((item, index) => (
        <div
          key={`img-${index}`}
          style={{
            position: "relative",
            width: 200,
            height: 120,
            flexShrink: 0,
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            transition: "transform 0.3s",
          }}
        >
          <img
            src={item.src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease-in-out",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: 14,
              padding: "4px 6px",
              textAlign: "center",
            }}
          >
            {item.caption}
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* 👇 Keyframes for auto scroll */}
  <style>{`
    @keyframes scroll-left {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    @media (max-width: 600px) {
      img {
        height: 100px !important;
        width: 150px !important;
      }
    }
  `}</style>
</section>





      <section style={{ padding: 30 }}>
        <h2 style={{ textAlign: "center" }}>⭐ Top Services</h2>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20 }}>
          {filteredServices.map((service, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05 }}
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: 40,
                width: 250,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}>
              <img src={service.image} alt={service.title} style={{ width: "100%", height: 150, borderRadius: 6, objectFit: "cover" }} />
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
              <button onClick={handleBookNow}
                style={{ padding: "8px 12px", marginTop: 10, background: "#007bff", border: "none", color: "#fff", borderRadius: 4 }}>
                Book
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: 30, backgroundColor: "#f0f0f0" }}>
        <h2 style={{ textAlign: "center" }}>👨‍🔧 Top Rated Providers</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          {topRated.map((pro, i) => (
            <div key={i} style={{ background: "#fff", padding: 20, borderRadius: 10, width: 220, textAlign: "center" }}>
              <img src={pro.img} alt={pro.name} style={{ width: 60, height: 60, borderRadius: "50%" }} />
              <h4>{pro.name}</h4>
              <p>{pro.service}</p>
              <p>{[...Array(pro.stars)].map((_, idx) => <FaStar key={idx} color="#f9b300" />)}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: 50, background: "#e8f4fc", textAlign: "center" }}>
  <h2 style={{ fontSize: 28, marginBottom: 30 }}>🎁 Service Packages</h2>
  <div style={{ display: "flex", justifyContent: "center", gap: 30, flexWrap: "wrap" }}>
    {[
      { name: "Basic", price: "₹299", includes: ["1 Cleaning", "1 Repair"] },
      { name: "Premium", price: "₹699", includes: ["3 Cleanings", "2 Repairs", "1 Free Visit"] }
    ].map((pkg, index) => (
      <div key={index} style={{ background: "#fff", padding: 20, borderRadius: 10, width: 250, boxShadow: "0 0 12px rgba(0,0,0,0.1)" }}>
        <h3>{pkg.name}</h3>
        <h4 style={{ color: "#0af" }}>{pkg.price}</h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pkg.includes.map((item, i) => (
            <li key={i}>✅ {item}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
</section>

<section style={{ padding: "60px 40px", background: "#f0f8ff", color: "#333" }}>
  <h2 style={{ textAlign: "center", fontSize: 32, marginBottom: 30 }}>📖 Frequently Asked Questions</h2>
  
  <div style={{
    maxWidth: 800,
    margin: "0 auto",
    background: "#fff",
    padding: 40,
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  }}>
    <ul style={{ listStyle: "none", padding: 0, fontSize: 16 }}>
      <li style={{ marginBottom: 20 }}>
        <strong>Q:</strong> How do I book a service?<br />
        <strong>A:</strong> Use the "Book Now" button on the home page.
      </li>
      <li style={{ marginBottom: 20 }}>
        <strong>Q:</strong> Can I reschedule a booking?<br />
        <strong>A:</strong> Yes, from your dashboard under bookings.
      </li>
      <li>
        <strong>Q:</strong> What if a provider doesn’t show up?<br />
        <strong>A:</strong> Contact support and you’ll be refunded.
      </li>
    </ul>
  </div>
</section>


<section style={{ padding: "60px 40px", background: "#ffffff", color: "#333" }}>
  <h2 style={{ textAlign: "center", fontSize: 32, marginBottom: 30 }}>📞 Contact Support</h2>

  <div style={{
    maxWidth: 800,
    margin: "0 auto",
    background: "#f9f9f9",
    padding: 30,
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  }}>
    <p style={{ fontSize: 16 }}>If you need further help, reach out:</p>
    <ul style={{ listStyle: "none", padding: 0, fontSize: 16 }}>
      <li>📧 Email: <a href="mailto:support@homeservices.com">support@homeservices.com</a></li>
      <li>📱 WhatsApp: +91-9876543210</li>
      <li>🕒 Mon–Sat: 9:00 AM – 8:00 PM</li>
    </ul>
    <button style={{
      marginTop: 20,
      padding: "10px 20px",
      background: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      cursor: "pointer"
    }}>
      Chat with Support
    </button>
  </div>
</section>





      <footer style={{ textAlign: "center", padding: 20, background: "#000", color: "#aaa" }}>
        &copy; {new Date().getFullYear()} HomeCare. Built with ❤️ for comfort.
      </footer>

      
       
      
    </div>
  );
}

export default HomePage;

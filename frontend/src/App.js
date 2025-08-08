import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./AuthPage";
import ClientDashboard from "./pages/ClientDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import VerifyEmail from "./VerifyEmail";
import BookingPage from "./pages/BookingPage";
import HomePage from "./pages/HomePage"; // ✅ Add this line
import "leaflet/dist/leaflet.css";
import ClientProfilePage from "./pages/ClientProfilePage";
import PaymentPage from "./pages/PaymentPage";
import ProviderProfilePage from './pages/ProviderProfilePage';
import ProviderManageServices from './pages/ProviderManageServices';




function App() {
  return (
    <Router>
     <Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/auth" element={<AuthPage />} />
  <Route path="/client-dashboard" element={<ClientDashboard />} />
  <Route path="/provider-dashboard" element={<ProviderDashboard />} />
  <Route path="/verify-email" element={<VerifyEmail />} />
  <Route path="/provider/profile" element={<ProviderProfilePage />} />

<Route path="/provider/services" element={<ProviderManageServices />} />

  <Route path="/book-service" element={<BookingPage />} />
  <Route path="/client-dashboard" element={<ClientDashboard />} />
  <Route path="/client-profile" element={<ClientProfilePage />} />

<Route path="/payment" element={<PaymentPage />} />
  {/* ✅ ADD THIS */}
</Routes>
    </Router>
  );
}

export default App;

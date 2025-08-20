import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./AuthPage";
import ClientDashboard from "./pages/ClientDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import VerifyEmail from "./VerifyEmail";
import BookingPage from "./pages/BookingPage";
import HomePage from "./pages/HomePage";
import ClientProfilePage from "./pages/ClientProfilePage";
import PaymentPage from "./pages/PaymentPage";
import ProviderProfilePage from './pages/ProviderProfilePage';
import ProviderManageServices from './pages/ProviderManageServices';
import ServiceDetails from './pages/ServiceDetails';
import AdminDashboard from "./pages/AdminDashboard"; // ✅

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/provider-dashboard" element={<ProviderDashboard />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/service-details" element={<ServiceDetails />} />
        <Route path="/provider/profile" element={<ProviderProfilePage />} />
        <Route path="/provider/services" element={<ProviderManageServices />} />
        <Route path="/book-service" element={<BookingPage />} />
        <Route path="/client-profile" element={<ClientProfilePage />} />
        <Route path="/payment" element={<PaymentPage />} />

        {/* ✅ Admin Dashboard route without guard for hardcoded login */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCreateCampaign from './pages/admin/CreateCampaign';
import AdminEditCampaign from './pages/admin/EditCampaign';
import AdminMyCampaigns from './pages/admin/MyCampaigns';
import VolunteerDashboard from './pages/volunteer/Dashboard';
import VolunteerBrowse from './pages/volunteer/Browse';
import DeliveryTracking from './pages/volunteer/DeliveryTracking';
import VolunteerOrders from './pages/volunteer/Orders';
import VVerseDashboard from './pages/vverse/VVerseDashboard';
import RoomInterface from './pages/vverse/RoomInterface';
import CreateRoom from './pages/vverse/CreateRoom';
import BrowseRooms from './pages/vverse/BrowseRooms';
import Notifications from './pages/vverse/Notifications';
import CampaignDetails from './pages/CampaignDetails';
import NotFound from './pages/NotFound';

// Bazaar Pages
import BazaarHome from './pages/bazaar/BazaarHome';
import ItemsBrowse from './pages/bazaar/ItemsBrowse';
import ProductDetail from './pages/bazaar/ProductDetail';
import Cart from './pages/bazaar/Cart';
import Checkout from './pages/bazaar/Checkout';
import SellerDashboard from './pages/bazaar/SellerDashboard';
import MyShop from './pages/bazaar/MyShop';
import AddProduct from './pages/bazaar/AddProduct';
import ManageOrders from './pages/bazaar/ManageOrders';
import OrderSuccess from './pages/bazaar/OrderSuccess';
import SellerRegistration from './pages/bazaar/SellerRegistration';
import SellerOnboarding from './pages/bazaar/SellerOnboarding';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    // Redirect based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'seller') {
      return <Navigate to="/bazaar/seller/onboarding" replace />;
    } else {
      return <Navigate to="/volunteer/dashboard" replace />;
    }
  }

  return children;
};

// Main App Component
const AppContent = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="min-h-screen">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes */}
            <Route
              path="/auth/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/auth/signup"
              element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              }
            />

            {/* Campaign Details (Public) */}
            <Route path="/campaign/:id" element={<CampaignDetails />} />

            {/* Bazaar Routes (Public) */}
            <Route path="/bazaar" element={<BazaarHome />} />
            <Route path="/bazaar/browse" element={<ItemsBrowse />} />
            <Route path="/bazaar/product/:id" element={<ProductDetail />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/create-campaign"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCreateCampaign />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/edit-campaign/:id"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminEditCampaign />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/my-campaigns"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminMyCampaigns />
                </ProtectedRoute>
              }
            />

            {/* Volunteer Routes */}
            <Route
              path="/volunteer/dashboard"
              element={
                <ProtectedRoute requiredRole="volunteer">
                  <VolunteerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/browse"
              element={
                <ProtectedRoute requiredRole="volunteer">
                  <VolunteerBrowse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/deliveries"
              element={
                <ProtectedRoute requiredRole="volunteer">
                  <DeliveryTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/orders"
              element={
                <ProtectedRoute requiredRole="volunteer">
                  <VolunteerOrders />
                </ProtectedRoute>
              }
            />

            {/* VVerse Routes */}
            <Route
              path="/vverse"
              element={
                <ProtectedRoute>
                  <VVerseDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vverse/room/:id"
              element={
                <ProtectedRoute>
                  <RoomInterface />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vverse/rooms/create"
              element={
                <ProtectedRoute>
                  <CreateRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vverse/rooms/browse"
              element={
                <ProtectedRoute>
                  <BrowseRooms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vverse/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* Bazaar Protected Routes */}
            <Route
              path="/bazaar/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bazaar/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bazaar/seller"
              element={
                <ProtectedRoute>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bazaar/shop"
              element={
                <ProtectedRoute>
                  <MyShop />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bazaar/seller/add-product"
              element={
                <ProtectedRoute>
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bazaar/seller/orders"
              element={
                <ProtectedRoute>
                  <ManageOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bazaar/seller/register"
              element={
                <ProtectedRoute>
                  <SellerRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bazaar/seller/onboarding"
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bazaar/order-success/:orderId"
              element={
                <ProtectedRoute>
                  <OrderSuccess />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              borderRadius: '0.75rem',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
};

// App with Providers
const App = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;

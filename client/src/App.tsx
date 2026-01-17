import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage.tsx';
import SignupPage from './pages/SignupPage.tsx';
import LandingPage from './pages/LandingPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import FeedPage from './pages/FeedPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import ConnectionsPage from './pages/ConnectionsPage.tsx';
import DiscoverPage from './pages/DiscoverPage.tsx';
import MessagesPage from './pages/MessagesPage.tsx';
import NotificationsPage from './pages/NotificationsPage.tsx';
import Sidebar from './components/Sidebar.tsx';
import MobileNav from './components/MobileNav.tsx';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/welcome" />;
  return <>{children}</>;
};

const Layout = () => {
  const { token } = useAuth();
  const location = useLocation();

  // Hide footer on messages page for full-height chat
  const showFooter = location.pathname !== '/messages';

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {token && <Sidebar />}
      <main className={`main-content ${token ? 'padded-main' : ''}`} style={{ flexDirection: 'column' }}>
        <Routes>
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/connections" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        </Routes>
        {showFooter && (
          <footer style={{
            width: '100%',
            padding: '80px 32px 40px',
            textAlign: 'center',
            marginTop: 'auto',
            borderTop: '1px solid var(--border)',
            background: 'var(--card-bg)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Unique Decorative Element */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100px',
              height: '100px',
              background: 'var(--primary)',
              filter: 'blur(80px)',
              opacity: 0.15,
              zIndex: 0
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ marginBottom: '32px' }}>
                <p style={{
                  fontSize: '24px',
                  color: 'var(--text-main)',
                  fontWeight: '800',
                  marginBottom: '12px',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, var(--primary), #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Managed and designed by Bharani
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                  Building the future of social connection, one vibe at a time.
                </p>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '32px',
                marginBottom: '32px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <a href="#" className="footer-link">Privacy Policy</a>
                <a href="#" className="footer-link">Terms of Service</a>
                <a href="mailto:bharanikumargv07@gmail.com" className="footer-link">Contact Us</a>
              </div>

              <div style={{
                height: '1px',
                width: '60px',
                background: 'var(--border)',
                margin: '0 auto 24px'
              }}></div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '0.01em' }}>
                &copy; {new Date().getFullYear()} <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Vibbin</span>.
                All rights reserved. Registered trademark of Bharanikumar G.V.
              </p>
            </div>
          </footer>
        )}
      </main>
      {token && <MobileNav />}
    </div>
  );
};

const AppContent = () => {
  return (
    <Router>
      <Layout />
    </Router>
  );
};

import { NotificationProvider } from './context/NotificationContext';
import GlobalSplashScreen from './components/GlobalSplashScreen';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <GlobalSplashScreen />
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout.jsx';
import HomePage from './components/HomePage.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import Feed from './components/Feed.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import PaywallScreen from './components/PaywallScreen.jsx';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Wraps any route that requires both login AND verification.
 * - Not logged in  → redirect to home (and open auth modal)
 * - Logged in but unverified → show PaywallScreen inside the Layout
 * - Logged in and verified → render children
 */
function VerifiedRoute({ isLoggedIn, userProfile, setUserProfile, setShowAuth, children }) {
  // Not authenticated at all
  if (!isLoggedIn) {
    if (setShowAuth) setShowAuth(true);
    return <Navigate to="/" replace />;
  }

  // Auth loading — userProfile not fetched yet (null means still loading when isLoggedIn is true)
  // We distinguish null (loading) from explicit profile with isVerified set.
  // If we don't have a profile yet, render nothing while App loads it.
  if (userProfile === null) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-naos-green border-t-transparent" />
      </div>
    );
  }

  // Logged in but not yet verified → paywall
  if (!userProfile.isVerified) {
    return (
      <PaywallScreen
        userProfile={userProfile}
        onVerified={(updates) => setUserProfile((prev) => ({ ...prev, ...updates }))}
      />
    );
  }

  // Verified — render the requested page
  return children;
}

function AppContent() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(auth));

  // Sync Firebase Auth state and load Firestore profile
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        if (db) {
          try {
            const snap = await getDoc(doc(db, 'users', currentUser.uid));
            setUserProfile(snap.exists() ? snap.data() : {});
          } catch (err) {
            console.error('Failed to load user profile:', err);
            setUserProfile({});
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const role    = (userProfile?.role || 'member').toLowerCase();
  const isAdmin = role === 'pro1' || role === 'pro2';

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-naos-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-naos-green border-t-transparent" />
          <p className="text-sm font-medium text-naos-text">Loading NAOS Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout
        setShowAuth={setShowAuth}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        userProfile={userProfile}
      >
        <Routes>
          {/* ── Public ── */}
          <Route
            path="/"
            element={<HomePage setShowAuth={setShowAuth} isLoggedIn={isLoggedIn} />}
          />

          {/* ── Community Feed (login + verified) ── */}
          <Route
            path="/feed"
            element={
              <VerifiedRoute
                isLoggedIn={isLoggedIn}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                setShowAuth={setShowAuth}
              >
                <Feed userProfile={userProfile} />
              </VerifiedRoute>
            }
          />

          {/* ── Member Dashboard (login + verified) ── */}
          <Route
            path="/dashboard"
            element={
              <VerifiedRoute
                isLoggedIn={isLoggedIn}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                setShowAuth={setShowAuth}
              >
                <Dashboard
                  setIsLoggedIn={setIsLoggedIn}
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                />
              </VerifiedRoute>
            }
          />

          {/* ── Admin (login + verified + PRO role) ── */}
          <Route
            path="/admin"
            element={
              !isLoggedIn ? (
                <Navigate to="/" replace />
              ) : !isAdmin ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AdminDashboard userProfile={userProfile} />
              )
            }
          />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* Auth Modal Overlay — only shown when not logged in */}
      {!isLoggedIn && showAuth && (
        authMode === 'login' ? (
          <Login
            setShowAuth={setShowAuth}
            setIsLoggedIn={setIsLoggedIn}
            setAuthMode={setAuthMode}
          />
        ) : (
          <Register
            setShowAuth={setShowAuth}
            setIsLoggedIn={setIsLoggedIn}
            setAuthMode={setAuthMode}
            setUserProfile={setUserProfile}
          />
        )
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

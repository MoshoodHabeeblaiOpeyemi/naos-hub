import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout.jsx';
import HomePage from './components/HomePage.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import Feed from './components/Feed.jsx';
import PastExecutives from './components/PastExecutives.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import PaywallScreen from './components/PaywallScreen.jsx';
import RulesPage from './components/RulesPage.jsx';
import Gallery from './components/Gallery.jsx';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { initFCMAndPrompt } from './utils/fcm';

/**
 * VerifiedRoute — requires login AND isVerified === true.
 * Unverified users see PaywallScreen inline (no redirect).
 */
function VerifiedRoute({ isLoggedIn, userProfile, setUserProfile, setShowAuth, children }) {
  if (!isLoggedIn) {
    if (setShowAuth) setShowAuth(true);
    return <Navigate to="/" replace />;
  }
  if (userProfile === null) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-naos-green border-t-transparent" />
      </div>
    );
  }
  if (!userProfile.isVerified) {
    return (
      <PaywallScreen
        userProfile={userProfile}
        onVerified={(updates) => setUserProfile((prev) => ({ ...prev, ...updates }))}
      />
    );
  }
  return children;
}

function AppContent() {
  const [showAuth, setShowAuth]       = useState(false);
  const [authMode, setAuthMode]       = useState('login');
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        // Prompt for notification permission & initialize FCM
        initFCMAndPrompt(user.uid);
        if (db) {
          try {
            const snap = await getDoc(doc(db, 'users', user.uid));
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
    return () => unsub();
  }, []);

  const role    = (userProfile?.role || 'member').toLowerCase();
  // Only pro1 and pro2 have admin access
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
          <Route path="/" element={<HomePage setShowAuth={setShowAuth} isLoggedIn={isLoggedIn} />} />

          {/* ── Community Feed (login + verified) ── */}
          <Route
            path="/feed"
            element={
              <VerifiedRoute isLoggedIn={isLoggedIn} userProfile={userProfile}
                setUserProfile={setUserProfile} setShowAuth={setShowAuth}>
                <Feed userProfile={userProfile} />
              </VerifiedRoute>
            }
          />

          {/* ── Member Dashboard (login + verified) ── */}
          <Route
            path="/dashboard"
            element={
              <VerifiedRoute isLoggedIn={isLoggedIn} userProfile={userProfile}
                setUserProfile={setUserProfile} setShowAuth={setShowAuth}>
                <Dashboard setIsLoggedIn={setIsLoggedIn} userProfile={userProfile}
                  setUserProfile={setUserProfile} />
              </VerifiedRoute>
            }
          />

          {/* ── Past Executives (login + verified) ── */}
          <Route
            path="/past-executives"
            element={
              <VerifiedRoute isLoggedIn={isLoggedIn} userProfile={userProfile}
                setUserProfile={setUserProfile} setShowAuth={setShowAuth}>
                <PastExecutives />
              </VerifiedRoute>
            }
          />

{/* ── Gallery (login + verified, PROs can upload) ── */}
          <Route
            path="/gallery"
            element={
              <VerifiedRoute isLoggedIn={isLoggedIn} userProfile={userProfile}
                setUserProfile={setUserProfile} setShowAuth={setShowAuth}>
                <Gallery />
              </VerifiedRoute>
            }
          />

{/* ── Rules (login + verified) ── */}
          <Route
            path="/rules"
            element={
              <VerifiedRoute isLoggedIn={isLoggedIn} userProfile={userProfile}
                setUserProfile={setUserProfile} setShowAuth={setShowAuth}>
                <RulesPage />
              </VerifiedRoute>
            }
          />

          {/* ── Admin (login + verified + PRO 1/2 only) ── */}
          <Route
            path="/admin"
            element={
              !isLoggedIn ? <Navigate to="/" replace />
              : !isAdmin  ? <Navigate to="/dashboard" replace />
              : <AdminDashboard userProfile={userProfile} />
            }
          />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {!isLoggedIn && showAuth && (
        authMode === 'login' ? (
          <Login setShowAuth={setShowAuth} setIsLoggedIn={setIsLoggedIn} setAuthMode={setAuthMode} />
        ) : (
          <Register setShowAuth={setShowAuth} setIsLoggedIn={setIsLoggedIn}
            setAuthMode={setAuthMode} setUserProfile={setUserProfile} />
        )
      )}
    </>
  );
}

export default function App() {
  return <Router><AppContent /></Router>;
}

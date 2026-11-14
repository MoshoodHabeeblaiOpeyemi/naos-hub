import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout.jsx';
import HomePage from './components/HomePage.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function AppContent() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  // Initialize authLoading to true only if Firebase auth exists, avoiding synchronous setState in effect
  const [authLoading, setAuthLoading] = useState(Boolean(auth));

  // Sync auth state & fetch user role from Firestore on login
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        if (db) {
          try {
            const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
            if (userSnap.exists()) {
              setUserProfile(userSnap.data());
            } else {
              setUserProfile(null);
            }
          } catch (err) {
            console.error('Failed to load user role from Firestore:', err);
            setUserProfile(null);
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

  const role = (userProfile?.role || 'member').toLowerCase();
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
          <Route path="/" element={<HomePage setShowAuth={setShowAuth} />} />

          {/* Member Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                <Dashboard
                  setIsLoggedIn={setIsLoggedIn}
                  userProfile={userProfile}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Protected Admin Route (pro1 and pro2 only) */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* Auth Modal Overlay */}
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

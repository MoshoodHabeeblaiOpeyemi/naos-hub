import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout.jsx';
import HomePage from './components/HomePage.jsx';
import Dashboard from './components/Dashboard.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function AppContent() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Sync auth state with Firebase Auth if configured
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(Boolean(user));
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Layout
        setShowAuth={setShowAuth}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
      >
        <Routes>
          <Route path="/" element={<HomePage setShowAuth={setShowAuth} />} />
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                <Dashboard setIsLoggedIn={setIsLoggedIn} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
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

import PlaceholderBanner from './components/PlaceholderBanner.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Stats from './components/Stats.jsx';
import About from './components/About.jsx';
import Executives from './components/Executives.jsx';
import Events from './components/Events.jsx';
import Constitution from './components/Constitution.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import { useState } from "react";

/**
 * NAOS Unilorin Hub — public site.
 *
 * One page, no router, no backend. Every section reads from src/data/,
 * which stays pure data so the Stage 3 migration stays mechanical.
 */
export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-naos-white">
      {/* Keyboard users land here first, bypassing the nav links. */}
      <a href="#main" className="sr-only-focusable">
        Skip to main content
      </a>

      <PlaceholderBanner />

      <Navbar setShowAuth={setShowAuth} />

      <main id="main" className="flex-1">
        {isLoggedIn ? (
          <>
            <Hero />
            <Stats />
            <About />
            <Executives />
            <Events />
            <Constitution />
            <Contact />
            <section id="dashboard" className="py-12 bg-naos-gray">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-naos-dark mb-6">
                  Member Dashboard
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-naos-white p-6 rounded-lg border border-naos-gray">
                    <h3 className="text-lg font-bold text-naos-green mb-3">
                      Profile
                    </h3>
                    <p className="text-sm text-naos-text">
                      View and update your member profile details.
                    </p>
                  </div>
                  <div className="bg-naos-white p-6 rounded-lg border border-naos-gray">
                    <h3 className="text-lg font-bold text-naos-green mb-3">
                      Dues Status
                    </h3>
                    <p className="text-sm text-naos-text">
                      Check your dues payment status.
                    </p>
                  </div>
                  <div className="bg-naos-white p-6 rounded-lg border border-naos-gray">
                    <h3 className="text-lg font-bold text-naos-green mb-3">
                      My Attendance
                    </h3>
                    <p className="text-sm text-naos-text">
                      View your event attendance history.
                    </p>
                  </div>
                  <div className="bg-naos-white p-6 rounded-lg border border-naos-gray">
                    <h3 className="text-lg font-bold text-naos-green mb-3">
                      RSVP Events
                    </h3>
                    <p className="text-sm text-naos-text">
                      RSVP to upcoming NAOS events.
                    </p>
                  </div>
                  <div className="bg-naos-white p-6 rounded-lg border border-naos-gray">
                    <h3 className="text-lg font-bold text-naos-green mb-3">
                      Member Directory
                    </h3>
                    <p className="text-sm text-naos-text">
                      Search and connect with fellow members.
                    </p>
                  </div>
                  <div className="bg-naos-white p-6 rounded-lg border border-naos-gray">
                    <h3 className="text-lg font-bold text-naos-green mb-3">
                      Documents
                    </h3>
                    <p className="text-sm text-naos-text">
                      Access constitution, minutes, and reports.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="mt-8 bg-naos-green text-white px-4 py-2 rounded hover:bg-naos-dark transition"
                >
                  Logout
                </button>
              </div>
            </section>
          </>
        ) : (
          <>
            <Hero />
            <Stats />
            <About />
            <Executives />
            <Events />
            <Constitution />
            <Contact />
          </>
        )}
      </main>

      <Footer />

      {/* Auth overlay (Login) */}
      {!isLoggedIn && showAuth && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div className="bg-naos-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 id="auth-modal-title" className="text-2xl font-bold text-naos-dark mb-6">
              Sign In
            </h2>
            <Login setShowAuth={setShowAuth} setIsLoggedIn={setIsLoggedIn} />
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Register overlay */}
      {!isLoggedIn && showAuth && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-modal-title"
        >
          <div className="bg-naos-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 id="register-modal-title" className="text-2xl font-bold text-naos-dark mb-6">
              Register Account
            </h2>
            <Register setShowAuth={setShowAuth} setIsLoggedIn={setIsLoggedIn} />
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

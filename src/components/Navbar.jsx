import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { site } from '../data/site.js';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import ConfirmModal from './ConfirmModal.jsx';
import NotificationBell from './NotificationBell.jsx';

/**
 * Sticky top navigation.
 * Switches between public state (Logo, Home, Login/Join)
 * and authenticated state (Logo, Home, Feed, Dashboard, [Admin Panel], Logout).
 */
export default function Navbar({ setShowAuth, isLoggedIn, setIsLoggedIn, userProfile }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => (typeof window !== 'undefined' ? window.scrollY > 8 : false));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();

  const role = (userProfile?.role || '').toLowerCase();
  const isAdmin = role === 'pro1' || role === 'pro2' || role === 'president';

  // Close mobile menu on screen resize
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (event) => {
      if (event.matches) setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Track window scroll for shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogoutClick = () => {
    setOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    if (setIsLoggedIn) setIsLoggedIn(false);
  };

  const isCurrent = (path) => location.pathname === path;

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-naos-green/95 backdrop-blur transition-shadow ${
          scrolled ? 'shadow-lg shadow-black/20' : ''
        }`}
      >
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
        >
          {/* NAOS Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 rounded-sm"
            aria-label={`${site.chapterLabel} — home`}
          >
            <img
              src={site.logo}
              alt={`${site.shortName} crest`}
              width="40"
              height="40"
              className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-1"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-wide text-naos-gold">
                {site.shortName}
              </span>
              <span className="hidden text-xs text-white/80 sm:block">
                {site.chapter}
              </span>
            </span>
          </Link>

          {/* Mobile Right Action Area: Bell (if logged in) + Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            {isLoggedIn && auth?.currentUser?.uid && (
              <NotificationBell currentUserId={auth.currentUser.uid} />
            )}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="primary-menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10"
            >
              <span className="sr-only">{open ? 'Close main menu' : 'Open main menu'}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isCurrent('/') ? 'text-naos-gold bg-white/10' : 'text-white/90 hover:text-naos-gold hover:bg-white/10'
              }`}
            >
              Home
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/feed"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isCurrent('/feed') ? 'text-naos-gold bg-white/10' : 'text-white/90 hover:text-naos-gold hover:bg-white/10'
                  }`}
                >
                  Feed
                </Link>

                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isCurrent('/dashboard') ? 'text-naos-gold bg-white/10' : 'text-white/90 hover:text-naos-gold hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-1.5 rounded-md bg-naos-gold text-naos-dark font-bold text-xs hover:bg-yellow-400 transition-colors shadow-xs"
                  >
                    Admin Panel
                  </Link>
                )}

                {/* Notifications Bell */}
                {auth?.currentUser?.uid && (
                  <NotificationBell currentUserId={auth.currentUser.uid} />
                )}

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="px-3 py-1.5 rounded-md text-white/80 hover:text-red-300 font-medium text-sm transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuth && setShowAuth(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-naos-gold text-naos-dark font-bold text-sm hover:bg-yellow-400 transition-colors cursor-pointer shadow-xs"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login / Join
              </button>
            )}
          </div>

          {/* Mobile Dropdown Menu */}
          <div
            id="primary-menu"
            className={`${
              open ? 'flex' : 'hidden'
            } absolute inset-x-0 top-full flex-col gap-2 border-t border-white/10 bg-naos-dark px-4 py-4 md:hidden shadow-xl`}
          >
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isCurrent('/') ? 'text-naos-gold bg-white/10' : 'text-white/90 hover:bg-white/10 hover:text-naos-gold'
              }`}
            >
              Home
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/feed"
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isCurrent('/feed') ? 'text-naos-gold bg-white/10' : 'text-white/90 hover:bg-white/10 hover:text-naos-gold'
                  }`}
                >
                  Feed
                </Link>

                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isCurrent('/dashboard') ? 'text-naos-gold bg-white/10' : 'text-white/90 hover:bg-white/10 hover:text-naos-gold'
                  }`}
                >
                  Dashboard
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="block rounded-md bg-naos-gold px-3 py-2 text-center text-sm font-bold text-naos-dark hover:bg-yellow-400"
                  >
                    Admin Panel
                  </Link>
                )}

                {isLoggedIn && (
                  <Link
                    to="/rules"
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isCurrent('/rules') ? 'text-naos-gold bg-white/10' : 'text-white/90 hover:bg-white/10 hover:text-naos-gold'
                    }`}
                  >
                    Rules
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="block w-full text-left rounded-md px-3 py-2 text-sm font-medium text-red-300 hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (setShowAuth) setShowAuth(true);
                }}
                className="mt-2 block w-full rounded-md bg-naos-gold px-4 py-2.5 text-center text-sm font-bold text-naos-dark hover:bg-yellow-400 shadow-sm"
              >
                Login / Join
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of your NAOS Hub account?"
        confirmText="Yes, Logout"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}

import PlaceholderBanner from './PlaceholderBanner.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function Layout({ children, setShowAuth, isLoggedIn, setIsLoggedIn }) {
  return (
    <div className="flex min-h-screen flex-col bg-naos-white">
      <a href="#main" className="sr-only-focusable">
        Skip to main content
      </a>
      <PlaceholderBanner />
      <Navbar
        setShowAuth={setShowAuth}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
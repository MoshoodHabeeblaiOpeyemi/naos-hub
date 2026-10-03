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

/**
 * NAOS Unilorin Hub — public site.
 *
 * One page, no router, no backend. Every section reads from src/data/,
 * which stays pure data so the Stage 3 migration stays mechanical.
 */
export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-naos-white">
      {/* Keyboard users land here first, bypassing the nav links. */}
      <a href="#main" className="sr-only-focusable">
        Skip to main content
      </a>

      <PlaceholderBanner />

      <Navbar />

      <main id="main" className="flex-1">
        <Hero />
        <Stats />
        <About />
        <Executives />
        <Events />
        <Constitution />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}

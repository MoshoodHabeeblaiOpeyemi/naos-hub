import Hero from './Hero.jsx';
import Stats from './Stats.jsx';
import About from './About.jsx';
import Executives from './Executives.jsx';
import Events from './Events.jsx';
import Constitution from './Constitution.jsx';
import Contact from './Contact.jsx';

export default function HomePage({ setShowAuth, isLoggedIn }) {
  return (
    <>
      <Hero setShowAuth={setShowAuth} isLoggedIn={isLoggedIn} />
      <Stats />
      <About />
      <Executives />
      <Events />
      <Constitution />
      <Contact />
    </>
  );
}
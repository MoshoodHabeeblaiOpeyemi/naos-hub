import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      if (auth?.currentUser && db) {
        try {
          const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (snap.exists()) {
            setProfile(snap.data());
          }
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }
      }
    }
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setIsLoggedIn(false);
    navigate('/');
  };

  const displayName = profile?.name || auth?.currentUser?.email?.split('@')[0] || 'Member';

  const dashboardCards = [
    {
      title: 'Profile',
      description: 'View and update your member profile details.',
      tag: 'Account',
    },
    {
      title: 'Dues Status',
      description: 'Check your dues payment status and receipt history.',
      tag: 'Finance',
    },
    {
      title: 'My Attendance',
      description: 'View your event attendance history and congress records.',
      tag: 'Events',
    },
    {
      title: 'RSVP Events',
      description: 'RSVP to upcoming NAOS events, dinners, and seminars.',
      tag: 'Upcoming',
    },
    {
      title: 'Member Directory',
      description: 'Search and connect with fellow Oyo State students across faculties.',
      tag: 'Community',
    },
    {
      title: 'Documents',
      description: 'Access the constitution, meeting minutes, and financial reports.',
      tag: 'Archive',
    },
  ];

  return (
    <section id="dashboard" className="py-12 bg-naos-gray/30 min-h-[calc(100vh-16rem)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header with profile banner */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-naos-gray/40 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-naos-dark">
                Member Dashboard
              </h1>
              <span className="rounded-full bg-naos-gold/20 px-3 py-0.5 text-xs font-semibold text-naos-dark capitalize border border-naos-gold/40">
                {profile?.role || 'member'}
              </span>
            </div>
            <p className="mt-1 text-sm text-naos-text">
              Welcome back, <span className="font-semibold text-naos-dark">{displayName}</span>! Access your membership privileges and association resources.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 sm:w-auto cursor-pointer"
          >
            Logout
          </button>
        </div>

        {/* Member Academic Summary Strip if profile loaded */}
        {profile && (
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-naos-gray/40 shadow-xs">
            <div>
              <span className="block text-[11px] font-semibold uppercase text-naos-text/70">Matric No.</span>
              <span className="font-bold text-naos-dark text-sm sm:text-base">{profile.matric || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-naos-text/70">Current Level</span>
              <span className="font-bold text-naos-green text-sm sm:text-base">{profile.level || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-naos-text/70">Department</span>
              <span className="font-bold text-naos-dark text-sm sm:text-base truncate block" title={profile.dept}>
                {profile.dept || 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase text-naos-text/70">LGA</span>
              <span className="font-bold text-naos-dark text-sm sm:text-base">{profile.lga || 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardCards.map((card) => (
            <div
              key={card.title}
              className="group rounded-lg border border-naos-gray/50 bg-naos-white p-6 shadow-sm transition hover:border-naos-green hover:shadow-md"
            >
              <span className="inline-block rounded bg-naos-green/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-naos-green mb-3">
                {card.tag}
              </span>
              <h2 className="text-xl font-bold text-naos-dark group-hover:text-naos-green transition-colors mb-2">
                {card.title}
              </h2>
              <p className="text-sm text-naos-text leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

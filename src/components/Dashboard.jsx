import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard({ setIsLoggedIn, userProfile }) {
  const navigate = useNavigate();
  const [localProfile, setLocalProfile] = useState(null);

  useEffect(() => {
    // If userProfile was provided by App, no need to fetch locally
    if (userProfile) return;

    async function fetchProfile() {
      if (auth?.currentUser && db) {
        try {
          const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (snap.exists()) {
            setLocalProfile(snap.data());
          }
        } catch (err) {
          console.error('Failed to fetch profile in Dashboard:', err);
        }
      }
    }
    fetchProfile();
  }, [userProfile]);

  const profile = userProfile || localProfile;

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

  const role = (profile?.role || 'member').toLowerCase();
  const isAdmin = role === 'pro1' || role === 'pro2';

  const formatRoleBadge = (r) => {
    if (!r || r === 'member') return null;
    if (r === 'pro1') return 'PRO I';
    if (r === 'pro2') return 'PRO II';
    return r.toUpperCase();
  };

  const roleBadge = formatRoleBadge(role);
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
        {/* Header with profile banner and role badge */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-naos-gray/40 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-naos-dark">
                Member Dashboard
              </h1>
              {roleBadge && (
                <span className="inline-flex items-center rounded-full bg-naos-gold px-3 py-0.5 text-xs font-bold text-naos-dark shadow-xs border border-yellow-600/20">
                  {roleBadge}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap text-sm text-naos-text">
              <span>Welcome back,</span>
              <span className="font-semibold text-naos-dark">{displayName}</span>
              {roleBadge && (
                <span className="inline-flex items-center rounded-full bg-naos-gold px-2 py-0.5 text-[11px] font-bold text-naos-dark shadow-xs">
                  {roleBadge}
                </span>
              )}
              <span>! Access your membership privileges and association resources.</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-naos-green px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-naos-dark cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Panel
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Member Academic Summary Strip */}
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

        {/* Admin Callout Banner for PRO */}
        {isAdmin && (
          <div className="mb-8 bg-gradient-to-r from-naos-green to-naos-dark text-white p-6 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-naos-gold text-naos-dark font-bold text-xs px-2.5 py-0.5 rounded-full">
                  {roleBadge}
                </span>
                <h3 className="font-bold text-lg text-white">Public Relations Officer Portal</h3>
              </div>
              <p className="text-white/80 text-sm">
                You have administrative access to publish broadcasts and announcements directly to the NAOS Hub.
              </p>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-md bg-naos-gold px-5 py-2.5 text-sm font-bold text-naos-dark transition hover:bg-yellow-400 shrink-0"
            >
              Open Admin Panel &rarr;
            </Link>
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

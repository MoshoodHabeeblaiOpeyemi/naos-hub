import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { calculateAcademicLevel } from '../utils/academicLevel';
import { generatePassId } from '../utils/passId';
import { initFCMAndPrompt } from '../utils/fcm';

const VALID_LGAS = ['Oyo East', 'Oyo West', 'Afijio', 'Atiba'];
const ENTRY_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

export default function Register({ setShowAuth, setIsLoggedIn, setAuthMode, setUserProfile }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [matric, setMatric] = useState('');
  const [dept, setDept] = useState('');
  const [entryYear, setEntryYear] = useState('');
  const [courseDuration, setCourseDuration] = useState('');
  const [lga, setLGA] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Live calculation of current academic level
  const calculatedLevel = calculateAcademicLevel(entryYear, courseDuration);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    // Guard: Firebase not configured
    if (!auth || !db) {
      setMessage('Firebase is not configured on this deployment. Please configure environment variables.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!name.trim() || !dept.trim() || !phone.trim() || !matric.trim()) {
      setMessage('Please fill in all required fields.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@+/, '');
    if (!cleanUsername) {
      setMessage('Please choose a username.');
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setMessage('Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
      return;
    }

    if (!entryYear) {
      setMessage('Please select your Year of Entry.');
      return;
    }

    if (!courseDuration) {
      setMessage('Please select your Course Duration.');
      return;
    }

    // Strict LGA validation
    if (!lga || !VALID_LGAS.includes(lga)) {
      setMessage('Please select a valid Oyo State LGA');
      return;
    }

    setLoading(true);
    try {
      // Check Firestore to ensure username is unique
      const usernameQuery = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        setMessage(`The username @${cleanUsername} is already taken. Please choose another.`);
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;
      const passId = generatePassId();

      // Save user record to Firestore with calculated academic level, username & member role
      await setDoc(doc(db, 'users', uid), {
        name: name.trim(),
        username: cleanUsername,
        passId,
        matric: matric.trim().toUpperCase(),
        dept: dept.trim(),
        entryYear: Number(entryYear),
        courseDuration: Number(courseDuration),
        level: calculatedLevel,
        lga: lga.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role: 'member',
        isVerified: false,
        createdAt: new Date().toISOString(),
      });

      setMessage('Account created successfully!');
      setIsLoggedIn(true);
      initFCMAndPrompt(uid);
      if (setUserProfile) {
        setUserProfile({
          name: name.trim(),
          username: cleanUsername,
          passId,
          matric: matric.trim().toUpperCase(),
          dept: dept.trim(),
          entryYear: Number(entryYear),
          courseDuration: Number(courseDuration),
          level: calculatedLevel,
          lga: lga.trim(),
          phone: phone.trim(),
          email: email.trim(),
          role: 'member',
          isVerified: false,
        });
      }
      setShowAuth(false);
      // VerifiedRoute will catch unverified users and show PaywallScreen
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      let errorMsg = 'Failed to create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email address is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please use a stronger password.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={() => setShowAuth(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
    >
      <div
        className="relative bg-naos-white rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-naos-gray/30 my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setShowAuth(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-md transition"
          aria-label="Close modal"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id="register-modal-title" className="text-2xl font-bold text-naos-dark mb-1 text-center">
          Member Registration
        </h2>
        <p className="text-xs text-naos-text text-center mb-5">
          Join the digital portal for Oyo State Students, Unilorin
        </p>

        {message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              message.includes('successfully')
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3">
          {/* Full Name & Username */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-name">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Adebayo Olumide"
                className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-username">
                Username (@) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-naos-text/60 font-semibold text-sm">
                  @
                </span>
                <input
                  id="reg-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="username"
                  className="w-full border border-naos-gray rounded-md pl-7 pr-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-email">
                Email Address
              </label>
              <input
                id="reg-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
                placeholder="student@unilorin.edu.ng"
                className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-phone">
                Phone Number
              </label>
              <input
                id="reg-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                type="tel"
                placeholder="08012345678"
                className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Matric Number & Department */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-matric">
                Matric Number
              </label>
              <input
                id="reg-matric"
                value={matric}
                onChange={(e) => setMatric(e.target.value)}
                required
                placeholder="e.g. 21/52HA045"
                className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-dept">
                Department
              </label>
              <input
                id="reg-dept"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                required
                placeholder="e.g. Computer Science"
                className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Academic Logic: Year of Entry & Course Duration */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-entry-year">
                Year of Entry
              </label>
              <select
                id="reg-entry-year"
                value={entryYear}
                onChange={(e) => setEntryYear(e.target.value)}
                required
                className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition bg-white"
              >
                <option value="" disabled>Select Entry Year</option>
                {ENTRY_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-duration">
                Course Duration
              </label>
              <select
                id="reg-duration"
                value={courseDuration}
                onChange={(e) => setCourseDuration(e.target.value)}
                required
                className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition bg-white"
              >
                <option value="" disabled>Select Duration</option>
                <option value="4">4 Years</option>
                <option value="5">5 Years</option>
              </select>
            </div>
          </div>

          {/* Dynamic Level Calculation Display */}
          {calculatedLevel && (
            <div className="rounded-md bg-naos-green/10 border border-naos-green/30 px-3 py-2 text-xs flex items-center justify-between text-naos-green font-medium">
              <span>Calculated Current Level:</span>
              <span className="font-bold bg-white px-2.5 py-0.5 rounded shadow-xs text-naos-dark border border-naos-green/20">
                {calculatedLevel}
              </span>
            </div>
          )}

          {/* Strict LGA Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-lga">
              LGA (Local Government Area in Oyo State)
            </label>
            <select
              id="reg-lga"
              value={lga}
              onChange={(e) => setLGA(e.target.value)}
              required
              className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition bg-white"
            >
              <option value="" disabled>Select LGA</option>
              {VALID_LGAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-password">
                Password
              </label>
              <input
                id="reg-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                autoComplete="new-password"
                placeholder="Min. 6 chars"
                className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-naos-text mb-1" htmlFor="reg-confirm">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                required
                autoComplete="new-password"
                placeholder="Confirm password"
                className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-naos-green text-white font-medium py-2.5 rounded-md hover:bg-naos-dark transition duration-150 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-naos-text">
          <span>Already have an account? </span>
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className="text-naos-gold font-semibold hover:underline cursor-pointer ml-1"
          >
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}
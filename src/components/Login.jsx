import { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { initFCMAndPrompt } from '../utils/fcm';

export default function Login({ setShowAuth, setIsLoggedIn, setAuthMode }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Guard: Firebase not configured
    if (!auth) {
      setMessage('Firebase is not configured on this deployment. Please configure environment variables.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      // Prompt user to allow notifications upon login and set up FCM
      initFCMAndPrompt(userCredential.user.uid);
      setMessage('Signed in successfully!');
      setIsLoggedIn(true);
      setShowAuth(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Sign-in error:', err);
      let errorMsg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
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
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={() => setShowAuth(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="relative bg-naos-white rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-naos-gray/30"
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

        <h2 id="auth-modal-title" className="text-2xl font-bold text-naos-dark mb-2 text-center">
          Sign In
        </h2>
        <p className="text-xs text-naos-text text-center mb-6">
          Access your NAOS Unilorin member dashboard
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-naos-text mb-1" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
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
            <label className="block text-sm font-medium text-naos-text mb-1" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-naos-green text-white font-medium py-2.5 rounded-md hover:bg-naos-dark transition duration-150 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-naos-text">
          <span>Don&apos;t have an account? </span>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className="text-naos-gold font-semibold hover:underline cursor-pointer ml-1"
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}
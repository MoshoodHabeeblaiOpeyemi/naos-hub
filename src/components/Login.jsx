import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Login({ setShowAuth, setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isRegister) {
        // Register user with email/password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Save profile to Firestore
        await setDoc(doc(db, "users", uid), {
          name: "",
          level: "",
          dept: "",
          lga: "",
          phone: "",
          email: userCredential.user.email,
          createdAt: new Date(),
        });

        setMessage("Account created successfully!");
        setIsLoggedIn(true);
        setShowAuth(false);
      } else {
        // Sign in
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("Signed in successfully!");
        setIsLoggedIn(true);
        setShowAuth(false);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Something went wrong");
    }
  };

  return (
    <div className="bg-naos-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-naos-dark mb-6 text-center">
          {isRegister ? "Register" : "Login"}
        </h2>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.includes("created") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-naos-text mb-2">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full border border-naos-gray rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-naos-text mb-2">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full border border-naos-gray rounded px-3 py-2"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-naos-text mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                required
                className="w-full border border-naos-gray rounded px-3 py-2"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-naos-green text-white py-2 rounded hover:bg-naos-dark transition"
          >
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-naos-gray">
            Don't have an account?{" "}
            <span
              onClick={() => setIsRegister(true)}
              className="text-naos-gold font-medium underline cursor-pointer"
            >
              Register
            </span>
          </span>{" "}
          <span className="text-sm text-naos-gray">
            Already have an account?{" "}
            <span
              onClick={() => setIsRegister(false)}
              className="text-naos-gold font-medium underline cursor-pointer"
            >
              Login
            </span>
          </span>
        </div>
      </div>
  );
}
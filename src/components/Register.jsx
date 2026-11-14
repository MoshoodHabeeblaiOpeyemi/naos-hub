import { useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Register({ setShowAuth, setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [dept, setDept] = useState("");
  const [lga, setLGA] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    // Guard: Firebase not configured
    if (!auth || !db) {
      setMessage("Firebase is not configured on this deployment. Please contact the developer.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (!name.trim() || !level.trim() || !dept.trim() || !lga.trim() || !phone.trim()) {
      setMessage("Please fill in all fields");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        name: name.trim(),
        level: level.trim(),
        dept: dept.trim(),
        lga: lga.trim(),
        phone: phone.trim(),
        email: email.trim(),
        createdAt: new Date(),
      });

      setMessage("Account created successfully! You can now login.");
        setIsLoggedIn(true);
        setShowAuth(false);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Registration failed");
    }
  };
return (
    <div className="bg-naos-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-naos-dark mb-6 text-center">
          Member Registration
        </h2>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.includes("successfully") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-naos-text mb-2">
              Confirm Password
            </label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              required
              className="w-full border border-naos-gray rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-naos-text mb-2">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-naos-gray rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-naos-text mb-2">
                Level
              </label>
              <input
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
                type="text"
                className="w-full border border-naos-gray rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-naos-text mb-2">
                Department
              </label>
              <input
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                required
                className="w-full border border-naos-gray rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-naos-text mb-2">
              LGA (Local Government Area)
            </label>
            <input
              value={lga}
              onChange={(e) => setLGA(e.target.value)}
              required
              className="w-full border border-naos-gray rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-naos-text mb-2">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              type="tel"
              className="w-full border border-naos-gray rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-naos-green text-white py-2 rounded hover:bg-naos-dark transition"
          >
            Register Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-naos-gray">
            Already have an account?{" "}
            <span
              className="text-naos-gold font-medium underline cursor-pointer"
            >
              Login
            </span>
          </span>
        </div>
      </div>
  );
}
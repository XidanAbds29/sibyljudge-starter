// frontend/client/src/pages/AuthPage.jsx
import React, { useState, useRef, useEffect } from "react";
// Ensure this path is correct based on where you saved AuthContext.jsx
import { useAuth } from "../components/AuthContext"; // Or ../contexts/AuthContext
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

// Animated loading dots component
const LoadingDots = () => (
  <motion.div
    className="flex space-x-1 items-center justify-center"
    initial="initial"
    animate="animate"
    variants={{
      initial: {},
      animate: { transition: { staggerChildren: 0.2 } },
    }}
  >
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="h-2 w-2 bg-cyan-400 rounded-full"
        variants={{
          initial: { y: 0 },
          animate: {
            y: [0, -5, 0],
            transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
          },
        }}
      />
    ))}
  </motion.div>
);

const AuthForm = ({ isLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // For signup
  const [institution, setInstitution] = useState(""); // Optional for signup
  const [bio, setBio] = useState(""); // Optional for signup
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing..."); // Dynamic loading message

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    setLoadingMessage(
      isLogin ? "Verifying Credentials..." : "Initiating Secure Signup..."
    );

    // Simulate a slight delay for the loading message to be visible
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      let response;
      if (isLogin) {
        setLoadingMessage("Accessing Mainframe...");
        await new Promise((resolve) => setTimeout(resolve, 700)); // Another small delay
        response = await signIn(email, password);
      } else {
        if (!username.trim()) {
          setError("Username is required for signup.");
          setLoading(false);
          return;
        }
        setLoadingMessage("Registering New Operative...");
        await new Promise((resolve) => setTimeout(resolve, 700));
        response = await signUp(email, password, username, {
          institution,
          bio,
        });
      }

      if (response.error) {
        setError(response.error.message);
        setLoadingMessage("Authentication Failed."); // Update message on error
        setTimeout(() => setLoading(false), 1000); // Keep error visible briefly
      } else {
        if (isLogin) {
          setLoadingMessage("Access Granted! Redirecting...");
          setMessage("Login successful! Redirecting..."); // Keep for screen readers or if animation fails
          setTimeout(() => navigate(from, { replace: true }), 1500);
        } else {
          if (response.user && !response.session) {
            setLoadingMessage("Account Created. Confirmation Required.");
            setMessage(
              "Signup successful! Please check your email to confirm your account."
            );
            setLoading(false); // Stop loading to show message
          } else if (response.user && response.session) {
            setLoadingMessage("Registration Complete! Redirecting...");
            setMessage("Signup successful! Redirecting...");
            setTimeout(() => navigate(from, { replace: true }), 1500);
          } else {
            setLoadingMessage("Signup Initiated.");
            setMessage("Signup process initiated. Follow instructions if any.");
            setLoading(false); // Stop loading to show message
          }
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      setLoadingMessage("System Error.");
      setTimeout(() => setLoading(false), 1000);
    }
    // setLoading(false) is handled within specific paths or by timeout on success for redirection
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md p-8 space-y-6 bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-2xl border border-cyan-700/60 relative overflow-hidden"
    >
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-grid-pattern opacity-[0.02] animate-pulse pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl p-8"
          >
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-xl font-semibold text-cyan-400 mb-2 tracking-wider">
              {loadingMessage}
            </p>
            <LoadingDots />
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            {message && (
              <p className="mt-4 text-sm text-green-400">{message}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2
              className="text-3xl font-bold text-center text-cyan-400"
              style={{ textShadow: "0 0 8px rgba(0, 255, 255, 0.5)" }}
            >
              {isLogin ? "Access Terminal" : "Register Operative"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Callsign (Username)
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2.5 bg-gray-800/70 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-200 transition-colors"
                  />
                </div>
              )}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300"
                >
                  Email Matrix ID
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2.5 bg-gray-800/70 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-200 transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300"
                >
                  Access Code (Password)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2.5 bg-gray-800/70 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-200 transition-colors"
                />
              </div>
              {!isLogin && (
                <>
                  <div>
                    <label
                      htmlFor="institution"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Affiliation (Institution - Optional)
                    </label>
                    <input
                      id="institution"
                      name="institution"
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="mt-1 block w-full px-3 py-2.5 bg-gray-800/70 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-200 transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Profile Dossier (Bio - Optional)
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2.5 bg-gray-800/70 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-200 resize-none transition-colors"
                    />
                  </div>
                </>
              )}
              {error && (
                <p className="text-sm text-red-400 bg-red-900/40 p-2.5 rounded-md border border-red-700/70">
                  {error}
                </p>
              )}
              {message && !loading && (
                <p className="text-sm text-green-400 bg-green-900/40 p-2.5 rounded-md border border-green-700/70">
                  {message}
                </p>
              )}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-950 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(56,189,248,0.7)]"
                >
                  {isLogin
                    ? "Initiate Login Sequence"
                    : "Create Secure Account"}
                </button>
              </div>
            </form>
            <p className="mt-8 text-center text-sm text-gray-400">
              {isLogin ? "No Clearance? " : "Already an Operative? "}
              <Link
                to={isLogin ? "/signup" : "/login"}
                className="font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                {isLogin ? "Request Access" : "Log In"}
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function AuthPage() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const formRef = useRef();
  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power4.out",
        }
      );
    }
  }, []);

  return (
    <div
      ref={formRef}
      className="min-h-screen flex flex-col items-center justify-center bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 font-['Orbitron',_sans-serif]"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none animate-pulse"></div>
      <div className="w-full max-w-2xl">
        {" "}
        {/* Increased max width for better visibility */}
        <AuthForm isLogin={isLogin} />
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function NeonGlowSVG({ className = "", style = {}, ...props }) {
  return (
    <svg
      className={"absolute pointer-events-none z-0 " + className}
      style={style}
      width="100%"
      height="100%"
      viewBox="0 0 1440 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      {...props}
    >
      <defs>
        <radialGradient id="neon-glow-update-profile" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx="720"
        cy="100"
        rx="700"
        ry="60"
        fill="url(#neon-glow-update-profile)"
      />
    </svg>
  );
}

const UpdateProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    institution: user?.institution || "",
    bio: user?.bio || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      import("gsap").then(({ gsap }) => {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, y: 40, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.1,
            ease: "power4.out",
          }
        );
      });
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Update profile directly
      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: form.username,
          institution: form.institution,
          bio: form.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) throw error;

      setSuccess("Profile updated successfully!");
      setTimeout(() => navigate("/profile"), 1000);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-0 relative overflow-hidden">
      <div className="fixed inset-0 w-screen h-screen z-0 left-0 top-0">
        <div className="absolute inset-0 pointer-events-none z-10">
          <svg
            width="100vw"
            height="100vh"
            viewBox="0 0 1920 1080"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full block"
          >
            <defs>
              <radialGradient
                id="cyanglow-update-profile"
                cx="50%"
                cy="50%"
                r="80%"
              >
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.38" />
                <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect
              width="1920"
              height="1080"
              fill="url(#cyanglow-update-profile)"
            />
          </svg>
        </div>
      </div>
      <div
        ref={containerRef}
        className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-cyan-500/20 relative z-10 min-h-screen flex flex-col justify-center"
      >
        <div className="relative">
          <NeonGlowSVG style={{ top: "-50px" }} />
          <h1
            className="text-4xl font-bold text-center mb-2 text-cyan-300"
            style={{ textShadow: "0 0 12px rgba(56, 189, 248, 0.5)" }}
          >
            Update Profile
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Update your public profile details
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-500/50 rounded-lg text-green-200">
            {success}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-gray-400 font-medium">
              Username <span className="text-pink-400">*</span>
            </label>
            <input
              className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
              type="text"
              name="username"
              placeholder="Enter your username..."
              value={form.username}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400 font-medium">
              Email
            </label>
            <input
              className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 opacity-70 cursor-not-allowed"
              type="email"
              name="email"
              value={form.email}
              disabled
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400 font-medium">
              Institution
            </label>
            <input
              className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
              type="text"
              name="institution"
              placeholder="Your institution..."
              value={form.institution}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400 font-medium">
              Bio
            </label>
            <textarea
              className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
              name="bio"
              placeholder="A short bio about you..."
              rows="3"
              value={form.bio}
              onChange={handleChange}
            />
          </div>
        </form>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={() => navigate("/profile")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition duration-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-semibold rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfilePage;

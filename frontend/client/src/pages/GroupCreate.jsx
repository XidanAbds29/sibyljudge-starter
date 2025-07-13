
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

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
        <radialGradient id="neon-glow-create-group" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow-create-group)" />
    </svg>
  );
}

const PRIVACY_OPTIONS = ["Public", "Private"];

export default function GroupCreate() {
  const [step, setStep] = useState(1);
  const [groupInfo, setGroupInfo] = useState({
    name: "",
    privacy: "Public",
    password: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { user } = useAuth(); // Get user from AuthContext

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
  }, [step]);

  const validateStep1 = () => {
    const { name, privacy, password } = groupInfo;
    if (!name) {
      setError("Group name is required.");
      return false;
    }
    // privacy defaults to "Public" if not set
    if ((privacy || "Public") === "Private" && !password) {
      setError("Password is required for private groups.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleCreateGroup = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Use AuthContext for user
      if (!user) {
        setError("You must be logged in to create a group.");
        setLoading(false);
        return;
      }
      // Use id (uuid) from user object
      const created_by = user.id;
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupInfo.name,
          privacy: groupInfo.privacy,
          password: groupInfo.privacy === "Private" ? groupInfo.password : "",
          description: groupInfo.description,
          created_by,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to create group");
      }
      const { group } = await res.json();
      setSuccess("Group created successfully!");
      setTimeout(() => navigate(`/group/${group.group_id}`), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <section>
          <h2 className="text-2xl font-bold text-pink-400 mb-6 pb-2 border-b-2 border-pink-700/50" style={{ textShadow: "0 0 8px rgba(236, 72, 153, 0.5)" }}>
            Group Details
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-gray-400 font-medium">Group Name <span className="text-pink-400">*</span></label>
              <input
                className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                type="text"
                placeholder="Enter a cool name..."
                value={groupInfo.name}
                onChange={e => setGroupInfo({ ...groupInfo, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block mb-1 text-sm text-gray-400 font-medium">Privacy <span className="text-pink-400">*</span></label>
                <select
                  className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  value={groupInfo.privacy}
                  onChange={e => setGroupInfo({ ...groupInfo, privacy: e.target.value, password: "" })}
                >
                  {PRIVACY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            {groupInfo.privacy === "Private" && (
              <div>
                <label className="block mb-1 text-sm text-gray-400 font-medium">Password <span className="text-pink-400">*</span></label>
                <input
                  className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-pink-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  type="password"
                  placeholder="Required for private groups"
                  value={groupInfo.password}
                  onChange={e => setGroupInfo({ ...groupInfo, password: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <label className="block mb-1 text-sm text-gray-400 font-medium">Description</label>
              <textarea
                className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                placeholder="A brief, exciting description..."
                rows="3"
                value={groupInfo.description}
                onChange={e => setGroupInfo({ ...groupInfo, description: e.target.value })}
              />
            </div>
          </form>
        </section>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-0 relative overflow-hidden">
      <div className="fixed inset-0 w-screen h-screen z-0 left-0 top-0">
        <div className="absolute inset-0 pointer-events-none z-10">
          <svg width="100vw" height="100vh" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
            <defs>
              <radialGradient id="cyanglow-group" cx="50%" cy="50%" r="80%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.38" />
                <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1920" height="1080" fill="url(#cyanglow-group)" />
          </svg>
        </div>
      </div>
      <div
        ref={containerRef}
        className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-cyan-500/20 relative z-10 min-h-screen flex flex-col justify-center"
      >
        <div className="relative">
          <NeonGlowSVG style={{ top: "-50px" }} />
          <h1 className="text-4xl font-bold text-center mb-2 text-cyan-300" style={{ textShadow: "0 0 12px rgba(56, 189, 248, 0.5)" }}>
            Create New Group
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Build your community of problem solvers
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

        <div className="space-y-6">
          {renderStep()}
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={() => navigate('/groups')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition duration-300"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (validateStep1()) {
                handleCreateGroup();
              }
            }}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-semibold rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

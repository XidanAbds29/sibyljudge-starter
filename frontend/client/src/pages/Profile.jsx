import React, { useEffect, useRef } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import CyberGrid from "../components/CyberGrid";
import { gsap } from "gsap";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  useEffect(() => {
    // Optionally, you could refetch user/session here if needed
  }, []);

  useEffect(() => {
    if (profileRef.current && user) {
      gsap.fromTo(
        profileRef.current,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power4.out",
        }
      );
      const items = profileRef.current.querySelectorAll(".profile-card-animate");
      gsap.fromTo(
        items,
        { opacity: 0, y: 30, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.2,
        }
      );
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-400">
        <div>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 relative flex items-center justify-center overflow-x-hidden">
      {/* Neon grid background */}
      <CyberGrid />
      {/* Neon glow SVG background */}
      <div className="fixed inset-0 z-0 animate-gradient-bg bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#00c9ff] opacity-80 blur-2xl" />
      <div className="absolute inset-0 -z-10 opacity-30 blur-3xl pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 1440 320">
          <path fill="url(#gradient1)" d="M0,128L30,133.3C60,139,120,149,180,160C240,171,300,181,360,186.7C420,192,480,192,540,186.7C600,181,660,171,720,160C780,149,840,139,900,133.3C960,128,1020,128,1080,133.3C1140,139,1200,149,1260,160C1320,171,1380,181,1410,186.7L1440,192L1440,320L1080,320C1140,320,1200,320,1260,320C1320,320,1380,320,1410,320L1440,320Z" />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00c9ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#2c5364" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {/* Main neon card/tab */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-2 sm:px-8 py-16 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="relative w-full">
          {/* Neon border and glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-pink-400/20 to-sky-400/20 blur-lg opacity-60 pointer-events-none" />
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-pink-400/20 to-sky-400/20 blur-lg opacity-60 pointer-events-none" />
          <div className="relative bg-gray-900/80 backdrop-blur-md border-2 border-cyan-400/40 shadow-[0_0_40px_0_rgba(34,211,238,0.15)] rounded-2xl px-6 sm:px-16 py-12 flex flex-col gap-8 items-center w-full min-h-[70vh]">
            <div className="text-4xl font-extrabold text-cyan-400 tracking-wide mb-4 text-center bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 bg-clip-text text-transparent animate-gradient-text drop-shadow-lg" style={{ textShadow: "0 0 16px #00fff7, 0 0 32px #00fff7" }}>
              User Profile
            </div>
            <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto" ref={profileRef}>
              <div className="bg-gray-900/80 rounded-lg shadow-xl border border-cyan-700/40 p-6 profile-card-animate">
                <span className="block text-cyan-300 font-semibold mb-1">Username</span>
                <span className="block text-cyan-100 text-xl font-bold">{user.username || "-"}</span>
              </div>
              <div className="bg-gray-900/80 rounded-lg shadow-xl border border-cyan-700/40 p-6 profile-card-animate">
                <span className="block text-cyan-300 font-semibold mb-1">Email</span>
                <span className="block text-cyan-100">{user.email}</span>
              </div>
              <div className="bg-gray-900/80 rounded-lg shadow-xl border border-cyan-700/40 p-6 profile-card-animate">
                <span className="block text-cyan-300 font-semibold mb-1">Institution</span>
                <span className="block text-cyan-100">{user.institution || "-"}</span>
              </div>
              <div className="bg-gray-900/80 rounded-lg shadow-xl border border-cyan-700/40 p-6 profile-card-animate">
                <span className="block text-cyan-300 font-semibold mb-1">Bio</span>
                <span className="block text-cyan-100 whitespace-pre-line">{user.bio || "-"}</span>
              </div>
              <div className="bg-gray-900/80 rounded-lg shadow-xl border border-cyan-700/40 p-6 profile-card-animate">
                <span className="block text-cyan-300 font-semibold mb-1">Created At</span>
                <span className="block text-cyan-100">{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/-/g, ' ') : "-"}</span>
              </div>
              <div className="flex justify-center w-full mt-2">
                <button
                  className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg transition hover:scale-105"
                  onClick={() => navigate("/update-profile")}
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

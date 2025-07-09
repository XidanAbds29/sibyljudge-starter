import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    institute: user?.institute || "",
    bio: user?.bio || "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setForm({
      username: user?.username || "",
      email: user?.email || "",
      institute: user?.institute || "",
      bio: user?.bio || "",
    });
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => setEditing(true);
  const handleCancel = () => {
    setEditing(false);
    setForm({
      username: user?.username || "",
      email: user?.email || "",
      institute: user?.institute || "",
      bio: user?.bio || "",
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Replace with your actual API endpoint
      const res = await fetch(`/api/auth/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();
      setUser(data);
      setSuccess("Profile updated!");
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center font-['Orbitron',_sans-serif]">
      <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-cyan-900/80 to-pink-900/80 rounded-3xl shadow-2xl border border-cyan-700/40 p-10 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-pink-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-cyan-400 mb-8 tracking-wide" style={{ textShadow: "0 0 16px #00fff7, 0 0 32px #00fff7" }}>
            Profile
          </h1>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 border-4 border-cyan-400 shadow-lg flex items-center justify-center text-5xl text-gray-900 font-bold select-none">
                {form.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-cyan-300 font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800/80 border-2 border-cyan-400 text-cyan-200 focus:outline-none focus:border-pink-400 transition shadow"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    disabled
                    className="w-full px-4 py-2 rounded-lg bg-gray-800/80 border-2 border-cyan-400 text-cyan-200 opacity-70 cursor-not-allowed shadow"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-cyan-300 font-semibold mb-1">Institute</label>
              <input
                type="text"
                name="institute"
                value={form.institute}
                onChange={handleChange}
                disabled={!editing}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/80 border-2 border-cyan-400 text-cyan-200 focus:outline-none focus:border-pink-400 transition shadow"
              />
            </div>
            <div>
              <label className="block text-cyan-300 font-semibold mb-1">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                disabled={!editing}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/80 border-2 border-cyan-400 text-cyan-200 focus:outline-none focus:border-pink-400 transition shadow"
              />
            </div>
            {error && <div className="text-red-400 font-bold">{error}</div>}
            {success && <div className="text-green-400 font-bold">{success}</div>}
            <div className="flex gap-4 mt-6">
              {!editing ? (
                <button
                  className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg transition hover:scale-105"
                  onClick={handleEdit}
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg transition hover:scale-105"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="bg-gray-700 text-cyan-300 font-bold py-2.5 px-8 rounded-lg shadow-lg transition hover:bg-gray-600"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

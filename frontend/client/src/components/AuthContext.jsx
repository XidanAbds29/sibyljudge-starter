// frontend/client/src/contexts/AuthContext.jsx
// OR
// frontend/client/src/components/AuthContext.jsx
// (Ensure this path matches your project structure and imports)

import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
        });
        if (res.ok) {
          const { user } = await res.json();
          localStorage.setItem("user", JSON.stringify(user));
          setUser(user);
        } else if (res.status === 401) {
          // Only log out if user was previously logged in (localStorage has user)
          if (localStorage.getItem("user")) {
            localStorage.removeItem("user");
            setUser(null);
          }
        }
        // For other errors, do NOT log out
      } catch {
        // Network/backend error: do NOT log out
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const signUp = async (email, password, username) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, username }),
    });
    if (res.ok) {
      // Return both user and session for confirmation-required handling
      const { user, session } = await res.json();
      setUser(user);
      return { user, session };
    } else {
      const { error } = await res.json();
      return { error };
    }
  };

  const signIn = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const { user } = await res.json();
      setUser(user);
      return { user };
    } else {
      const { error } = await res.json();
      return { error };
    }
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  const value = { user, signUp, signIn, signOut, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-400">
          <div className="flex items-center gap-3 text-xl">
            <svg
              className="animate-spin h-8 w-8"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              {" "}
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />{" "}
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />{" "}
            </svg>
            Initializing Session...
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

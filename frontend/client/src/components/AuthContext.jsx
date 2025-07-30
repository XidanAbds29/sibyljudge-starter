import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../lib/supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AuthContext = createContext({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  isAuthenticated: false,
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error.message);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("jwt");

    const validateSession = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (mounted) {
            setUser(data.user);
            if (window.location.pathname === "/login") {
              window.location.replace("/");
            }
          }
        } else {
          localStorage.removeItem("jwt");
          setUser(null);
          if (window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
        }
      } catch (error) {
        console.error("Error validating session:", error);
        localStorage.removeItem("jwt");
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth state
    const initAuth = async () => {
      try {
        console.log("Checking initial session...");

        // Try to get cached user data first
        const cachedUserData = localStorage.getItem("sb-user-data");
        if (cachedUserData) {
          const parsedUserData = JSON.parse(cachedUserData);
          setUser(parsedUserData);
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (!mounted) return;

        console.log(
          "Initial session:",
          session ? `Found (${session.user.email})` : "None"
        );

        if (session?.user) {
          try {
            const profile = await fetchProfile(session.user.id);
            if (!mounted) return;

            const userData = {
              ...session.user,
              ...(profile || {}),
              sessionExpires: session.expires_at,
            };

            setSession(session);
            setUser(userData);
            localStorage.setItem("sb-user-data", JSON.stringify(userData));

            // Handle initial redirect if needed
            if (window.location.pathname === "/login") {
              console.log("Found existing session, redirecting to home");
              window.location.replace("/");
            }
          } catch (profileError) {
            console.error("Error loading initial profile:", profileError);
            if (!mounted) return;

            const userData = {
              ...session.user,
              sessionExpires: session.expires_at,
            };

            setSession(session);
            setUser(userData);
            localStorage.setItem("sb-user-data", JSON.stringify(userData));
          }
        } else {
          // No session found
          localStorage.removeItem("sb-user-data");
          if (window.location.pathname !== "/login") {
            console.log("No session found, redirecting to login");
            window.location.replace("/login");
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Start initialization
    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signUp = async (email, password, username) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });

      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error("Sign up error:", error.message);
      return { error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log("Attempting to sign in...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.session) {
        console.log("Sign in successful, session obtained");

        try {
          // Fetch profile immediately after successful sign in
          console.log("Fetching user profile after sign in");
          const profile = await fetchProfile(data.user.id);
          console.log("Profile fetch successful:", profile);

          // Update states synchronously
          setSession(data.session);
          setUser({
            ...data.user,
            ...(profile || {}),
            sessionExpires: data.session.expires_at,
          });

          // Force the page to navigate to home after successful login
          if (window.location.pathname === "/login") {
            window.location.replace("/");
          }
        } catch (profileError) {
          console.error("Profile fetch error during sign in:", profileError);
          // Even if profile fetch fails, still set the basic user data
          setSession(data.session);
          setUser({
            ...data.user,
            sessionExpires: data.session.expires_at,
          });

          // Still redirect on basic auth success
          if (window.location.pathname === "/login") {
            window.location.replace("/");
          }
        }
      }

      console.log("Sign in successful");
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error("Sign in error:", error.message);
      return { error: error.message };
    }
  };

  const clearLocalStorage = () => {
    // Clear Supabase specific storage
    localStorage.removeItem("supabase-auth-token");
    localStorage.removeItem("sb-auth-token");

    // Clear any other auth-related items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes("supabase") || key?.includes("sb-")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  const signOut = async () => {
    try {
      console.log("Starting signOut process...");
      setLoading(true);

      // Sign out from Supabase
      console.log("Calling Supabase auth.signOut()...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log("Supabase signOut successful");

      // Clear all auth-related storage
      console.log("Clearing local storage...");
      clearLocalStorage();
      console.log("Local storage cleared");

      // Clear state
      console.log("Clearing auth state...");
      setUser(null);
      setSession(null);
      console.log("Auth state cleared");

      // Add a small delay to ensure state updates are processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("Redirecting to login page...");
      // Force reload to clear any remaining state
      window.location.replace("/login");
    } catch (error) {
      console.error("Sign out error:", error.message);
      console.error("Full error details:", error);
      // Try to clean up even if sign out fails
      clearLocalStorage();
      alert("Failed to sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Expose the authentication context
  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  const isAuthenticated = !!session && !!user;
  const isLoginPage = window.location.pathname === "/login";

  // Show children if:
  // 1. We're not loading AND (user is authenticated OR we're on the login page)
  // 2. OR we're loading but have a user (to prevent flashing during navigation)
  const shouldShowContent =
    (!loading && (isAuthenticated || isLoginPage)) || (loading && user);

  return (
    <AuthContext.Provider value={value}>
      {shouldShowContent ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-400">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-cyan-400 rounded-full border-t-transparent"></div>
            <div className="text-lg flex flex-col items-center gap-1">
              <div>{loading ? "Verifying session..." : "Redirecting..."}</div>
              {user && (
                <div className="text-sm text-cyan-300">{user.email}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

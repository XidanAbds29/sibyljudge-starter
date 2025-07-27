// frontend/client/src/components/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
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

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event);

      if (!mounted) return;

      // Update session state
      setSession(currentSession);

      if (event === "SIGNED_IN") {
        if (currentSession?.user) {
          console.log("User signed in:", currentSession.user.email);
          try {
            const profile = await fetchProfile(currentSession.user.id);
            if (mounted) {
              setUser({
                ...currentSession.user,
                ...profile,
              });
            }
          } catch (error) {
            console.error("Error updating user data:", error);
            if (mounted) {
              setUser(currentSession.user);
            }
          }
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
      }

      setLoading(false);
    });

    // Get initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        if (!mounted) return;

        console.log(
          "Initial session check:",
          initialSession ? "Found session" : "No session"
        );

        if (initialSession?.user) {
          setSession(initialSession);
          try {
            const profile = await fetchProfile(initialSession.user.id);
            if (mounted) {
              setUser({
                ...initialSession.user,
                ...profile,
              });
            }
          } catch (error) {
            console.error("Error loading initial profile:", error);
            if (mounted) {
              setUser(initialSession.user);
            }
          }
        }

        setLoading(false);
      });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
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

      console.log("Sign in successful");
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error("Sign in error:", error.message);
      return { error: error.message };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear state
      setUser(null);
      setSession(null);

      // Redirect to login
      window.location.replace("/login");
    } catch (error) {
      console.error("Sign out error:", error.message);
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

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-400">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-cyan-400 rounded-full border-t-transparent"></div>
            <div className="text-lg">
              {user
                ? `Loading session for ${user.email}...`
                : "Initializing..."}
            </div>
          </div>
        </div>
      ) : (
        children
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

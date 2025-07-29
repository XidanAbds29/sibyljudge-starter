// frontend/client/src/components/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
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
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth initialization error:", error);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log("Session found, fetching profile...");
          try {
            const profile = await fetchProfile(session.user.id);
            console.log("Profile fetched:", profile);

            setUser({
              ...session.user,
              ...(profile || {}),
              sessionExpires: session.expires_at,
            });
          } catch (error) {
            console.error("Profile fetch error:", error);
            setUser({
              ...session.user,
              sessionExpires: session.expires_at,
            });
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("Session initialization error:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (event === "SIGNED_OUT") {
        setUser(null);
        window.location.href = "/login";
        return;
      }

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser({
          ...session.user,
          ...(profile || {}),
          sessionExpires: session.expires_at,
        });

        if (
          window.location.pathname === "/login" ||
          window.location.pathname === "/signup"
        ) {
          window.location.href = "/";
        }
      }
    });

    return () => {
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
      return { error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        const profile = await fetchProfile(data.user.id);
        setUser({
          ...data.user,
          ...(profile || {}),
          sessionExpires: data.session.expires_at,
        });
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      return { error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const value = {
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
          <div className="flex items-center gap-3 text-xl">
            <div className="animate-spin h-8 w-8 border-4 border-cyan-400 rounded-full border-t-transparent"></div>
            Initializing Session...
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

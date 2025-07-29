npm list @supabase/supabase-jsnpm list @supabase/supabase-js// frontend/client/src/components/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

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
    let mounted = true;
    let authListener = null;

    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        console.log("Starting auth initialization...");
        
        // First, get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Auth initialization error:", sessionError);
          setUser(null);
          setLoading(false);
          return;
        }

        // Early exit if no session
        if (!sessionData?.session?.user) {
          console.log("No active session found");
          setUser(null);
          setLoading(false);
          
          // Only redirect if not already on login page
          if (window.location.pathname !== "/login") {
            console.log("No session found, redirecting to login...");
            window.location.replace("/login");
          }
          return;
        }

        // We have a session, let's verify it
        console.log("Active session found, verifying...");
        try {
          // Attempt to get user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            throw new Error("Failed to verify user");
          }

          console.log("Session verified for user:", user.email);
          
          // Get profile data
          const profile = await fetchProfile(user.id);
          console.log("Profile data:", profile);

          if (!mounted) return;

          const userData = {
            ...user,
            ...(profile || {}),
            sessionExpires: sessionData.session.expires_at,
          };

          console.log("Setting verified user data:", userData);
          setUser(userData);
          setLoading(false);

          // Handle redirect if needed
          if (window.location.pathname === "/login") {
            console.log("Redirecting to home with verified session");
            window.location.replace("/");
          }
        } catch (error) {
          console.error("Session verification failed:", error);
          // Clear invalid session
          await supabase.auth.signOut();
          if (mounted) {
            setUser(null);
            setLoading(false);
            if (window.location.pathname !== "/login") {
              window.location.replace("/login");
            }
          }
        }
      } catch (e) {
        console.error("Session initialization error:", e);
        if (!mounted) return;
        setUser(null);
      } finally {
        if (mounted) {
          console.log("Auth initialization complete, setting loading to false");
          setLoading(false);
        }
      }
    };

    console.log("Starting auth initialization process...");
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, "User:", session?.user?.email);

      if (!mounted) return;

      setLoading(true);
      
      try {
        switch (event) {
          case "SIGNED_OUT":
            console.log("User signed out");
            setUser(null);
            setLoading(false);
            if (window.location.pathname !== "/login") {
              window.location.replace("/login");
            }
            return;

          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
            if (session?.user) {
              console.log("Processing sign in/token refresh for user:", session.user.email);
              try {
                const profile = await fetchProfile(session.user.id);
                if (!mounted) return;
                
                const userData = {
                  ...session.user,
                  ...(profile || {}),
                  sessionExpires: session.expires_at,
                };
                console.log("Setting user data:", userData);
                setUser(userData);
                setLoading(false);

                // Handle redirect
                const currentPath = window.location.pathname;
                if (currentPath === "/login" || currentPath === "/signup") {
                  console.log("Auth complete, redirecting to home");
                  setTimeout(() => {
                    if (mounted) {
                      window.location.replace("/");
                    }
                  }, 100);
                }
              } catch (error) {
                console.error("Error updating user data:", error);
                if (!mounted) return;
                
                const userData = {
                  ...session.user,
                  sessionExpires: session.expires_at,
                };
                setUser(userData);
                setLoading(false);
              }
            }
            break;

          default:
            console.log("Unhandled auth event:", event);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      console.log("Cleaning up auth effect...");
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
      return { error: error.message };
    }
  };

  const signIn = async (email, password) => {
    console.log("Starting sign in process...");
    setLoading(true);
    try {
      // Clear any existing session first
      await supabase.auth.signOut();
      
      // Step 1: Sign in with Supabase
      console.log("Attempting Supabase authentication...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }

      if (!data?.user || !data?.session) {
        console.error("No user or session data received");
        throw new Error("Login failed: No user data received");
      }

      console.log("Sign in successful for user:", data.user.email);

      // Step 2: Fetch user profile
      try {
        console.log("Fetching user profile...");
        const profile = await fetchProfile(data.user.id);
        console.log("Profile data:", profile);

        // Step 3: Update user state
        const userData = {
          ...data.user,
          ...(profile || {}),
          sessionExpires: data.session.expires_at,
        };
        console.log("Setting user state with:", userData);
        setUser(userData);

        // Step 4: Redirect if needed
        if (window.location.pathname === "/login") {
          console.log("Redirecting to home page...");
          window.location.href = "/";
        }

        return { user: data.user, session: data.session };
      } catch (profileError) {
        console.error("Profile fetch error:", profileError);
        // Set basic user data even if profile fetch fails
        const userData = {
          ...data.user,
          sessionExpires: data.session.expires_at,
        };
        console.log("Setting basic user state:", userData);
        setUser(userData);

        if (window.location.pathname === "/login") {
          console.log("Redirecting to home page despite profile error...");
          window.location.href = "/";
        }

        return { user: data.user, session: data.session };
      }
    } catch (error) {
      console.error("Sign in process error:", error);
      setUser(null);
      return { error: error.message };
    } finally {
      console.log("Sign in process complete, setting loading to false");
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear the user state first
      setUser(null);

      // Clear any cached session data
      localStorage.removeItem("supabase.auth.token");

      // Add a small delay to ensure state updates are processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect to login page
      window.location.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
      alert("Failed to sign out. Please try again.");
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
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-cyan-400 rounded-full border-t-transparent"></div>
            <div className="text-xl flex flex-col items-center gap-2">
              <div>{user ? "Loading your session..." : "Initializing..."}</div>
              <div className="text-sm text-cyan-300">
                {user?.email && `Logged in as ${user.email}`}
              </div>
            </div>
          </div>
        </div>
      ) : !user && window.location.pathname !== "/login" ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-400">
          <div className="flex flex-col items-center gap-3">
            <div>Redirecting to login...</div>
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

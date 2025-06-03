// frontend/client/src/contexts/AuthContext.jsx 
// OR
// frontend/client/src/components/AuthContext.jsx 
// (Ensure this path matches your project structure and imports)

import React, { createContext, useState, useEffect, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("AuthContext: Supabase client initialized.");
} else {
  console.error("AuthContext: Supabase URL or Key is MISSING. Check .env file and VITE_ prefix.");
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true

  useEffect(() => {
    if (!supabase) {
      console.error("AuthContext: Supabase client not available, cannot proceed with auth logic.");
      setLoading(false); 
      return;
    }

    console.log("AuthContext: useEffect running to fetch initial session and set up listener.");

    const fetchInitialSessionAndProfile = async () => {
      console.log("AuthContext: Attempting to get current session (initial)...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("AuthContext: Error fetching initial session:", sessionError.message);
        setUser(null);
        setProfile(null);
        setLoading(false); 
        return;
      }
      
      console.log("AuthContext: Initial session data received:", session);
      setUser(session?.user ?? null);
      setLoading(false); // Set loading to false after session is known

      if (session?.user) {
        console.log("AuthContext: User found in initial session, fetching profile for ID:", session.user.id);
        const profileFetchStart = Date.now();
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles') 
          .select('*')
          .eq('id', session.user.id)
          .single();
        const profileFetchEnd = Date.now();
        console.log(`AuthContext: Initial profile fetch took ${profileFetchEnd - profileFetchStart}ms`);
        
        if (profileError) {
          console.error("AuthContext: Error fetching profile for initial session user:", profileError.message);
          setProfile(null); 
        } else {
          console.log("AuthContext: Profile fetched for initial session user:", userProfile);
          setProfile(userProfile);
        }
      } else {
        setProfile(null);
      }
    };

    fetchInitialSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthContext: onAuthStateChange event:", event, "session:", session);
        
        setUser(session?.user ?? null);
        setLoading(false); 

        if (session?.user) {
          console.log("AuthContext: User found in auth state change, fetching profile for ID:", session.user.id);
          const profileFetchStart = Date.now();
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles') 
            .select('*')
            .eq('id', session.user.id)
            .single();
          const profileFetchEnd = Date.now();
          console.log(`AuthContext: Profile fetch on auth change took ${profileFetchEnd - profileFetchStart}ms`);
          
          if (profileError) {
            console.error("AuthContext: Error fetching profile on auth state change:", profileError.message);
            setProfile(null);
          } else {
            console.log("AuthContext: Profile fetched on auth state change:", userProfile);
            setProfile(userProfile);
          }
        } else {
          console.log("AuthContext: No user in session on auth state change. Clearing profile.");
          setProfile(null);
        }
      }
    );

    return () => {
      console.log("AuthContext: Unsubscribing auth listener.");
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, username, additionalData = {}) => {
    if (!supabase) return { error: { message: "Supabase not initialized" } };
    console.log("AuthContext: Attempting signUp for:", email, "with username:", username);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, ...additionalData },
      },
    });
    if (error) console.error("AuthContext: SignUp error:", error.message);
    else console.log("AuthContext: SignUp response data:", data);
    return { data, error };
  };

  const signIn = async (email, password) => {
    if (!supabase) return { error: { message: "Supabase not initialized" } };
    console.log("AuthContext: Attempting signIn for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error("AuthContext: SignIn error:", error.message);
    else console.log("AuthContext: SignIn response data:", data);
    return { data, error };
  };

  // --- MODIFIED signOut function for optimistic update ---
  const signOut = async () => {
    if (!supabase) return { error: { message: "Supabase not initialized" } };
    console.log("AuthContext: Attempting signOut (optimistic UI update).");
    
    // Optimistically update local state to reflect sign-out immediately
    setUser(null);
    setProfile(null);
    // setLoading(false); // setLoading(false) is already handled by onAuthStateChange which will fire

    // Perform the actual sign out from Supabase in the background
    const { error } = await supabase.auth.signOut(); 
    
    if (error) {
      console.error("AuthContext: Supabase SignOut error:", error.message);
      // If Supabase sign-out failed, the session might still be active.
      // onAuthStateChange might not fire with SIGNED_OUT, or might fire with an old session.
      // To be robust, you could re-fetch the session here to ensure UI consistency.
      // For now, we rely on onAuthStateChange to eventually correct the state if needed.
      // Or, you could force a page reload or show a persistent error.
    } else {
      console.log("AuthContext: Supabase SignOut successful (network call complete).");
    }
    // The onAuthStateChange listener will also fire upon successful or failed Supabase signout,
    // re-confirming the user and profile state and ensuring loading is false.
    return { error };
  };
  // --- END MODIFIED signOut function ---

  const value = { user, profile, signUp, signIn, signOut, loading, supabase };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : 
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-400">
            <div className="flex items-center gap-3 text-xl">
                <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" > <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /> </svg>
                Initializing Session...
            </div>
        </div>
      }
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import UserBadges from '../components/UserBadges';
import { supabase } from '../lib/supabaseClient';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-red-500 text-center p-8">
        {error || 'Profile not found'}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
            {profile.institution && (
              <p className="text-gray-400">{profile.institution}</p>
            )}
          </div>
          {user?.id === userId && (
            <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">
              Edit Profile
            </button>
          )}
        </div>
        {profile.bio && (
          <p className="text-gray-300 mb-4">{profile.bio}</p>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Badges</h2>
        <UserBadges userId={userId} />
      </div>
    </div>
  );
}

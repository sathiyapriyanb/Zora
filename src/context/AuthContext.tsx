import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, fetchUserProfile, upsertUserProfile } from '../lib/firebase';
import { UserProfile, Department, YearOfStudy, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  mockLogin: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  toggleAdminRole: () => void;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [adminOverride, setAdminOverride] = useState<boolean>(() => {
    return localStorage.getItem('rtc_admin_override') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await fetchUserProfile(firebaseUser.uid);
        if (p) {
          setProfile(p);
        } else {
          // New user prompt for student details
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'RTC Student',
            email: firebaseUser.email || '',
            department: 'CSE',
            year: '3rd Year',
            section: 'A',
            role: firebaseUser.email?.includes('admin') ? 'admin' : 'student',
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: Date.now(),
          };
          setProfile(newProfile);
          setShowProfileModal(true);
          await upsertUserProfile(newProfile);
        }
      } else {
        // Check if there is a cached mock profile for offline/preview testing
        const cached = localStorage.getItem('rtc_cached_profile');
        if (cached) {
          try {
            setProfile(JSON.parse(cached));
          } catch (e) {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      // If popup fails (e.g. iframe cross-origin restrictions in preview), offer mock login
      mockLogin('student');
    } finally {
      setLoading(false);
    }
  };

  const mockLogin = async (role: UserRole = 'student') => {
    const mockUid = 'rtc-student-' + Math.floor(1000 + Math.random() * 9000);
    const mockProfile: UserProfile = {
      uid: mockUid,
      name: role === 'admin' ? 'RTC Campus Administrator' : 'Sathiyapriyan B.',
      email: role === 'admin' ? 'admin.lostfound@rathinam.in' : 'sathiyapriyan.b@rathinam.in',
      department: 'CSE',
      year: role === 'admin' ? 'Faculty / Staff' : '3rd Year',
      section: 'B',
      role: role,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${mockUid}`,
      createdAt: Date.now(),
    };
    setProfile(mockProfile);
    localStorage.setItem('rtc_cached_profile', JSON.stringify(mockProfile));
    await upsertUserProfile(mockProfile);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    localStorage.removeItem('rtc_cached_profile');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      ...data,
    };
    setProfile(updated);
    localStorage.setItem('rtc_cached_profile', JSON.stringify(updated));
    await upsertUserProfile(updated);
  };

  const toggleAdminRole = () => {
    const next = !adminOverride;
    setAdminOverride(next);
    localStorage.setItem('rtc_admin_override', next ? 'true' : 'false');
  };

  const isAdmin = adminOverride || profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        login,
        mockLogin,
        logout,
        updateProfile,
        toggleAdminRole,
        showProfileModal,
        setShowProfileModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
